using EvO2O.OrderService.Domain.Enums;

namespace EvO2O.OrderService.Domain.States;

public class DeliveredState : OrderState
{
    public override OrderStatus Status => OrderStatus.Delivered;
}
