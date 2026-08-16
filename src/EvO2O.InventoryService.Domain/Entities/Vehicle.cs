using EvO2O.InventoryService.Domain.Common;
using EvO2O.InventoryService.Domain.Enums;
using EvO2O.InventoryService.Domain.ValueObjects;

namespace EvO2O.InventoryService.Domain.Entities;

public class Vehicle : Entity<VehicleId>
{
    public Vin Vin { get; private set; } = null!;
    public EngineNumber EngineNumber { get; private set; } = null!;
    public string ModelName { get; private set; } = string.Empty;
    public string Color { get; private set; } = string.Empty;
    public string Brand { get; private set; } = string.Empty;
    public decimal Price { get; private set; }
    public string BatteryType { get; private set; } = string.Empty;
    public VehicleStatus Status { get; private set; }
    public StoreId? StoreId { get; private set; }

    private Vehicle() { } // EF Core

    public Vehicle(
        VehicleId id,
        Vin vin,
        EngineNumber engineNumber,
        string modelName,
        string color,
        string brand,
        decimal price,
        string batteryType,
        VehicleStatus status,
        StoreId? storeId = null) : base(id)
    {
        Vin = vin ?? throw new ArgumentNullException(nameof(vin));
        EngineNumber = engineNumber ?? throw new ArgumentNullException(nameof(engineNumber));
        UpdateInfo(modelName, color);
        Brand = string.IsNullOrWhiteSpace(brand) ? "VinFast" : brand.Trim();
        Price = price >= 0 ? price : throw new ArgumentException("Price cannot be negative.");
        BatteryType = batteryType.Trim();
        Status = status;
        StoreId = storeId;
    }

    public void UpdateInfo(string modelName, string color)
    {
        if (string.IsNullOrWhiteSpace(modelName))
            throw new ArgumentException("Model name cannot be empty.", nameof(modelName));

        ModelName = modelName.Trim();
        Color = color.Trim();
        LastModifiedAt = DateTime.UtcNow;
    }

    public void UpdateStatus(VehicleStatus status)
    {
        Status = status;
        LastModifiedAt = DateTime.UtcNow;
    }

    public void AssignToStore(StoreId storeId)
    {
        StoreId = storeId ?? throw new ArgumentNullException(nameof(storeId));
        LastModifiedAt = DateTime.UtcNow;
    }

    public void RemoveFromStore()
    {
        StoreId = null;
        LastModifiedAt = DateTime.UtcNow;
    }
}
