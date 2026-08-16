using EvO2O.InventoryService.Domain.Common;

namespace EvO2O.InventoryService.Domain.Entities;

public class VehicleModel : Entity<string>
{
    public string Name { get; private set; } = string.Empty;
    public string Segment { get; private set; } = string.Empty;
    public decimal BasePrice { get; private set; }
    public string ImageUrl { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public bool ShowOnHomepage { get; private set; }
    public int DisplayOrder { get; private set; }
    public Dictionary<string, string> Specifications { get; private set; } = new();
    public List<string> ImageGallery { get; private set; } = new();

    private VehicleModel() : base(string.Empty) { } // EF / MongoDB constructor

    public VehicleModel(
        string id,
        string name,
        string segment,
        decimal basePrice,
        string imageUrl,
        string description,
        bool showOnHomepage,
        int displayOrder,
        Dictionary<string, string>? specifications = null,
        List<string>? imageGallery = null) : base(id)
    {
        if (string.IsNullOrWhiteSpace(id))
            throw new ArgumentException("ID cannot be empty.", nameof(id));
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Name cannot be empty.", nameof(name));

        Name = name.Trim();
        Segment = segment.Trim();
        BasePrice = basePrice >= 0 ? basePrice : throw new ArgumentException("Price cannot be negative.");
        ImageUrl = imageUrl.Trim();
        Description = description.Trim();
        ShowOnHomepage = showOnHomepage;
        DisplayOrder = displayOrder;
        Specifications = specifications ?? new Dictionary<string, string>();
        ImageGallery = imageGallery ?? new List<string>();
    }
}
