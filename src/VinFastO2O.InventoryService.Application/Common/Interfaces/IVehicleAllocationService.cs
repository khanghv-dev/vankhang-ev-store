using VinFastO2O.InventoryService.Application.DTOs;

namespace VinFastO2O.InventoryService.Application.Common.Interfaces;

public interface IVehicleAllocationService
{
    Task<AllocationResultDto> ReserveVehicleAsync(
        string productId,
        Guid storeId,
        string performedBy,
        CancellationToken cancellationToken = default);

    Task<AllocationResultDto> ReserveVinAsync(
        string vin,
        Guid storeId,
        string performedBy,
        CancellationToken cancellationToken = default);
}
