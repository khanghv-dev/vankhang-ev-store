namespace VinFastO2O.InventoryService.Application.DTOs;

public class VehicleFilterDto
{
    public string Vin { get; set; } = string.Empty;
    public string EngineNumber { get; set; } = string.Empty;
    public string ModelName { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string BatteryType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? StoreName { get; set; }
    public string? StoreCode { get; set; }
}
