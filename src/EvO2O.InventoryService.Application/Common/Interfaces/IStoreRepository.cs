using EvO2O.InventoryService.Domain.Entities;
using EvO2O.InventoryService.Domain.ValueObjects;

namespace EvO2O.InventoryService.Application.Common.Interfaces;

public interface IStoreRepository
{
    Task<Store?> GetByIdAsync(StoreId id, CancellationToken cancellationToken = default);
}
