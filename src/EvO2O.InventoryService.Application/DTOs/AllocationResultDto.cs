namespace EvO2O.InventoryService.Application.DTOs;

public class AllocationResultDto
{
    public Guid VehicleId { get; set; }
    public string Vin { get; set; } = string.Empty;
    public string EngineNumber { get; set; } = string.Empty;
    public string ModelName { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public Guid StoreId { get; set; }
    public Guid LogId { get; set; }
}
