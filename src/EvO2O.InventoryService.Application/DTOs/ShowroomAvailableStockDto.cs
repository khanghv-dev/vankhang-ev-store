using System;

namespace EvO2O.InventoryService.Application.DTOs;

public class ShowroomAvailableStockDto
{
    public Guid ShowroomId { get; set; }
    public string ShowroomCode { get; set; } = string.Empty;
    public string ShowroomName { get; set; } = string.Empty;
    public string ModelName { get; set; } = string.Empty;
    public int AvailableVinCount { get; set; }
    public string StockStatus { get; set; } = "IN_STOCK"; // "IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"
}
