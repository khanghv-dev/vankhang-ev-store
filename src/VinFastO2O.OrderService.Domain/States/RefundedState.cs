using VinFastO2O.OrderService.Domain.Entities;
using VinFastO2O.OrderService.Domain.Enums;

namespace VinFastO2O.OrderService.Domain.States;

public class RefundedState : OrderState
{
    public override OrderStatus Status => OrderStatus.Refunded;
}
