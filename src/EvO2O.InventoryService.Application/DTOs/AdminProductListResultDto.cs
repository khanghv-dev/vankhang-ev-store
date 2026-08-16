using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace EvO2O.InventoryService.Application.DTOs;

public class AdminProductListResultDto
{
    [JsonPropertyName("items")]
    public IEnumerable<AdminProductDto> Items { get; set; } = new List<AdminProductDto>();

    [JsonPropertyName("totalCount")]
    public int TotalCount { get; set; }
}
