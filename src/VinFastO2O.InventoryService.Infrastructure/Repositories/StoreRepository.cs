using Microsoft.EntityFrameworkCore;
using VinFastO2O.InventoryService.Application.Common.Interfaces;
using VinFastO2O.InventoryService.Domain.Entities;
using VinFastO2O.InventoryService.Domain.ValueObjects;
using VinFastO2O.InventoryService.Infrastructure.Persistence;

namespace VinFastO2O.InventoryService.Infrastructure.Repositories;

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
