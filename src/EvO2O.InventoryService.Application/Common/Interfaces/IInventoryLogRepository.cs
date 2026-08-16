using EvO2O.InventoryService.Domain.Entities;

namespace EvO2O.InventoryService.Application.Common.Interfaces;

public interface IInventoryLogRepository
{
    Task AddAsync(InventoryLog log, CancellationToken cancellationToken = default);
}
