namespace VinFastO2O.OrderService.Domain.ValueObjects;

public record OrderId(Guid Value)
{
    public static OrderId New() => new(Guid.NewGuid());
    public override string ToString() => Value.ToString();
}

public record OrderItemId(Guid Value)
{
    public static OrderItemId New() => new(Guid.NewGuid());
    public override string ToString() => Value.ToString();
}

public record PaymentId(Guid Value)
{
    public static PaymentId New() => new(Guid.NewGuid());
    public override string ToString() => Value.ToString();
}
