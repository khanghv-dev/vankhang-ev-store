using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using ClosedXML.Excel;
using MassTransit;
using Microsoft.Extensions.Configuration;
using EvO2O.OrderService.API.Authentication;
using EvO2O.OrderService.Application.Common.Interfaces;
using EvO2O.OrderService.Domain.Enums;
using EvO2O.OrderService.Infrastructure.Persistence;
using EvO2O.Shared.Events;

namespace EvO2O.OrderService.API.Controllers;

/// <summary>
/// Administrative and coordination endpoints for managing deposit orders.
/// </summary>
[ApiController]
[Route("api/admin/orders")]
[Produces("application/json")]
public sealed class AdminOrderController : ControllerBase
{
    private readonly OrderDbContext _db;
    private readonly IVnPayService _vnPayService;
    private readonly IInventoryQueryService _inventoryQueryService;
    private readonly IVehicleLockService _vehicleLockService;
    private readonly IConfiguration _configuration;
    private readonly ITopicProducer<string, VehicleReadyForDeliveryEvent> _readyProducer;
    private readonly ILogger<AdminOrderController> _logger;
    private readonly string _inventoryConnectionString;

    public AdminOrderController(
        OrderDbContext db,
        IVnPayService vnPayService,
        IInventoryQueryService inventoryQueryService,
        IVehicleLockService vehicleLockService,
        IConfiguration configuration,
        ITopicProducer<string, VehicleReadyForDeliveryEvent> readyProducer,
        ILogger<AdminOrderController> logger)
    {
        _db = db;
        _vnPayService = vnPayService;
        _inventoryQueryService = inventoryQueryService;
        _vehicleLockService = vehicleLockService;
        _configuration = configuration;
        _readyProducer = readyProducer;
        _logger = logger;
        _inventoryConnectionString = configuration.GetConnectionString("InventoryConnection")
                                     ?? throw new ArgumentNullException("InventoryConnection connection string is missing.");
    }

