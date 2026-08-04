namespace VinFastO2O.InventoryService.Application.DTOs;

public class ProductDetailDto
{
    public string ProductCode { get; set; } = string.Empty;
    public string ModelName { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Segment { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Dictionary<string, string> Specifications { get; set; } = new();
    public List<string> ImageGallery { get; set; } = new();
}
