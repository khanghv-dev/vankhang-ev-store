using VinFastO2O.InventoryService.Application.DTOs;

namespace VinFastO2O.InventoryService.Application.Common.Interfaces;

public interface ICatalogService
{
    Task<IEnumerable<VehicleModelDto>> GetHomepageVehicleModelsAsync(CancellationToken cancellationToken = default);
    Task<VehicleModelDto?> GetByIdAsync(string id, CancellationToken cancellationToken = default);
}
