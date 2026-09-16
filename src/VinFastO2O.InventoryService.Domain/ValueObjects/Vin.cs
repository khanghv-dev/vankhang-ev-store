namespace VinFastO2O.InventoryService.Domain.ValueObjects;

public record Vin
{
    public string Value { get; }

    public Vin(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("VIN cannot be empty.", nameof(value));

        var normalizedValue = value.Trim().ToUpperInvariant();
        if (normalizedValue.Length != 17)
            throw new ArgumentException("VIN must be exactly 17 characters long.", nameof(value));

        Value = normalizedValue;
    }

    public override string ToString() => Value;
}
