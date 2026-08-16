using EvO2O.OrderService.Domain.Entities;
using EvO2O.OrderService.Domain.Enums;

namespace EvO2O.OrderService.Domain.States;

public class RefundedState : OrderState
{
    public override OrderStatus Status => OrderStatus.Refunded;
}
