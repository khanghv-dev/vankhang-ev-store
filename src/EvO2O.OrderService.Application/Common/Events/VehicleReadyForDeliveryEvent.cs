using System;

namespace EvO2O.Shared.Events;

/// <summary>
/// Kafka Event thông báo xe đã sẵn sàng bàn giao cho hệ thống App Mobile của Showroom.
/// Đội ngũ Showroom sẽ thực hiện các bước chuẩn bị (rửa xe, sạc đầy pin).
/// </summary>
public record VehicleReadyForDeliveryEvent(
    Guid OrderId,
    Guid CustomerId,
    string CustomerName,
    string CustomerPhone,
    string AssignedVin,
    string ModelName,
    Guid StoreId,
    string PreparationInstructions,
    DateTime Timestamp
);
