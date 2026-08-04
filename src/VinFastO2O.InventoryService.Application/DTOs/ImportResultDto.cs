using System.Collections.Generic;

namespace VinFastO2O.InventoryService.Application.DTOs;

public class ImportResultDto
{
    public int TotalRows { get; set; }
    public int SuccessCount { get; set; }
    public int FailureCount { get; set; }
    public List<string> Errors { get; set; } = new();
}
