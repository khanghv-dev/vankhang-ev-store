using System.Collections.Concurrent;
using VinFastO2O.InventoryService.Application.Common.Interfaces;
using VinFastO2O.InventoryService.Domain.Entities;

namespace VinFastO2O.InventoryService.Infrastructure.Repositories;

public class InMemoryInventoryRepository : IInventoryRepository
{
    private static readonly ConcurrentDictionary<Guid, InventoryItem> _items = new();

    static InMemoryInventoryRepository()
    {
        // Add some seed data for demonstration
        var seed1 = new InventoryItem("VF8-BAT-001", "VinFast VF8 Battery Pack", 50, "WH-A-01");
        var seed2 = new InventoryItem("VF9-TIRE-002", "VinFast VF9 Michelin Tire 21\"", 120, "WH-B-04");
        var seed3 = new InventoryItem("VFE34-MOT-003", "VinFast VF e34 Electric Motor", 15, "WH-C-02");
        var seed4 = new InventoryItem("VF-TIRE-004", "Lốp Michelin City Grip (Klara/Vento)", 5, "WH-B-12");
        var seed5 = new InventoryItem("VF-CHARGER-005", "Bộ sạc di động VinFast 3.5kW", 8, "WH-A-09");
        var seed6 = new InventoryItem("VF-BRAKE-006", "Má phanh đĩa Brembo (VF8/VF9)", 3, "WH-C-15");

        _items[seed1.Id] = seed1;
        _items[seed2.Id] = seed2;
        _items[seed3.Id] = seed3;
        _items[seed4.Id] = seed4;
        _items[seed5.Id] = seed5;
        _items[seed6.Id] = seed6;
    }

    public Task<InventoryItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        _items.TryGetValue(id, out var item);
        return Task.FromResult(item);
    }

    public Task<InventoryItem?> GetBySkuAsync(string sku, CancellationToken cancellationToken = default)
    {
        var item = _items.Values.FirstOrDefault(i => i.Sku.Equals(sku, StringComparison.OrdinalIgnoreCase));
        return Task.FromResult(item);
    }

    public Task<IEnumerable<InventoryItem>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult<IEnumerable<InventoryItem>>(_items.Values.ToList());
    }

    public Task AddAsync(InventoryItem item, CancellationToken cancellationToken = default)
    {
        _items[item.Id] = item;
        return Task.CompletedTask;
    }

    public Task UpdateAsync(InventoryItem item, CancellationToken cancellationToken = default)
    {
        _items[item.Id] = item;
        return Task.CompletedTask;
    }

    public Task DeleteAsync(InventoryItem item, CancellationToken cancellationToken = default)
    {
        _items.TryRemove(item.Id, out _);
        return Task.CompletedTask;
    }
}
