using VinFastO2O.OrderService.Domain.Entities;
using VinFastO2O.OrderService.Domain.Enums;

namespace VinFastO2O.OrderService.Domain.States;

public class VinAssignedState : OrderState
{
    public override OrderStatus Status => OrderStatus.VinAssigned;

    public override void AssignVin(Order order)
    {
        // Already in VinAssigned state, do nothing (supports manual override/reassignment)
    }

    public override void Prepare(Order order)
    {
        order.TransitionTo(OrderStatus.Preparing);
    }

    public override void Deliver(Order order)
    {
        order.TransitionTo(OrderStatus.Delivered);
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
