using MassTransit;
using Microsoft.Extensions.Logging;
using EvO2O.Shared.Events;
using EvO2O.InventoryService.Application.Common.Interfaces;
using EvO2O.InventoryService.Domain.Entities;
using EvO2O.InventoryService.Domain.Enums;
using EvO2O.InventoryService.Domain.ValueObjects;

namespace EvO2O.InventoryService.Application.Common.Messaging;

public class OrderPaidConsumer : IConsumer<OrderPaidEvent>
{
    private readonly IVehicleRepository _vehicleRepository;
    private readonly IInventoryLogRepository _inventoryLogRepository;
    private readonly ILogger<OrderPaidConsumer> _logger;

    public OrderPaidConsumer(
        IVehicleRepository vehicleRepository,
        IInventoryLogRepository inventoryLogRepository,
        ILogger<OrderPaidConsumer> logger)
    {
        _vehicleRepository = vehicleRepository;
        _inventoryLogRepository = inventoryLogRepository;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<OrderPaidEvent> context)
    {
        var message = context.Message;
        _logger.LogInformation(">>> [Kafka Consumer] Processing OrderPaidEvent! OrderId: {OrderId}, VIN: {Vin}, DepositAmount: {Amount}, PaidAt: {PaidAt}",
            message.OrderId, message.Vin, message.DepositAmount, message.PaidAt);

        if (string.IsNullOrWhiteSpace(message.Vin))
        {
            _logger.LogWarning("Empty VIN received in OrderPaidEvent. OrderId: {OrderId}", message.OrderId);
            return;
        }

        Vin vinObj;
        try
        {
            vinObj = new Vin(message.Vin);
        }
        catch (ArgumentException ex)
        {
            _logger.LogError(ex, "Invalid VIN format {Vin} in OrderPaidEvent. OrderId: {OrderId}", message.Vin, message.OrderId);
            return;
        }

        var vehicle = await _vehicleRepository.GetByVinAsync(vinObj, context.CancellationToken);
        if (vehicle == null)
        {
            _logger.LogWarning("Vehicle with VIN: {Vin} not found for OrderId: {OrderId}", message.Vin, message.OrderId);
            return;
        }

        if (vehicle.Status == VehicleStatus.Sold)
        {
            _logger.LogInformation("Vehicle with VIN: {Vin} is already SOLD. Skipping update for OrderId: {OrderId}", message.Vin, message.OrderId);
            return;
        }

        var oldStatus = vehicle.Status;
        vehicle.UpdateStatus(VehicleStatus.Sold);
        await _vehicleRepository.UpdateAsync(vehicle, context.CancellationToken);

        var log = new InventoryLog(
            InventoryLogId.New(),
            vehicle.Id,
            vehicle.StoreId,
            null,
            InventoryAction.StatusChange,
            "Kafka-Consumer",
            $"Chuyển trạng thái số VIN {vinObj.Value} từ {oldStatus} sang SOLD do đơn hàng {message.OrderId} đã thanh toán (OrderPaidEvent)."
        );
        await _inventoryLogRepository.AddAsync(log, context.CancellationToken);

        _logger.LogInformation(">>> [Kafka Consumer] Successfully updated vehicle {Vin} status from {OldStatus} to SOLD and recorded inventory log.", message.Vin, oldStatus);
    }
}
