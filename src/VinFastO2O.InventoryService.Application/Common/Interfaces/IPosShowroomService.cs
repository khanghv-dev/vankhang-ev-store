using VinFastO2O.InventoryService.Application.DTOs;

namespace VinFastO2O.InventoryService.Application.Common.Interfaces;

public interface IPosShowroomService
{
    Task<PosReleaseResultDto> ReleaseVehicleAndActivateWarrantyAsync(
        PosReleaseRequestDto request,
        CancellationToken cancellationToken = default);
}
