using Microsoft.EntityFrameworkCore;
using EvO2O.InventoryService.Application.Common.Interfaces;
using EvO2O.InventoryService.Domain.Entities;
using EvO2O.InventoryService.Domain.ValueObjects;
using EvO2O.InventoryService.Infrastructure.Persistence;

namespace EvO2O.InventoryService.Infrastructure.Repositories;

public class StoreRepository : IStoreRepository
{
    private readonly InventoryDbContext _context;

    public StoreRepository(InventoryDbContext context)
    {
        _context = context;
    }

    public async Task<Store?> GetByIdAsync(StoreId id, CancellationToken cancellationToken = default)
    {
        return await _context.Stores.FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }
}
