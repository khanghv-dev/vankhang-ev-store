using EvO2O.InventoryService.Application.DTOs;

namespace EvO2O.InventoryService.Application.Common.Interfaces;

public interface ICatalogService
{
    Task<IEnumerable<VehicleModelDto>> GetHomepageVehicleModelsAsync(CancellationToken cancellationToken = default);
    Task<VehicleModelDto?> GetByIdAsync(string id, CancellationToken cancellationToken = default);
}
