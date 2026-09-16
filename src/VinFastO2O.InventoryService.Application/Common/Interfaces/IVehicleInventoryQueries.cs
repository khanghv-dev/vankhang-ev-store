using VinFastO2O.InventoryService.Application.DTOs;

namespace VinFastO2O.InventoryService.Application.Common.Interfaces;

public interface IVehicleInventoryQueries
{
    Task<IEnumerable<VehicleInventoryCountDto>> GetInventoryCountByStoreAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<VehicleInventoryDetailDto>> GetVehicleInventoryDetailsAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<ShowroomAvailableStockDto>> GetShowroomAvailableStockAsync(Guid? showroomId = null, string? modelName = null, CancellationToken cancellationToken = default);
}
