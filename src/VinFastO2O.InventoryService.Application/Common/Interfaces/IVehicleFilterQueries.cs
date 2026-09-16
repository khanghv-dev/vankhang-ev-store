using VinFastO2O.InventoryService.Application.DTOs;

namespace VinFastO2O.InventoryService.Application.Common.Interfaces;

public interface IVehicleFilterQueries
{
    Task<IEnumerable<VehicleFilterDto>> FilterVehiclesAsync(
        string? brand,
        decimal? priceMin,
        decimal? priceMax,
        string? batteryType,
        CancellationToken cancellationToken = default);
}
