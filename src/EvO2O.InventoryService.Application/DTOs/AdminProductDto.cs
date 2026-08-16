using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace EvO2O.InventoryService.Application.DTOs;

public class AdminProductDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("category")]
    public string Category { get; set; } = string.Empty;

    [JsonPropertyName("image")]
    public string Image { get; set; } = string.Empty;

    [JsonPropertyName("price")]
    public decimal Price { get; set; }

    [JsonPropertyName("originalPrice")]
    public decimal? OriginalPrice { get; set; }

    [JsonPropertyName("discountText")]
    public string? DiscountText { get; set; }

    [JsonPropertyName("isNew")]
    public bool IsNew { get; set; }

    [JsonPropertyName("inStock")]
    public bool InStock { get; set; }

    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; }

    [JsonPropertyName("batteryType")]
    public string? BatteryType { get; set; }

    [JsonPropertyName("batteryOption")]
    public string? BatteryOption { get; set; }

    [JsonPropertyName("specs")]
    public List<string> Specs { get; set; } = new();
}
