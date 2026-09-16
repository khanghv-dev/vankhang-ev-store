using VinFastO2O.InventoryService.Domain.Common;

namespace VinFastO2O.InventoryService.Domain.Entities;

public class InventoryItem : Entity<Guid>
{
    public string Sku { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public int Quantity { get; private set; }
    public string Location { get; private set; } = string.Empty;

    private InventoryItem() { } // EF Core constructor

    public InventoryItem(string sku, string name, int quantity, string location) : base(Guid.NewGuid())
    {
        if (string.IsNullOrWhiteSpace(sku))
            throw new ArgumentException("SKU cannot be empty.", nameof(sku));
            
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Name cannot be empty.", nameof(name));
            
        if (quantity < 0)
            throw new ArgumentException("Quantity cannot be negative.", nameof(quantity));

        Sku = sku;
        Name = name;
        Quantity = quantity;
        Location = location;
    }

    public void UpdateQuantity(int newQuantity)
    {
        if (newQuantity < 0)
            throw new ArgumentException("Quantity cannot be negative.");

        Quantity = newQuantity;
        LastModifiedAt = DateTime.UtcNow;
    }

    public void UpdateLocation(string location)
    {
        Location = location;
        LastModifiedAt = DateTime.UtcNow;
    }
}
