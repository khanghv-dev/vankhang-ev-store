using EvO2O.InventoryService.Domain.Common;
using EvO2O.InventoryService.Domain.Enums;
using EvO2O.InventoryService.Domain.ValueObjects;

namespace EvO2O.InventoryService.Domain.Entities;

public class InventoryLog : Entity<InventoryLogId>
{
    public VehicleId VehicleId { get; private set; } = null!;
    public StoreId? FromStoreId { get; private set; }
    public StoreId? ToStoreId { get; private set; }
    public InventoryAction Action { get; private set; }
    public DateTime Timestamp { get; private set; } = DateTime.UtcNow;
    public string PerformedBy { get; private set; } = string.Empty;
    public string Notes { get; private set; } = string.Empty;

    private InventoryLog() { } // EF Core

    public InventoryLog(
        InventoryLogId id,
        VehicleId vehicleId,
        StoreId? fromStoreId,
        StoreId? toStoreId,
        InventoryAction action,
        string performedBy,
        string notes = "") : base(id)
    {
        VehicleId = vehicleId ?? throw new ArgumentNullException(nameof(vehicleId));
        FromStoreId = fromStoreId;
        ToStoreId = toStoreId;
        Action = action;
        PerformedBy = string.IsNullOrWhiteSpace(performedBy) 
            ? throw new ArgumentException("PerformedBy cannot be empty.", nameof(performedBy)) 
            : performedBy.Trim();
        Notes = notes.Trim();
        Timestamp = DateTime.UtcNow;
    }
}
