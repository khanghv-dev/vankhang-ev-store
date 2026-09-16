namespace VinFastO2O.InventoryService.Application.DTOs;

public class VehicleInventoryCountDto
{
    public string StoreCode { get; set; } = string.Empty;
    public string StoreName { get; set; } = string.Empty;
    public int TotalVehicles { get; set; }
}
