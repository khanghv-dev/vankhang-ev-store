using VinFastO2O.InventoryService.Domain.Entities;

namespace VinFastO2O.InventoryService.Application.Common.Interfaces;

public interface IInventoryLogRepository
{
    Task AddAsync(InventoryLog log, CancellationToken cancellationToken = default);
}
