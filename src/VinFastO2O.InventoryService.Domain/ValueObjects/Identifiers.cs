namespace VinFastO2O.InventoryService.Domain.ValueObjects;

public record VehicleId(Guid Value)
{
    public static VehicleId New() => new(Guid.NewGuid());
    public override string ToString() => Value.ToString();
}

public record StoreId(Guid Value)
{
    public static StoreId New() => new(Guid.NewGuid());
    public override string ToString() => Value.ToString();
}

public record InventoryLogId(Guid Value)
{
    public static InventoryLogId New() => new(Guid.NewGuid());
    public override string ToString() => Value.ToString();
}
