using VinFastO2O.InventoryService.Domain.Entities;
using VinFastO2O.InventoryService.Domain.ValueObjects;

namespace VinFastO2O.InventoryService.Application.Common.Interfaces;

public interface IVehicleRepository
{
    Task<Vehicle?> GetByIdAsync(VehicleId id, CancellationToken cancellationToken = default);
    Task<Vehicle?> GetFirstAvailableAsync(string modelName, StoreId storeId, CancellationToken cancellationToken = default);
    Task UpdateAsync(Vehicle vehicle, CancellationToken cancellationToken = default);
    Task<Vehicle?> GetByVinAsync(Vin vin, CancellationToken cancellationToken = default);
    Task<Vehicle?> ReserveFirstAvailableAsync(
        string modelName,
        StoreId storeId,
        string performedBy,
        InventoryLogId logId,
        CancellationToken cancellationToken = default);
}
