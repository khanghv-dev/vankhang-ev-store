namespace EvO2O.Shared.Events;

public record VehicleDepositedEvent(
    Guid OrderId,
    Guid CustomerId,
    string AssignedVIN,
    Guid StoreId,
    decimal DepositAmount,
    DateTime Timestamp
);
