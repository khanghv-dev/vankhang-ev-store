using VinFastO2O.InventoryService.Domain.Common;
using VinFastO2O.InventoryService.Domain.ValueObjects;

namespace VinFastO2O.InventoryService.Domain.Entities;

public class Store : Entity<StoreId>
{
    public string Name { get; private set; } = string.Empty;
    public string Code { get; private set; } = string.Empty;
    public string Address { get; private set; } = string.Empty;

    private Store() { } // EF Core

    public Store(StoreId id, string name, string code, string address) : base(id)
    {
        UpdateDetails(name, code, address);
    }

    public void UpdateDetails(string name, string code, string address)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Store name cannot be empty.", nameof(name));
        if (string.IsNullOrWhiteSpace(code))
            throw new ArgumentException("Store code cannot be empty.", nameof(code));

        Name = name.Trim();
        Code = code.Trim().ToUpperInvariant();
        Address = address.Trim();
        LastModifiedAt = DateTime.UtcNow;
    }
}
