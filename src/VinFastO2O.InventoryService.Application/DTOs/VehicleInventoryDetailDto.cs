namespace VinFastO2O.InventoryService.Application.DTOs;

public class VehicleInventoryDetailDto
{
    public string Vin { get; set; } = string.Empty;
    public string EngineNumber { get; set; } = string.Empty;
    public string ModelName { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? StoreName { get; set; }
    public string? StoreCode { get; set; }
}
