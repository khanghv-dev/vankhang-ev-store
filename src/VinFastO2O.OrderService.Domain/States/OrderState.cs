using VinFastO2O.OrderService.Domain.Entities;
using VinFastO2O.OrderService.Domain.Enums;

namespace VinFastO2O.OrderService.Domain.States;

public abstract class OrderState
{
    public abstract OrderStatus Status { get; }

    public virtual void Submit(Order order) =>
        throw new InvalidOperationException($"Cannot transition from status {Status} to PENDING.");

    public virtual void Pay(Order order) =>
        throw new InvalidOperationException($"Cannot transition from status {Status} to PAID.");

    public virtual void Prepare(Order order) =>
        throw new InvalidOperationException($"Cannot transition from status {Status} to PREPARING.");

    public virtual void Deliver(Order order) =>
        throw new InvalidOperationException($"Cannot transition from status {Status} to DELIVERED.");

    public virtual void AssignVin(Order order) =>
        throw new InvalidOperationException($"Cannot transition from status {Status} to VIN_ASSIGNED.");

    public virtual void Cancel(Order order) =>
        throw new InvalidOperationException($"Cannot transition from status {Status} to CANCELLED.");

    public virtual void Refund(Order order) =>
        throw new InvalidOperationException($"Cannot transition from status {Status} to REFUNDED.");

    public static OrderState FromStatus(OrderStatus status)
    {
        return status switch
        {
            OrderStatus.Draft => new DraftState(),
            OrderStatus.Pending => new PendingState(),
            OrderStatus.Paid => new PaidState(),
            OrderStatus.Preparing => new PreparingState(),
            OrderStatus.VinAssigned => new VinAssignedState(),
            OrderStatus.Delivered => new DeliveredState(),
            OrderStatus.Cancelled => new CancelledState(),
            OrderStatus.Refunded => new RefundedState(),
            _ => throw new ArgumentOutOfRangeException(nameof(status), $"Unknown status: {status}")
        };
    }
}
