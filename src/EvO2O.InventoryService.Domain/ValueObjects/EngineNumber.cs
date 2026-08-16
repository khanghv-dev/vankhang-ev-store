namespace EvO2O.InventoryService.Domain.ValueObjects;

public record EngineNumber
{
    public string Value { get; }

    public EngineNumber(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("Engine number cannot be empty.", nameof(value));

        Value = value.Trim().ToUpperInvariant();
    }

    public override string ToString() => Value;
}
