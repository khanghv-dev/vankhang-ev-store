namespace VinFastO2O.Shared.Events;

public record OrderPaidEvent(
    Guid OrderId,
    string Vin,
    decimal DepositAmount,
    DateTime PaidAt
);
