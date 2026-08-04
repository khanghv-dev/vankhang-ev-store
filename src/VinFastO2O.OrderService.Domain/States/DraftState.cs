using VinFastO2O.OrderService.Domain.Entities;
using VinFastO2O.OrderService.Domain.Enums;

namespace VinFastO2O.OrderService.Domain.States;

public class DraftState : OrderState
{
    public override OrderStatus Status => OrderStatus.Draft;

    public override void Submit(Order order)
    {
        order.TransitionTo(OrderStatus.Pending);
    }

    public override void Cancel(Order order)
    {
        order.TransitionTo(OrderStatus.Cancelled);
    }
}
