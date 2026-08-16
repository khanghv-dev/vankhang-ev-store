using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using EvO2O.OrderService.Application.Common.Interfaces;
using EvO2O.OrderService.Infrastructure.Persistence;
using EvO2O.OrderService.Domain.ValueObjects;
using EvO2O.Shared.Events;

namespace EvO2O.OrderService.Infrastructure.Messaging;

public class VehicleDepositedConsumer : IConsumer<VehicleDepositedEvent>
{
    private readonly INotificationService _notificationService;
    private readonly IEmailService _emailService;
    private readonly OrderDbContext _db;
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<VehicleDepositedConsumer> _logger;

    public VehicleDepositedConsumer(
        INotificationService notificationService,
        IEmailService emailService,
        OrderDbContext db,
        IConnectionMultiplexer redis,
        ILogger<VehicleDepositedConsumer> logger)
    {
        _notificationService = notificationService;
        _emailService = emailService;
        _db = db;
        _redis = redis;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<VehicleDepositedEvent> context)
    {
        var message = context.Message;
        _logger.LogInformation(">>> [Kafka Consumer] Processing VehicleDepositedEvent for OrderId: {OrderId}", message.OrderId);

        var redisDb = _redis.GetDatabase();
        var lockKey = $"deposited_processed:{message.OrderId}";

        // 0. Deduplication: Check if already processing/processed to ensure idempotence.
        // We set the state to "PROCESSING" with a 5-minute TTL.
        var isNew = await redisDb.StringSetAsync(lockKey, "PROCESSING", TimeSpan.FromMinutes(5), When.NotExists);
        if (!isNew)
        {
            _logger.LogWarning(">>> [Kafka Consumer] Event for OrderId: {OrderId} is already processing or has been processed. Skipping.", message.OrderId);
            return;
        }

        try
        {
            // Fetch additional details from database to compose the email
            var orderIdObj = new OrderId(message.OrderId);
            var order = await _db.Orders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == orderIdObj);

            string productName = "Xe máy điện VinFast";
            string? assignedVin = message.AssignedVIN;

            if (order != null)
            {
                var firstItem = order.Items.FirstOrDefault();
                if (firstItem != null)
                {
                    productName = firstItem.ProductName;
                    if (string.IsNullOrEmpty(assignedVin))
                    {
                        assignedVin = firstItem.AssignedVin;
                    }
                }

                // 1. Send deposit confirmation email via SMTP
                _logger.LogInformation("[EmailService] Sending cọc confirmation email to {Email}", order.CustomerEmail);
                await _emailService.SendDepositConfirmationEmailAsync(
                    order.CustomerEmail,
                    order.CustomerName,
                    message.OrderId,
                    productName,
                    order.DepositAmount
                );
            }
            else
            {
                _logger.LogWarning("[Kafka Consumer] Order not found for ID: {OrderId}. Sending email with default event values.", message.OrderId);
                await _emailService.SendDepositConfirmationEmailAsync(
                    "customer@vinfast.com",
                    "Khách hàng VinFast",
                    message.OrderId,
                    productName,
                    message.DepositAmount
                );
            }

            // 2. Send real-time personal notification to the customer via SignalR
            var personalMsg = $"Đặt cọc thành công xe {productName}! Kiểm tra email của bạn để nhận vé điện tử kèm mã QR nhận xe.";
            await _notificationService.SendPersonalNotificationAsync(message.CustomerId, personalMsg);
            _logger.LogInformation("[SignalR] Sent personal notification to customer {CustomerId}.", message.CustomerId);

            // 3. Broadcast real-time showroom sync notification via SignalR (Showroom Sync Consumer)
            var showroomMsg = $"Showroom Sync: Đơn hàng mới {message.OrderId} đã cọc thành công xe {productName} (VIN: {assignedVin ?? "Chờ gán"}). Nhân viên showroom vui lòng chuẩn bị xe (rửa xe, sạc pin) trước ngày bàn giao!";
            await _notificationService.BroadcastNotificationAsync(showroomMsg);
            _logger.LogInformation("[SignalR] Broadcasted showroom preparation event for Store: {StoreId}.", message.StoreId);

            // 4. Update the deduplication state to "PROCESSED" with a 7-day TTL.
            await redisDb.StringSetAsync(lockKey, "PROCESSED", TimeSpan.FromDays(7));
        }
        catch (Exception ex)
        {
            // If processing failed, release the lock key to allow retry
            await redisDb.KeyDeleteAsync(lockKey);
            _logger.LogError(ex, ">>> [Kafka Consumer] Error processing VehicleDepositedEvent for OrderId: {OrderId}. Released lock key for retrying.", message.OrderId);
            throw; // Re-throw to trigger consumer retry
        }
    }
}
