namespace VinFastO2O.OrderService.Application.Common.Interfaces;

public interface IInventoryQueryService
{
    /// <summary>
    /// Finds the first vehicle of productId at storeId that is AVAILABLE.
    /// </summary>
    Task<AvailableVehicleDto?> GetFirstAvailableVehicleAsync(Guid productId, Guid storeId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Releases a vehicle VIN back to AVAILABLE status (3) in Inventory DB.
    /// </summary>
    Task<bool> ReleaseVehicleVinAsync(string vin, CancellationToken cancellationToken = default);
}

public class AvailableVehicleDto
{
    public string Vin { get; set; } = string.Empty;
    public string EngineNumber { get; set; } = string.Empty;
    public string ModelName { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public decimal Price { get; set; }
}
