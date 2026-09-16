using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Npgsql;
using System.Data;
using MassTransit;
using VinFastO2O.Shared.Events;
using VinFastO2O.OrderService.Application.Common.Interfaces;
using VinFastO2O.OrderService.Domain.Entities;
using VinFastO2O.OrderService.Domain.Enums;
using VinFastO2O.OrderService.Domain.ValueObjects;
using VinFastO2O.OrderService.Infrastructure.Persistence;

namespace VinFastO2O.OrderService.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentWebhookController : ControllerBase
{
    private readonly OrderDbContext _orderDbContext;
    private readonly IVehicleLockService _vehicleLockService;
    private readonly ITopicProducer<string, VehicleDepositedEvent> _topicProducer;
    private readonly string _inventoryConnectionString;
    private readonly IVnPayService _vnPayService;
    private readonly IConfiguration _configuration;
    private readonly IHubContext<Hubs.NotificationHub> _hubContext;
    private readonly IEmailService _emailService;
    private readonly ILogger<PaymentWebhookController> _logger;

    public PaymentWebhookController(
        OrderDbContext orderDbContext,
        IVehicleLockService vehicleLockService,
        ITopicProducer<string, VehicleDepositedEvent> topicProducer,
        IConfiguration configuration,
        IVnPayService vnPayService,
        IHubContext<Hubs.NotificationHub> hubContext,
        IEmailService emailService,
        ILogger<PaymentWebhookController> logger)
    {
        _orderDbContext = orderDbContext;
        _vehicleLockService = vehicleLockService;
        _topicProducer = topicProducer;
        _configuration = configuration;
        _vnPayService = vnPayService;
        _hubContext = hubContext;
        _emailService = emailService;
        _inventoryConnectionString = configuration.GetConnectionString("InventoryConnection")
                                     ?? throw new ArgumentNullException("InventoryConnection connection string is missing.");
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> ProcessWebhook([FromBody] PaymentWebhookRequest request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("[Webhook] Received payment webhook via POST. Order ID: {OrderId}, Status: {Status}, Amount: {Amount}",
            request.OrderId, request.TransactionStatus, request.Amount);

        return await ProcessPaymentResultAsync(request.OrderId, request.TransactionStatus, request.Amount, request.TransactionNo, cancellationToken);
    }

    [HttpGet("vnpay-ipn")]
    public async Task<IActionResult> ProcessVnPayIpn(CancellationToken cancellationToken)
    {
        var query = HttpContext.Request.Query;
        var parameters = query.ToDictionary(q => q.Key, q => q.Value.ToString());

        _logger.LogInformation("[VnPayIPN] Received VNPAY IPN callback. Query params count: {Count}", parameters.Count);

        if (!parameters.TryGetValue("vnp_SecureHash", out var secureHash))
        {
            _logger.LogWarning("[VnPayIPN] Missing vnp_SecureHash parameter.");
            return Ok(new { RspCode = "97", Message = "Missing signature" });
        }

        var hashSecret = _configuration["VnPay:HashSecret"] ?? "SUPER_SECRET_VNPAY_HASH_KEY_998877665544332211";
        var isValid = _vnPayService.VerifySignature(parameters, secureHash, hashSecret);
        if (!isValid)
        {
            _logger.LogWarning("[VnPayIPN] Invalid secure hash signature.");
            return Ok(new { RspCode = "97", Message = "Invalid signature" });
        }

        if (!parameters.TryGetValue("vnp_TxnRef", out var vnp_TxnRef) || !Guid.TryParse(vnp_TxnRef, out var orderId))
        {
            _logger.LogWarning("[VnPayIPN] Invalid vnp_TxnRef parameter: {TxnRef}", vnp_TxnRef ?? "null");
            return Ok(new { RspCode = "99", Message = "Invalid order reference" });
        }

        if (!parameters.TryGetValue("vnp_Amount", out var vnp_Amount) || !long.TryParse(vnp_Amount, out var amountRaw))
        {
            _logger.LogWarning("[VnPayIPN] Invalid vnp_Amount parameter: {Amount}", vnp_Amount ?? "null");
            return Ok(new { RspCode = "99", Message = "Invalid amount" });
        }

        var responseCode = parameters.GetValueOrDefault("vnp_ResponseCode", "99");
        var amount = (decimal)amountRaw / 100;
        var transactionNo = parameters.GetValueOrDefault("vnp_TransactionNo", Guid.NewGuid().ToString());

        var transactionStatus = responseCode == "00" ? "Success" : "Failure";

        try
        {
            var result = await ProcessPaymentResultAsync(orderId, transactionStatus, amount, transactionNo, cancellationToken);
            
            if (result is OkObjectResult || result is OkResult)
            {
                return Ok(new { RspCode = "00", Message = "Confirm success" });
            }
            else if (result is NotFoundObjectResult)
            {
                return Ok(new { RspCode = "01", Message = "Order not found" });
            }
            else if (result is BadRequestObjectResult badRequest)
            {
                var val = badRequest.Value?.ToString() ?? "";
                if (val.Contains("amount"))
                {
                    return Ok(new { RspCode = "04", Message = "Invalid amount" });
                }
                return Ok(new { RspCode = "02", Message = "Order already confirmed" });
            }
            
            return Ok(new { RspCode = "99", Message = "System error" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[VnPayIPN] System error processing IPN.");
            return Ok(new { RspCode = "99", Message = "System error: " + ex.Message });
        }
    }

    private async Task<IActionResult> ProcessPaymentResultAsync(
        Guid orderId,
        string transactionStatus,
        decimal amount,
        string? transactionNo,
        CancellationToken cancellationToken)
    {
        var order = await _orderDbContext.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == new OrderId(orderId), cancellationToken);

        if (order == null)
        {
            _logger.LogWarning("[Webhook] Order with ID {OrderId} not found.", orderId);
            return NotFound(new { message = $"Order with ID {orderId} was not found." });
        }

        if (order.DepositAmount != amount)
        {
            _logger.LogWarning("[Webhook] Amount mismatch for Order ID {OrderId}. Expected: {Expected}, Received: {Received}",
                orderId, order.DepositAmount, amount);
            return BadRequest(new { message = $"Incorrect payment amount. Expected {order.DepositAmount}, but received {amount}." });
        }

        var vin = order.Items.FirstOrDefault()?.AssignedVin ?? string.Empty;

        // Idempotency: nếu đơn hàng đã được thanh toán, trả OK luôn không xử lý lại
        if (order.Status == OrderStatus.Paid || order.PaidAt.HasValue)
        {
            _logger.LogInformation("[Webhook] Order ID {OrderId} already paid. Returning success idempotently.", orderId);
            return Ok(new { message = "Order already paid." });
        }

        var txnNo = transactionNo ?? Guid.NewGuid().ToString().Replace("-", "").Substring(0, 15);
        var payment = new Payment(
            PaymentId.New(),
            order.Id,
            txnNo,
            amount,
            PaymentMethod.VNPay
        );

        if (transactionStatus.Equals("Success", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogInformation("[Webhook] Processing SUCCESS payment for Order ID: {OrderId}, VIN: {Vin}", orderId, vin);

            var responseJson = System.Text.Json.JsonSerializer.Serialize(new { message = "Payment succeeded via Webhook.", status = "Success", txnNo = txnNo });
            payment.MarkAsSuccess(responseJson);
            order.AddPayment(payment);
            order.MarkAsPaid();

            using var orderTransaction = await _orderDbContext.Database.BeginTransactionAsync(cancellationToken);
            using var inventoryConnection = new NpgsqlConnection(_inventoryConnectionString);
            await inventoryConnection.OpenAsync(cancellationToken);
            using var inventoryTransaction = await inventoryConnection.BeginTransactionAsync(cancellationToken);

            try
            {
                _orderDbContext.Orders.Update(order);
                await _orderDbContext.SaveChangesAsync(cancellationToken);

                if (!string.IsNullOrWhiteSpace(vin))
                {
                    Guid vehicleId = Guid.Empty;
                    Guid? storeId = null;

                    const string selectVehicleSql = @"SELECT ""Id"", ""StoreId"" FROM vehicles WHERE ""Vin"" = @Vin LIMIT 1;";
                    using (var selectCmd = new NpgsqlCommand(selectVehicleSql, inventoryConnection, inventoryTransaction))
                    {
                        selectCmd.Parameters.AddWithValue("Vin", vin);
                        using var reader = await selectCmd.ExecuteReaderAsync(cancellationToken);
                        if (await reader.ReadAsync(cancellationToken))
                        {
                            vehicleId = reader.GetGuid(0);
                            storeId = reader.IsDBNull(1) ? null : reader.GetGuid(1);
                        }
                    }

                    if (vehicleId != Guid.Empty)
                    {
                        const string updateVehicleSql = @"
                            UPDATE vehicles 
                            SET ""Status"" = 4, ""LastModifiedAt"" = NOW() 
                            WHERE ""Id"" = @VehicleId;";

                        using (var updateCmd = new NpgsqlCommand(updateVehicleSql, inventoryConnection, inventoryTransaction))
                        {
                            updateCmd.Parameters.AddWithValue("VehicleId", vehicleId);
                            await updateCmd.ExecuteNonQueryAsync(cancellationToken);
                        }

                        const string insertLogSql = @"
                            INSERT INTO inventory_logs (""Id"", ""VehicleId"", ""FromStoreId"", ""ToStoreId"", ""Action"", ""Timestamp"", ""PerformedBy"", ""Notes"", ""CreatedAt"", ""LastModifiedAt"")
                            VALUES (@Id, @VehicleId, @FromStoreId, NULL, @Action, NOW(), @PerformedBy, @Notes, NOW(), NOW());";

                        using (var logCmd = new NpgsqlCommand(insertLogSql, inventoryConnection, inventoryTransaction))
                        {
                            logCmd.Parameters.AddWithValue("Id", Guid.NewGuid());
                            logCmd.Parameters.AddWithValue("VehicleId", vehicleId);
                            logCmd.Parameters.AddWithValue("FromStoreId", storeId.HasValue ? (object)storeId.Value : DBNull.Value);
                            logCmd.Parameters.AddWithValue("Action", 4);
                            logCmd.Parameters.AddWithValue("PerformedBy", "PaymentWebhook-Success");
                            logCmd.Parameters.AddWithValue("Notes", $"Xe VIN {vin} chính thức chuyển sang RESERVED do đơn hàng {orderId} đã thanh toán thành công.");
                            await logCmd.ExecuteNonQueryAsync(cancellationToken);
                        }
                    }
                }

                var eventMessage = new VehicleDepositedEvent(
                    order.Id.Value,
                    order.CustomerId,
                    vin,
                    order.StoreId,
                    order.DepositAmount,
                    DateTime.UtcNow
                );

                var outboxEvent = new OutboxEvent
                {
                    EventType = nameof(VehicleDepositedEvent),
                    Payload = System.Text.Json.JsonSerializer.Serialize(eventMessage),
                    CreatedAt = DateTime.UtcNow
                };

                await _orderDbContext.OutboxEvents.AddAsync(outboxEvent, cancellationToken);
                await _orderDbContext.SaveChangesAsync(cancellationToken);

                await orderTransaction.CommitAsync(cancellationToken);
                await inventoryTransaction.CommitAsync(cancellationToken);

                _logger.LogInformation("[Webhook] Coordinated DB transaction succeeded for Order: {OrderId}, VIN: {Vin}", orderId, vin);

                // Broadcast real-time notifications via SignalR
                var firstItem = order.Items.FirstOrDefault();
                var productName = firstItem?.ProductName ?? "Xe điện VinFast";
                var paidAt = order.PaidAt ?? DateTime.UtcNow;

                // 1. For Customer order detail tracking page
                await _hubContext.Clients.All.SendAsync("ReceiveOrderPaidNotification", new
                {
                    OrderId = order.Id.Value.ToString(),
                    CustomerId = order.CustomerId.ToString(),
                    CustomerName = order.CustomerName,
                    AssignedVin = vin,
                    DepositAmount = order.DepositAmount,
                    PaidAt = paidAt
                });

                // 2. For Admin notification toast
                await _hubContext.Clients.All.SendAsync("ReceiveNewDepositNotification", new
                {
                    OrderId = order.Id.Value.ToString(),
                    CustomerName = order.CustomerName,
                    CustomerPhone = order.CustomerPhone,
                    ProductName = productName,
                    DepositAmount = order.DepositAmount,
                    Timestamp = paidAt.ToString("HH:mm:ss")
                });

                // 3. Send email receipt bill with QR Code to Customer
                var recipientEmail = order.CustomerEmail;
                var recipientName = order.CustomerName;
                var currentOrderId = order.Id.Value;
                var currentDepositAmount = order.DepositAmount;

                _ = Task.Run(async () =>
                {
                    try
                    {
                        _logger.LogInformation("[Webhook] Sending deposit confirmation bill email to {Email}", recipientEmail);
                        await _emailService.SendDepositConfirmationEmailAsync(
                            recipientEmail,
                            recipientName,
                            currentOrderId,
                            productName,
                            currentDepositAmount
                        );
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "[Webhook] Failed to send deposit bill email to {Email}", recipientEmail);
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Webhook] Coordinated DB transaction failed. Rolling back both transactions.");
                await orderTransaction.RollbackAsync(cancellationToken);
                await inventoryTransaction.RollbackAsync(cancellationToken);
                return StatusCode(500, new { message = "Lỗi toàn vẹn giao dịch: " + ex.Message });
            }

            if (!string.IsNullOrWhiteSpace(vin))
            {
                await _vehicleLockService.ReleaseVehicleLockAsync(vin);
            }

            return Ok(new { message = "Giao dịch thanh toán thành công và xác thực xe hoàn tất." });
        }
        else
        {
            _logger.LogWarning("[Webhook] Processing FAILED payment for Order ID: {OrderId}, VIN: {Vin}", orderId, vin);

            var responseJson = System.Text.Json.JsonSerializer.Serialize(new { message = "Payment failed from gateway Webhook.", status = "Failed", txnNo = txnNo });
            payment.MarkAsFailed(responseJson);
            order.AddPayment(payment);
            order.CancelOrder("Thanh toán thất bại từ cổng thanh toán");

            using var orderTransaction = await _orderDbContext.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                _orderDbContext.Orders.Update(order);
                await _orderDbContext.SaveChangesAsync(cancellationToken);

                await orderTransaction.CommitAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                await orderTransaction.RollbackAsync(cancellationToken);
                _logger.LogError(ex, "[Webhook] Order cancel transaction failed.");
                return StatusCode(500, new { message = "Lỗi khi cập nhật hủy đơn hàng: " + ex.Message });
            }

            if (!string.IsNullOrWhiteSpace(vin))
            {
                await _vehicleLockService.ReleaseVehicleLockAsync(vin);
            }
            return Ok(new { message = "Đã hủy đơn hàng và giải phóng xe trong hệ thống." });
        }
    }
}

public record PaymentWebhookRequest(
    Guid OrderId,
    string TransactionStatus,
    decimal Amount,
    string? TransactionNo = null
);
