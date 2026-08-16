using EvO2O.OrderService.Domain.Enums;

namespace EvO2O.OrderService.Domain.States;

public class CancelledState : OrderState
{
    public override OrderStatus Status => OrderStatus.Cancelled;
}
