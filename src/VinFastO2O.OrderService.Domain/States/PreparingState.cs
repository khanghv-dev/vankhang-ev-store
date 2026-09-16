using VinFastO2O.OrderService.Domain.Entities;
using VinFastO2O.OrderService.Domain.Enums;

namespace VinFastO2O.OrderService.Domain.States;

public class PreparingState : OrderState
{
    public override OrderStatus Status => OrderStatus.Preparing;

    public override void Deliver(Order order)
    {
        order.TransitionTo(OrderStatus.Delivered);
    }

    public override void AssignVin(Order order)
    {
        order.TransitionTo(OrderStatus.VinAssigned);
    }

    public override void Cancel(Order order)
    {
        order.TransitionTo(OrderStatus.Cancelled);
    }

    public override void Refund(Order order)
    {
        order.TransitionTo(OrderStatus.Refunded);
    }
}
