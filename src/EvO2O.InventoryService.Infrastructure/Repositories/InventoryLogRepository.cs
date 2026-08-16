using EvO2O.InventoryService.Application.Common.Interfaces;
using EvO2O.InventoryService.Domain.Entities;
using EvO2O.InventoryService.Infrastructure.Persistence;

namespace EvO2O.InventoryService.Infrastructure.Repositories;

public class InventoryLogRepository : IInventoryLogRepository
{
    private readonly InventoryDbContext _context;

    public InventoryLogRepository(InventoryDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(InventoryLog log, CancellationToken cancellationToken = default)
    {
        await _context.InventoryLogs.AddAsync(log, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
