namespace VinFastO2O.OrderService.Domain.Enums;

public enum OrderStatus
{
    Draft = 1,
    Pending = 2,
    Paid = 3,
    Preparing = 4,
    Delivered = 5,
    Cancelled = 6,
    VinAssigned = 7,
    Refunded = 8
}