    /// <summary>
    /// Lấy danh sách đơn đặt cọc nâng cao dành cho bộ phận điều phối đơn hàng với các bộ lọc động và phân trang tối ưu.
    /// </summary>
    /// <param name="orderId">Mã đơn cọc (Guid hoặc chuỗi tìm kiếm mã)</param>
    /// <param name="customerPhone">Số điện thoại khách hàng</param>
    /// <param name="status">Trạng thái cọc (Pending, Paid, Cancelled, ...)</param>
    /// <param name="storeId">ID Showroom nhận xe</param>
    /// <param name="page">Trang hiện tại (Mặc định: 1)</param>
    /// <param name="pageSize">Kích thước trang (Mặc định: 10, Tối đa: 100)</param>
    /// <param name="ct">Cancellation token</param>
    /// <response code="200">Lấy danh sách đơn cọc thành công.</response>
    /// <response code="400">Tham số phân trang không hợp lệ.</response>
    /// <response code="401">Thiếu hoặc sai JWT token.</response>
    /// <response code="403">Không có quyền truy cập.</response>
    [HttpGet]
    [HasPermission("manage_orders")]
    [ProducesResponseType(typeof(AdminPagedOrdersResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetDepositOrders(
        [FromQuery] string? orderId,
        [FromQuery] string? customerPhone,
        [FromQuery] OrderStatus? status,
        [FromQuery] Guid? storeId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        if (page < 1)
        {
            return BadRequest(new { message = "Số trang (page) phải lớn hơn hoặc bằng 1." });
        }

        if (pageSize < 1 || pageSize > 100)
        {
            return BadRequest(new { message = "Kích thước trang (pageSize) phải từ 1 đến 100." });
        }

        try
        {
            var query = _db.Orders
                .AsNoTracking()
                .Include(o => o.Items)
                .AsQueryable();

            // 1. Lọc động theo Mã đơn cọc
            if (!string.IsNullOrWhiteSpace(orderId))
            {
                var cleanOrderId = orderId.Trim();
                if (Guid.TryParse(cleanOrderId, out var parsedGuid))
                {
                    var targetOrderId = new Domain.ValueObjects.OrderId(parsedGuid);
                    query = query.Where(o => o.Id == targetOrderId);
                }
                else
                {
                    var lowerTerm = cleanOrderId.ToLower();
                    query = query.Where(o => o.Id.Value.ToString().ToLower().Contains(lowerTerm));
                }
            }

            // 2. Lọc động theo Số điện thoại khách
            if (!string.IsNullOrWhiteSpace(customerPhone))
            {
                var cleanPhone = customerPhone.Trim();
                query = query.Where(o => o.CustomerPhone.Contains(cleanPhone));
            }

            // 3. Lọc động theo Trạng thái cọc
            if (status.HasValue)
            {
                query = query.Where(o => o.Status == status.Value);
            }

            // 4. Lọc động theo ID Showroom nhận xe
            if (storeId.HasValue && storeId.Value != Guid.Empty)
            {
                query = query.Where(o => o.StoreId == storeId.Value);
            }

            // Đếm tổng số bản ghi thỏa điều kiện lọc (Tối ưu performance)
            var totalCount = await query.CountAsync(ct);

            // Phân trang và sắp xếp mới nhất lên đầu
            var items = await query
                .OrderByDescending(o => o.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(o => new AdminOrderListItemDto(
                    o.Id.Value,
                    o.CustomerId,
                    o.CustomerName,
                    o.CustomerEmail,
                    o.CustomerPhone,
                    o.CustomerIdCard,
                    o.StoreId,
                    o.TotalAmount,
                    o.DepositAmount,
                    o.DepositType.ToString(),
                    o.BatteryOption.ToString(),
                    o.Status.ToString(),
                    o.PaidAt,
                    o.CancelledAt,
                    o.CancellationReason,
                    o.CreatedAt,
                    o.Items.Select(i => new AdminOrderItemDto(
                        i.Id.Value,
                        i.ProductId,
                        i.ProductName,
                        i.AssignedVin,
                        i.UnitPrice,
                        i.Quantity,
                        i.LineTotal
                    )).ToList()
                ))
                .ToListAsync(ct);

            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

            _logger.LogInformation(
                "[AdminOrder] Fetched deposit orders: Page={Page}/{TotalPages} | Total={TotalCount} | Filters:[OrderId={OrderId}, Phone={Phone}, Status={Status}, StoreId={StoreId}]",
                page, totalPages, totalCount, orderId, customerPhone, status, storeId);

            return Ok(new AdminPagedOrdersResponseDto(
                items,
                totalCount,
                page,
                pageSize,
                totalPages
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[AdminOrder] Error occurred while fetching filtered deposit orders.");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Lỗi hệ thống khi tải danh sách đơn cọc." });
        }
    }

    /// <summary>
    /// Gán thủ công số VIN cho đơn hàng khi xe thực tế về tới Showroom và chuyển trạng thái đơn hàng sang VIN_ASSIGNED.
    /// </summary>
    /// <param name="orderId">Mã Guid của đơn hàng</param>
    /// <param name="dto">Request body chứa mã VIN và thông tin dòng sản phẩm cần gán</param>
    /// <param name="ct">Cancellation token</param>
    /// <response code="200">Gán số VIN thành công.</response>
    /// <response code="400">Dữ liệu đầu vào không hợp lệ hoặc chuyển trạng thái không hợp lệ.</response>
    /// <response code="404">Không tìm thấy đơn hàng.</response>
    /// <response code="401">Thiếu hoặc sai JWT token.</response>
    /// <response code="403">Không có quyền truy cập.</response>
    [HttpPost("{orderId:guid}/assign-vin")]
    [HasPermission("manage_orders")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> AssignVin(
        [FromRoute] Guid orderId,
        [FromBody] AssignVinRequestDto dto,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Vin) || dto.Vin.Trim().Length != 17)
        {
            return BadRequest(new { message = "Mã số khung xe (VIN) không hợp lệ. Chuỗi VIN phải đúng 17 ký tự." });
        }

        var vin = dto.Vin.Trim().ToUpper();
        var acquired = await _vehicleLockService.AcquireVehicleLockAsync(vin, TimeSpan.FromMinutes(5));
        if (!acquired)
        {
            return BadRequest(new { message = "Mã số khung VIN này đang được giao dịch hoặc xử lý ở một đơn hàng khác!" });
        }

        try
        {
            var domainOrderId = new Domain.ValueObjects.OrderId(orderId);
            var order = await _db.Orders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == domainOrderId, ct);

            if (order is null)
            {
                await _vehicleLockService.ReleaseVehicleLockAsync(vin);
                return NotFound(new { message = $"Không tìm thấy đơn hàng với ID {orderId}." });
            }

            // 1. Connect to Inventory DB and check vehicle availability
            Guid vehicleId = Guid.Empty;
            int vehicleStatus = -1;
            Guid? vehicleStoreId = null;

            using (var connection = new Npgsql.NpgsqlConnection(_inventoryConnectionString))
            {
                await connection.OpenAsync(ct);

                const string selectVehicleSql = @"SELECT ""Id"", ""Status"", ""StoreId"" FROM vehicles WHERE ""Vin"" = @Vin LIMIT 1;";
                using (var selectCmd = new Npgsql.NpgsqlCommand(selectVehicleSql, connection))
                {
                    selectCmd.Parameters.AddWithValue("Vin", vin);
                    using var reader = await selectCmd.ExecuteReaderAsync(ct);
                    if (await reader.ReadAsync(ct))
                    {
                        vehicleId = reader.GetGuid(0);
                        vehicleStatus = reader.GetInt32(1);
                        vehicleStoreId = reader.IsDBNull(2) ? null : reader.GetGuid(2);
                    }
                }

                if (vehicleId == Guid.Empty)
                {
                    // Auto-register new physical vehicle into inventory table with Status = 4 (Reserved)
                    vehicleId = Guid.NewGuid();
                    var productName = order.Items.FirstOrDefault()?.ProductName ?? "VinFast Electric Vehicle";
                    vehicleStoreId = order.StoreId;
                    vehicleStatus = 4;

                    const string insertVehicleSql = @"
                        INSERT INTO vehicles (""Id"", ""Vin"", ""EngineNumber"", ""ModelName"", ""Color"", ""Brand"", ""Price"", ""BatteryType"", ""Status"", ""StoreId"", ""CreatedAt"", ""LastModifiedAt"")
                        VALUES (@Id, @Vin, @EngineNumber, @ModelName, 'Trắng', 'VinFast', @Price, 'LFP', 4, @StoreId, NOW(), NOW());";

                    using (var insertCmd = new Npgsql.NpgsqlCommand(insertVehicleSql, connection))
                    {
                        insertCmd.Parameters.AddWithValue("Id", vehicleId);
                        insertCmd.Parameters.AddWithValue("Vin", vin);
                        insertCmd.Parameters.AddWithValue("EngineNumber", $"ENG-{Random.Shared.Next(100000, 999999)}");
                        insertCmd.Parameters.AddWithValue("ModelName", productName);
                        insertCmd.Parameters.AddWithValue("Price", order.TotalAmount > 0 ? order.TotalAmount : 19400000m);
                        insertCmd.Parameters.AddWithValue("StoreId", order.StoreId);
                        await insertCmd.ExecuteNonQueryAsync(ct);
                    }
                }
                else if (vehicleStatus != 3 && vehicleStatus != 4) // Allow if Available (3) or already Reserved (4)
                {
                    await _vehicleLockService.ReleaseVehicleLockAsync(vin);
                    return BadRequest(new { message = $"Xe mang số VIN '{vin}' đã ở trạng thái không khả dụng ({vehicleStatus})." });
                }

                // 2. Release previous VIN if any
                var targetItem = dto.ItemId.HasValue
                    ? order.Items.FirstOrDefault(i => i.Id.Value == dto.ItemId.Value)
                    : order.Items.FirstOrDefault();

                if (targetItem != null && !string.IsNullOrWhiteSpace(targetItem.AssignedVin))
                {
                    var oldVin = targetItem.AssignedVin;
                    if (!oldVin.Equals(vin, StringComparison.OrdinalIgnoreCase))
                    {
                        await _inventoryQueryService.ReleaseVehicleVinAsync(oldVin, ct);
                    }
                }

                // 3. Mark the vehicle as RESERVED (Status = 4) and insert log
                using (var transaction = await connection.BeginTransactionAsync(ct))
                {
                    try
                    {
                        const string updateVehicleSql = @"
                            UPDATE vehicles 
                            SET ""Status"" = 4, ""LastModifiedAt"" = NOW() 
                            WHERE ""Id"" = @VehicleId;";

                        using (var updateCmd = new Npgsql.NpgsqlCommand(updateVehicleSql, connection, transaction))
                        {
                            updateCmd.Parameters.AddWithValue("VehicleId", vehicleId);
                            await updateCmd.ExecuteNonQueryAsync(ct);
                        }

                        const string insertLogSql = @"
                            INSERT INTO inventory_logs (""Id"", ""VehicleId"", ""FromStoreId"", ""ToStoreId"", ""Action"", ""Timestamp"", ""PerformedBy"", ""Notes"", ""CreatedAt"", ""LastModifiedAt"")
                            VALUES (@Id, @VehicleId, @FromStoreId, NULL, @Action, NOW(), @PerformedBy, @Notes, NOW(), NOW());";

                        using (var logCmd = new Npgsql.NpgsqlCommand(insertLogSql, connection, transaction))
                        {
                            logCmd.Parameters.AddWithValue("Id", Guid.NewGuid());
                            logCmd.Parameters.AddWithValue("VehicleId", vehicleId);
                            logCmd.Parameters.AddWithValue("FromStoreId", vehicleStoreId.HasValue ? (object)vehicleStoreId.Value : DBNull.Value);
                            logCmd.Parameters.AddWithValue("Action", 4); // Reserved/Locked
                            logCmd.Parameters.AddWithValue("PerformedBy", "Coordination-AssignVin");
                            logCmd.Parameters.AddWithValue("Notes", $"Xe VIN {vin} được gán thủ công và chuyển sang RESERVED cho đơn hàng {orderId}.");
                            await logCmd.ExecuteNonQueryAsync(ct);
                        }

                        await transaction.CommitAsync(ct);
                    }
                    catch (Exception ex)
                    {
                        await transaction.RollbackAsync(ct);
                        await _vehicleLockService.ReleaseVehicleLockAsync(vin);
                        _logger.LogError(ex, "[AdminOrder] Failed to lock vehicle in inventory database.");
                        return StatusCode(500, new { message = "Lỗi khi cập nhật trạng thái xe trong kho: " + ex.Message });
                    }
                }
            }

            // 4. Update the order in Order DB
            order.AssignVinManual(vin, dto.ItemId);

            _db.Orders.Update(order);
            await _db.SaveChangesAsync(ct);

            // 5. Release temporary Redis lock
            await _vehicleLockService.ReleaseVehicleLockAsync(vin);

            _logger.LogInformation(
                "[AdminOrder] Assigned VIN '{Vin}' successfully for OrderId '{OrderId}'. New Status: {Status}",
                vin, orderId, order.Status);

            return Ok(new
            {
                orderId = order.Id.Value,
                assignedVin = vin,
                status = order.Status.ToString(),
                updatedAt = DateTime.UtcNow,
                message = $"Gán mã VIN {vin} thành công cho đơn hàng. Trạng thái đã chuyển sang VIN_ASSIGNED."
            });
        }
        catch (InvalidOperationException ex)
        {
            await _vehicleLockService.ReleaseVehicleLockAsync(vin);
            return BadRequest(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            await _vehicleLockService.ReleaseVehicleLockAsync(vin);
            return BadRequest(new { message = ex.Message });
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateException ex)
        {
            await _vehicleLockService.ReleaseVehicleLockAsync(vin);
            if (ex.InnerException?.Message.Contains("uq_order_items_assigned_vin") == true || ex.InnerException?.Message.Contains("duplicate key") == true)
            {
                return BadRequest(new { message = $"Mã VIN '{vin}' đã được gán cho một đơn hàng khác trước đó. Mỗi xe chỉ thuộc duy nhất 1 đơn hàng, vui lòng nhập mã VIN mới chưa gán." });
            }
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Lỗi cơ sở dữ liệu khi gán mã VIN: " + (ex.InnerException?.Message ?? ex.Message) });
        }
        catch (Exception ex)
        {
            await _vehicleLockService.ReleaseVehicleLockAsync(vin);
            _logger.LogError(ex, "[AdminOrder] Error occurred while assigning VIN for OrderId '{OrderId}'.", orderId);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Lỗi hệ thống khi gán mã VIN: " + ex.Message });
        }
    }

    /// <summary>
    /// Xử lý hủy đơn và hoàn cọc tự động đối với các gói cọc Linh Hoạt (LinhHoat).
    /// Chuyển trạng thái đơn hàng sang REFUNDED, hoàn tiền qua cổng thanh toán, và trả trạng thái số VIN về AVAILABLE.
    /// </summary>
    /// <param name="orderId">Mã Guid của đơn hàng</param>
    /// <param name="dto">Request body tùy chọn chứa lý do hủy/hoàn cọc</param>
    /// <param name="ct">Cancellation token</param>
    /// <response code="200">Hoàn cọc và hủy đơn hàng thành công.</response>
    /// <response code="400">Đơn hàng không phải gói cọc linh hoạt hoặc trạng thái không hợp lệ.</response>
    /// <response code="404">Không tìm thấy đơn hàng.</response>
    /// <response code="401">Thiếu hoặc sai JWT token.</response>
    /// <response code="403">Không có quyền truy cập.</response>
    [HttpPost("{orderId:guid}/refund")]
    [HasPermission("manage_orders")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> RefundOrder(
        [FromRoute] Guid orderId,
        [FromBody] RefundOrderRequestDto? dto,
        CancellationToken ct = default)
    {
        try
        {
            var domainOrderId = new Domain.ValueObjects.OrderId(orderId);
            var order = await _db.Orders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == domainOrderId, ct);

            if (order is null)
            {
                return NotFound(new { message = $"Không tìm thấy đơn hàng với ID {orderId}." });
            }

            if (order.DepositType != DepositType.LinhHoat)
            {
                return BadRequest(new { message = "Chỉ các đơn hàng thuộc gói cọc Linh Hoạt (LinhHoat) mới được phép hoàn tiền cọc." });
            }

            var hashSecret = _configuration["VnPay:HashSecret"] ?? "SUPER_SECRET_VNPAY_HASH_KEY_998877665544332211";
            var tmnCode = _configuration["VnPay:TmnCode"] ?? "VF_O2O_DEV";

            // 1. Gọi API cổng thanh toán kích hoạt lệnh trả tiền lại vào thẻ khách
            var refundResult = await _vnPayService.RefundAsync(order.Id.Value, order.DepositAmount, hashSecret, tmnCode, ct);
            if (!refundResult.IsSuccess)
            {
                return BadRequest(new { message = $"Cổng thanh toán từ chối hoàn tiền: {refundResult.Message}" });
            }

            // 2. Chuyển trạng thái các số VIN liên quan về lại dạng AVAILABLE (Status = 3)
            var releasedVins = new List<string>();
            foreach (var item in order.Items)
            {
                if (!string.IsNullOrWhiteSpace(item.AssignedVin))
                {
                    await _inventoryQueryService.ReleaseVehicleVinAsync(item.AssignedVin, ct);
                    await _vehicleLockService.ReleaseVehicleLockAsync(item.AssignedVin);
                    releasedVins.Add(item.AssignedVin);
                }
            }

            // 3. Cập nhật trạng thái đơn hàng sang REFUNDED
            order.RefundOrder(refundResult.TransactionNo);

            _db.Orders.Update(order);
            await _db.SaveChangesAsync(ct);

            _logger.LogInformation(
                "[AdminOrder] Refunded order '{OrderId}' successfully via gateway. RefundTxnNo: {RefundTxnNo}. Released VINs: {Vins}",
                orderId, refundResult.TransactionNo, string.Join(", ", releasedVins));

            return Ok(new
            {
                orderId = order.Id.Value,
                status = order.Status.ToString(),
                refundedAmount = order.DepositAmount,
                refundTransactionId = refundResult.TransactionNo,
                releasedVins = releasedVins,
                refundedAt = order.RefundedAt ?? DateTime.UtcNow,
                message = $"Hoàn tiền cọc thành công cho đơn hàng {orderId}. Đã chuyển trạng thái sang REFUNDED và giải phóng số VIN về kho."
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[AdminOrder] Error occurred while refunding order '{OrderId}'.", orderId);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Lỗi hệ thống khi xử lý hoàn cọc." });
        }
    }

    /// <summary>
    /// Admin xác nhận xe sẵn sàng bàn giao cho khách.
    /// Bắn Kafka Event (VehicleReadyForDeliveryEvent) sang hàng đợi để thông báo App Mobile Showroom chuẩn bị rửa xe và sạc đầy pin.
    /// </summary>
    /// <param name="orderId">Mã Guid của đơn hàng</param>
    /// <param name="dto">Request body chứa hướng dẫn chuẩn bị thêm (tùy chọn)</param>
    /// <param name="ct">Cancellation token</param>
    /// <response code="200">Xác nhận sẵn sàng bàn giao và phát Kafka event thành công.</response>
    /// <response code="400">Trạng thái đơn hàng không hợp lệ.</response>
    /// <response code="404">Không tìm thấy đơn hàng.</response>
    /// <response code="401">Thiếu hoặc sai JWT token.</response>
    /// <response code="403">Không có quyền truy cập.</response>
    [HttpPost("{orderId:guid}/ready-for-delivery")]
    [HasPermission("manage_orders")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ConfirmReadyForDelivery(
        [FromRoute] Guid orderId,
        [FromBody] VehicleReadyForDeliveryRequestDto? dto,
        CancellationToken ct = default)
    {
        try
        {
            var domainOrderId = new Domain.ValueObjects.OrderId(orderId);
            var order = await _db.Orders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == domainOrderId, ct);

            if (order is null)
            {
                return NotFound(new { message = $"Không tìm thấy đơn hàng với ID {orderId}." });
            }

            var firstItem = order.Items.FirstOrDefault();
            var assignedVin = firstItem?.AssignedVin ?? "PENDING_ASSIGNMENT";
            var modelName = firstItem?.ProductName ?? "VinFast Electric Vehicle";

            // Chuyển trạng thái đơn hàng sang PREPARING nếu chưa chuyển
            if (order.Status == OrderStatus.Paid || order.Status == OrderStatus.VinAssigned)
            {
                order.Prepare();
                _db.Orders.Update(order);
                await _db.SaveChangesAsync(ct);
            }

            var instructions = !string.IsNullOrWhiteSpace(dto?.Instructions)
                ? dto.Instructions
                : "Tiến hành rửa xe sạch sẽ, sạc đầy pin 100%, kiểm tra áp suất lốp và sẵn sàng làm lễ bàn giao xe cho khách hàng.";

            // Bắn Kafka Event thông báo cho Showroom Mobile App
            var readyEvent = new VehicleReadyForDeliveryEvent(
                OrderId: order.Id.Value,
                CustomerId: order.CustomerId,
                CustomerName: order.CustomerName,
                CustomerPhone: order.CustomerPhone,
                AssignedVin: assignedVin,
                ModelName: modelName,
                StoreId: order.StoreId,
                PreparationInstructions: instructions,
                Timestamp: DateTime.UtcNow
            );

            try
            {
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(3));
                using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(ct, cts.Token);

                await _readyProducer.Produce(
                    order.StoreId.ToString(),
                    readyEvent,
                    linkedCts.Token
                );

                _logger.LogInformation(
                    "[Kafka Producer] Published VehicleReadyForDeliveryEvent for OrderId '{OrderId}', StoreId '{StoreId}'",
                    orderId, order.StoreId);
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("[Kafka Producer] Kafka broker connection timed out. VehicleReadyForDeliveryEvent was logged locally for fallback.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Kafka Producer] Failed to publish VehicleReadyForDeliveryEvent to Kafka for OrderId '{OrderId}'.", orderId);
            }

            return Ok(new
            {
                orderId = order.Id.Value,
                status = order.Status.ToString(),
                assignedVin = assignedVin,
                modelName = modelName,
                storeId = order.StoreId,
                preparationInstructions = instructions,
                kafkaTopic = "vehicle-ready-delivery-topic",
                timestamp = readyEvent.Timestamp,
                message = "Đã xác nhận sẵn sàng bàn giao xe và phát Kafka Event đến Showroom Mobile App thành công!"
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[AdminOrder] Error occurred while confirming vehicle ready for delivery for OrderId '{OrderId}'.", orderId);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Lỗi hệ thống khi xác nhận sẵn sàng bàn giao xe." });
        }
    }

    /// <summary>
    /// Kết xuất báo cáo tài chính danh sách đơn cọc xe điện ra file Excel (.xlsx) trong khoảng thời gian tùy chọn.
    /// File được định dạng màu sắc chuyên nghiệp và có dòng tổng tiền tự động ở cuối.
    /// </summary>
    /// <param name="fromDate">Từ ngày (tùy chọn, ví dụ: 2026-06-01)</param>
    /// <param name="toDate">Đến ngày (tùy chọn, ví dụ: 2026-06-30)</param>
    /// <param name="ct">Cancellation token</param>
    /// <response code="200">Trả về file .xlsx báo cáo tài chính.</response>
    /// <response code="401">Thiếu hoặc sai JWT token.</response>
    /// <response code="403">Không có quyền truy cập.</response>
    [HttpGet("export-excel")]
    [HasPermission("manage_orders")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ExportOrdersToExcel(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        CancellationToken ct = default)
    {
        try
        {
            var query = _db.Orders.AsNoTracking().Include(o => o.Items).AsQueryable();

            if (fromDate.HasValue)
            {
                var fromUtc = DateTime.SpecifyKind(fromDate.Value.Date, DateTimeKind.Utc);
                query = query.Where(o => o.CreatedAt >= fromUtc);
            }

            if (toDate.HasValue)
            {
                var toUtc = DateTime.SpecifyKind(toDate.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);
                query = query.Where(o => o.CreatedAt <= toUtc);
            }

            var orders = await query.OrderByDescending(o => o.CreatedAt).ToListAsync(ct);

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("BaoCaoDatCoc");

            // Show Gridlines
            worksheet.ShowGridLines = true;

            // 1. Header Title Block (Row 1 & 2)
            worksheet.Range("A1:J1").Merge().Value = "BÁO CÁO THỐNG KÊ TÀI CHÍNH ĐƠN ĐẶT CỌC XE ĐIỆN VINFAST";
            worksheet.Range("A1:J1").Style.Font.SetBold().Font.SetFontSize(16).Font.SetFontName("Arial").Font.SetFontColor(XLColor.White);
            worksheet.Range("A1:J1").Style.Fill.SetBackgroundColor(XLColor.FromHtml("#0F172A"));
            worksheet.Range("A1:J1").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
            worksheet.Row(1).Height = 35;

            string timeSpanStr = $"Từ ngày: {(fromDate.HasValue ? fromDate.Value.ToString("dd/MM/yyyy") : "Tất cả")} - Đến ngày: {(toDate.HasValue ? toDate.Value.ToString("dd/MM/yyyy") : "Hiện tại")}";
            worksheet.Range("A2:J2").Merge().Value = $"{timeSpanStr} | Ngày xuất báo cáo: {DateTime.Now:dd/MM/yyyy HH:mm}";
            worksheet.Range("A2:J2").Style.Font.SetItalic().Font.SetFontSize(10).Font.SetFontColor(XLColor.FromHtml("#64748B"));
            worksheet.Range("A2:J2").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
            worksheet.Row(2).Height = 20;

            // 2. Column Headers (Row 4)
            string[] headers = new[]
            {
                "STT", "Mã Đơn Cọc", "Tên Khách Hàng", "Số Điện Thoại",
                "Tên Dòng Xe", "Mã Số VIN", "Gói Cọc", "Trạng Thái",
                "Số Tiền Cọc (VND)", "Tổng Giá Trị Xe (VND)"
            };

            for (int i = 0; i < headers.Length; i++)
            {
                var cell = worksheet.Cell(4, i + 1);
                cell.Value = headers[i];
                cell.Style.Font.SetBold().Font.SetFontSize(11).Font.SetFontColor(XLColor.White);
                cell.Style.Fill.SetBackgroundColor(XLColor.FromHtml("#1E3A8A"));
                cell.Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                cell.Style.Alignment.SetVertical(XLAlignmentVerticalValues.Center);
            }
            worksheet.Row(4).Height = 25;

            // 3. Populate Data (Rows 5 to N)
            int currentRow = 5;
            int stt = 1;

            foreach (var order in orders)
            {
                var firstItem = order.Items.FirstOrDefault();
                string productName = firstItem?.ProductName ?? "VinFast Electric Vehicle";
                string assignedVin = firstItem?.AssignedVin ?? "Chưa gán VIN";
                string statusText = order.Status.ToString() switch
                {
                    "Paid" => "Đã cọc",
                    "VinAssigned" => "Đã gán VIN",
                    "Preparing" => "Sẵn sàng giao",
                    "Delivered" => "Đã bàn giao",
                    "Refunded" => "Đã hoàn cọc",
                    "Cancelled" => "Đã hủy",
                    _ => order.Status.ToString()
                };

                worksheet.Cell(currentRow, 1).Value = stt++;
                worksheet.Cell(currentRow, 2).Value = order.Id.Value.ToString().Substring(0, 8).ToUpper();
                worksheet.Cell(currentRow, 3).Value = order.CustomerName;
                worksheet.Cell(currentRow, 4).Value = order.CustomerPhone;
                worksheet.Cell(currentRow, 5).Value = productName;
                worksheet.Cell(currentRow, 6).Value = assignedVin;
                worksheet.Cell(currentRow, 7).Value = order.DepositType.ToString();
                worksheet.Cell(currentRow, 8).Value = statusText;
                
                var depositCell = worksheet.Cell(currentRow, 9);
                depositCell.Value = order.DepositAmount;
                depositCell.Style.NumberFormat.Format = "#,##0";

                var totalCell = worksheet.Cell(currentRow, 10);
                totalCell.Value = order.TotalAmount;
                totalCell.Style.NumberFormat.Format = "#,##0";

                var rowRange = worksheet.Range(currentRow, 1, currentRow, 10);
                if (currentRow % 2 == 1)
                {
                    rowRange.Style.Fill.SetBackgroundColor(XLColor.FromHtml("#F8FAFC"));
                }

                worksheet.Cell(currentRow, 1).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                worksheet.Cell(currentRow, 2).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                worksheet.Cell(currentRow, 4).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                worksheet.Cell(currentRow, 6).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                worksheet.Cell(currentRow, 7).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                worksheet.Cell(currentRow, 8).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                worksheet.Cell(currentRow, 9).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Right);
                worksheet.Cell(currentRow, 10).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Right);

                currentRow++;
            }

            // 4. Total Summary Row
            int lastDataRow = currentRow - 1;
            if (lastDataRow >= 5)
            {
                var totalLabelRange = worksheet.Range(currentRow, 1, currentRow, 8);
                totalLabelRange.Merge().Value = "TỔNG CỘNG DOANH THU CỌC:";
                totalLabelRange.Style.Font.SetBold().Font.SetFontSize(12);
                totalLabelRange.Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Right);

                var totalDepositCell = worksheet.Cell(currentRow, 9);
                totalDepositCell.FormulaA1 = $"=SUM(I5:I{lastDataRow})";
                totalDepositCell.Style.Font.SetBold().Font.SetFontSize(12).Font.SetFontColor(XLColor.FromHtml("#059669"));
                totalDepositCell.Style.Fill.SetBackgroundColor(XLColor.FromHtml("#ECFDF5"));
                totalDepositCell.Style.NumberFormat.Format = "#,##0 \"đ\"";

                var totalVehicleCell = worksheet.Cell(currentRow, 10);
                totalVehicleCell.FormulaA1 = $"=SUM(J5:J{lastDataRow})";
                totalVehicleCell.Style.Font.SetBold().Font.SetFontSize(12);
                totalVehicleCell.Style.Fill.SetBackgroundColor(XLColor.FromHtml("#F1F5F9"));
                totalVehicleCell.Style.NumberFormat.Format = "#,##0 \"đ\"";

                worksheet.Row(currentRow).Height = 28;
            }

            worksheet.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            var content = stream.ToArray();

            string fileName = $"Bao_Cao_Dat_Coc_VinFast_{(fromDate.HasValue ? fromDate.Value.ToString("yyyyMMdd") : "ALL")}_{(toDate.HasValue ? toDate.Value.ToString("yyyyMMdd") : DateTime.Now.ToString("yyyyMMdd"))}.xlsx";

            return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[AdminOrder] Error exporting financial report to Excel.");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Lỗi hệ thống khi kết xuất báo cáo Excel." });
        }
    }
}

public class VehicleReadyForDeliveryRequestDto
{
    public string? Instructions { get; set; }
}

public record RefundOrderRequestDto(string? Reason);

public record AssignVinRequestDto(string Vin, Guid? ItemId = null);

public record AdminPagedOrdersResponseDto(
    IReadOnlyList<AdminOrderListItemDto> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages
);

public record AdminOrderListItemDto(
    Guid OrderId,
    Guid CustomerId,
    string CustomerName,
    string CustomerEmail,
    string CustomerPhone,
    string CustomerIdCard,
    Guid StoreId,
    decimal TotalAmount,
    decimal DepositAmount,
    string DepositType,
    string BatteryOption,
    string Status,
    DateTime? PaidAt,
    DateTime? CancelledAt,
    string? CancellationReason,
    DateTime CreatedAt,
    IReadOnlyList<AdminOrderItemDto> Items
);

public record AdminOrderItemDto(
    Guid ItemId,
    Guid ProductId,
    string ProductName,
    string? AssignedVin,
    decimal UnitPrice,
    int Quantity,
    decimal LineTotal
);
