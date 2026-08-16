using System;
using System.Threading.Tasks;
using MassTransit;
using Microsoft.Extensions.Logging;
using EvO2O.Shared.Events;
using EvO2O.InventoryService.Application.Common.Interfaces;
using EvO2O.InventoryService.Domain.Entities;
using EvO2O.InventoryService.Domain.Enums;
using EvO2O.InventoryService.Domain.ValueObjects;

namespace EvO2O.InventoryService.Application.Common.Messaging;

public class VehicleReadyForDeliveryConsumer : IConsumer<VehicleReadyForDeliveryEvent>
{
    private readonly IVehicleRepository _vehicleRepository;
    private readonly IInventoryLogRepository _inventoryLogRepository;
    private readonly ILogger<VehicleReadyForDeliveryConsumer> _logger;

    public VehicleReadyForDeliveryConsumer(
        IVehicleRepository vehicleRepository,
        IInventoryLogRepository inventoryLogRepository,
        ILogger<VehicleReadyForDeliveryConsumer> logger)
    {
        _vehicleRepository = vehicleRepository;
        _inventoryLogRepository = inventoryLogRepository;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<VehicleReadyForDeliveryEvent> context)
    {
        var message = context.Message;
        _logger.LogInformation(">>> [Kafka Consumer] Processing VehicleReadyForDeliveryEvent! OrderId: {OrderId}, VIN: {Vin}, Customer: {CustomerName}, StoreId: {StoreId}",
            message.OrderId, message.AssignedVin, message.CustomerName, message.StoreId);

        if (string.IsNullOrWhiteSpace(message.AssignedVin))
        {
            _logger.LogWarning("Empty VIN received in VehicleReadyForDeliveryEvent. OrderId: {OrderId}", message.OrderId);
            return;
        }

        Vin vinObj;
        try
        {
            vinObj = new Vin(message.AssignedVin);
        }
        catch (ArgumentException ex)
        {
            _logger.LogError(ex, "Invalid VIN format {Vin} in VehicleReadyForDeliveryEvent. OrderId: {OrderId}", message.AssignedVin, message.OrderId);
            return;
        }

        var vehicle = await _vehicleRepository.GetByVinAsync(vinObj, context.CancellationToken);
        if (vehicle == null)
        {
            _logger.LogWarning("Vehicle with VIN: {Vin} not found for OrderId: {OrderId}", message.AssignedVin, message.OrderId);
            return;
        }

        // Simulate mobile app notification push to showroom staff
        _logger.LogInformation(">>> [Kafka Consumer] BROADCASTING MOBILE NOTIFICATION TO SHOWROOM STAFF (StoreId: {StoreId}): " +
            "Yêu cầu chuẩn bị bàn giao xe VIN {Vin} (Model: {ModelName}) cho khách hàng {CustomerName} ({CustomerPhone}). Chỉ dẫn: {Instructions}",
            message.StoreId, message.AssignedVin, message.ModelName, message.CustomerName, message.CustomerPhone, message.PreparationInstructions);

        // Record log to inventory_logs
        var log = new InventoryLog(
            InventoryLogId.New(),
            vehicle.Id,
            vehicle.StoreId,
            null,
            InventoryAction.StatusChange,
            "Kafka-ReadyDeliveryConsumer",
            $"Bàn giao xe: Gửi thông báo chuẩn bị xe VIN {vinObj.Value} cho Showroom. Chỉ dẫn: {message.PreparationInstructions}"
        );
        await _inventoryLogRepository.AddAsync(log, context.CancellationToken);

        _logger.LogInformation(">>> [Kafka Consumer] Successfully recorded ready-for-delivery notification log for vehicle {Vin}.", message.AssignedVin);
    }
}
