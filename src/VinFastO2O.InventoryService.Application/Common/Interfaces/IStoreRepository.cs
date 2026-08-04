using VinFastO2O.InventoryService.Domain.Entities;
using VinFastO2O.InventoryService.Domain.ValueObjects;

namespace VinFastO2O.InventoryService.Application.Common.Interfaces;

public interface IStoreRepository
{
    Task<Store?> GetByIdAsync(StoreId id, CancellationToken cancellationToken = default);
}
