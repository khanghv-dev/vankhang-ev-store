using EvO2O.InventoryService.Application.DTOs;

namespace EvO2O.InventoryService.Application.Common.Interfaces;

public interface IPosShowroomService
{
    Task<PosReleaseResultDto> ReleaseVehicleAndActivateWarrantyAsync(
        PosReleaseRequestDto request,
        CancellationToken cancellationToken = default);
}
