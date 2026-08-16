using EvO2O.InventoryService.Application.DTOs;

namespace EvO2O.InventoryService.Application.Common.Interfaces;

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
