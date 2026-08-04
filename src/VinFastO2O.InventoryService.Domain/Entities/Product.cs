using System;
using VinFastO2O.InventoryService.Domain.Common;

namespace VinFastO2O.InventoryService.Domain.Entities;

/// <summary>
/// Relational entity representing a catalog product item (electric/gas vehicle model or spare part).
/// </summary>
public class Product : Entity<string>
{
    public string Name { get; private set; } = string.Empty;
    public string Category { get; private set; } = string.Empty;
    public string Image { get; private set; } = string.Empty;
    public decimal Price { get; private set; }
    public decimal? OriginalPrice { get; private set; }
    public string? DiscountText { get; private set; }
    public bool IsNew { get; private set; }
    public bool InStock { get; private set; }
    public bool IsActive { get; private set; } // Representing show/hide (ẩn/hiện)
    public bool IsDeleted { get; private set; }
    public string? BatteryType { get; private set; }
    public string? BatteryOption { get; private set; }
    public string SpecsJson { get; private set; } = "[]"; // List of specifications serialized to JSON

    // EF Core Constructor
    private Product() : base(string.Empty)
    {
    }

    public Product(
        string id,
        string name,
        string category,
        string image,
        decimal price,
        decimal? originalPrice,
        string? discountText,
        bool isNew,
        bool inStock,
        bool isActive,
        string? batteryType,
        string? batteryOption,
        string specsJson) : base(id)
    {
        if (string.IsNullOrWhiteSpace(id))
            throw new ArgumentException("Id cannot be empty.", nameof(id));
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Name cannot be empty.", nameof(name));
        if (string.IsNullOrWhiteSpace(category))
            throw new ArgumentException("Category cannot be empty.", nameof(category));
        if (string.IsNullOrWhiteSpace(image))
            throw new ArgumentException("Image cannot be empty.", nameof(image));

        Id = id.Trim().ToLowerInvariant();
        Name = name.Trim();
        Category = category.Trim();
        Image = image.Trim();
        Price = price >= 0 ? price : throw new ArgumentException("Price cannot be negative.");
        OriginalPrice = originalPrice;
        DiscountText = discountText?.Trim();
        IsNew = isNew;
        InStock = inStock;
        IsActive = isActive;
        IsDeleted = false;
        BatteryType = batteryType?.Trim();
        BatteryOption = batteryOption?.Trim();
        SpecsJson = string.IsNullOrWhiteSpace(specsJson) ? "[]" : specsJson.Trim();
        CreatedAt = DateTime.UtcNow;
    }

    public void UpdatePrice(decimal newPrice)
    {
        if (newPrice < 0)
            throw new ArgumentException("Price cannot be negative.");
        Price = newPrice;
        LastModifiedAt = DateTime.UtcNow;
    }

    public void UpdatePriceAndDiscount(decimal price, decimal? originalPrice, string? discountText)
    {
        if (price < 0)
            throw new ArgumentException("Price cannot be negative.");
        if (originalPrice.HasValue && originalPrice.Value < price)
            throw new ArgumentException("Original price cannot be less than current price.");

        Price = price;
        OriginalPrice = originalPrice;
        DiscountText = discountText?.Trim();
        LastModifiedAt = DateTime.UtcNow;
    }

    public void SetActiveStatus(bool isActive)
    {
        IsActive = isActive;
        LastModifiedAt = DateTime.UtcNow;
    }

    public void SoftDelete()
    {
        IsDeleted = true;
        LastModifiedAt = DateTime.UtcNow;
    }

    public void UpdateDetails(string name, decimal price, decimal? originalPrice, string image, string? discountText)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Name cannot be empty.", nameof(name));
        if (string.IsNullOrWhiteSpace(image))
            throw new ArgumentException("Image cannot be empty.", nameof(image));
        if (price < 0)
            throw new ArgumentException("Price cannot be negative.");
        if (originalPrice.HasValue && originalPrice.Value < price)
            throw new ArgumentException("Original price cannot be less than current price.");

        Name = name.Trim();
        Price = price;
        OriginalPrice = originalPrice;
        Image = image.Trim();
        DiscountText = discountText?.Trim();
        LastModifiedAt = DateTime.UtcNow;
    }
}
