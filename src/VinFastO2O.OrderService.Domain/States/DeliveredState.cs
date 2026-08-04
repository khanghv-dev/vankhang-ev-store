using VinFastO2O.OrderService.Domain.Enums;

namespace VinFastO2O.OrderService.Domain.States;

public class DeliveredState : OrderState
{
    public override OrderStatus Status => OrderStatus.Delivered;
}
