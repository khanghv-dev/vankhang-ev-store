using VinFastO2O.OrderService.Domain.Entities;
using VinFastO2O.OrderService.Domain.Enums;

namespace VinFastO2O.OrderService.Domain.States;

public class PendingState : OrderState
{
    public override OrderStatus Status => OrderStatus.Pending;

    public override void Pay(Order order)
    {
        order.TransitionTo(OrderStatus.Paid);
    }

    public override void Cancel(Order order)
    {
        order.TransitionTo(OrderStatus.Cancelled);
    }
}
