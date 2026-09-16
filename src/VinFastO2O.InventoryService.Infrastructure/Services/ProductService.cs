using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using System.Text.Json;
using VinFastO2O.InventoryService.Application.Common.Interfaces;
using VinFastO2O.InventoryService.Application.DTOs;
using VinFastO2O.InventoryService.Domain.Entities;
using VinFastO2O.InventoryService.Infrastructure.Persistence;

namespace VinFastO2O.InventoryService.Infrastructure.Services;

public class ProductService : IProductService
{
    private readonly IMongoCollection<VehicleModel> _vehicleModels;
    private readonly InventoryDbContext _dbContext;
    private readonly ILogger<ProductService> _logger;

    public ProductService(
        IMongoClient mongoClient,
        IConfiguration configuration,
        InventoryDbContext dbContext,
        ILogger<ProductService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;

        var dbName = configuration["MongoSettings:DatabaseName"] ?? "VinFastO2O_Catalog";
        var database = mongoClient.GetDatabase(dbName);
        _vehicleModels = database.GetCollection<VehicleModel>("vehicle_models");
    }

    public async Task<IEnumerable<ProductDto>> GetProductsByCategoryAsync(string? category, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("GetProductsByCategoryAsync requested for category: {Category}", category ?? "All");

        // 1. Auto-seed PostgreSQL products if empty
        await SeedProductsPostgresDataAsync(cancellationToken);

        // 2. Build EF Core LINQ Query with explicit WHERE conditions: IsActive == true AND IsDeleted == false
        IQueryable<Product> query = _dbContext.Products
            .AsNoTracking()
            .Where(p => p.IsActive && !p.IsDeleted);

        // Filter by category if specified
        if (!string.IsNullOrWhiteSpace(category))
        {
            var cleanCategory = category.Trim().ToLowerInvariant();
            if (cleanCategory == "xe-may-dien" || cleanCategory == "xe-dien")
            {
                query = query.Where(p => p.Category == "Xe điện");
            }
            else if (cleanCategory == "xe-50cc" || cleanCategory == "xe-may-50cc")
            {
                query = query.Where(p => p.Category == "Xe 50cc");
            }
            else if (cleanCategory == "phu-tung")
            {
                query = query.Where(p => p.Category == "Phụ tùng");
            }
            else
            {
                query = query.Where(p => p.Category.ToLower() == cleanCategory || p.Id.ToLower() == cleanCategory);
            }
        }

        // 3. Sorting: Order by CreatedAt descending so newest products appear first
        var products = await query
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(cancellationToken);

        // 4. Map entities to ProductDto
        return products.Select(p =>
        {
            List<string> specsList;
            try
            {
                specsList = JsonSerializer.Deserialize<List<string>>(p.SpecsJson) ?? new List<string>();
            }
            catch
            {
                specsList = new List<string>();
            }

            return new ProductDto
            {
                Id = p.Id,
                Name = p.Name,
                Category = p.Category,
                Image = p.Image,
                Price = p.Price,
                OriginalPrice = p.OriginalPrice,
                DiscountText = p.DiscountText,
                Specs = specsList,
                IsNew = p.IsNew,
                InStock = p.InStock,
                BatteryType = p.BatteryType,
                BatteryOption = p.BatteryOption
            };
        });
    }

    private async Task<IEnumerable<ProductDto>> GetElectricVehiclesAsync(CancellationToken cancellationToken)
    {
        var filter = Builders<VehicleModel>.Filter.Eq(x => x.Segment, "Electric Motorcycle");
        var models = await _vehicleModels.Find(filter).ToListAsync(cancellationToken);

        return models.Select(vm => new ProductDto
        {
            Id = vm.Id,
            Name = vm.Name,
            Category = vm.Name.Contains("Klara") ? "Klara" :
                       vm.Name.Contains("Impes") ? "Impes" :
                       vm.Name.Contains("Evo") ? "Evo200" :
                       vm.Name.Contains("Feliz") ? "Feliz" : "Xe điện",
            Image = vm.ImageUrl ?? "/images/products/evo200-lite.png",
            Price = vm.BasePrice,
            OriginalPrice = vm.BasePrice * 1.12m, // Mock standard original price
            DiscountText = "Giảm 11%",
            Specs = vm.Specifications.Values.ToList(),
            IsNew = true,
            InStock = true,
            BatteryType = vm.Specifications.TryGetValue("Battery", out var bType) ? 
                (bType.Contains("LFP") ? "lfp" : "lithium-ion") : "lfp",
            BatteryOption = "rent" // Default to rent option
        });
    }

    private async Task<IEnumerable<ProductDto>> GetGasolineVehiclesAsync(CancellationToken cancellationToken)
    {
        var filter = Builders<VehicleModel>.Filter.Eq(x => x.Segment, "Gasoline 50cc");
        var models = await _vehicleModels.Find(filter).ToListAsync(cancellationToken);

        return models.Select(vm => new ProductDto
        {
            Id = vm.Id,
            Name = vm.Name,
            Category = vm.Name.Contains("Ludo") ? "Ludo" :
                       vm.Name.Contains("Theon") ? "Theon S" :
                       vm.Name.Contains("Zipp") ? "Zipp" : "Xe 50cc",
            Image = vm.ImageUrl ?? "/images/products/vento-s.png",
            Price = vm.BasePrice,
            OriginalPrice = vm.BasePrice * 1.15m,
            DiscountText = "Giảm 13%",
            Specs = vm.Specifications.Values.ToList(),
            IsNew = vm.Name.Contains("Theon"),
            InStock = true,
            BatteryType = null, // Gasoline vehicles do not use batteries
            BatteryOption = null
        });
    }

    private async Task<IEnumerable<ProductDto>> GetSparePartsAsync(CancellationToken cancellationToken)
    {
        var items = await _dbContext.InventoryItems
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return items.Select(item => new ProductDto
        {
            Id = item.Sku.ToLowerInvariant(),
            Name = item.Name,
            Category = "Phụ tùng",
            Image = item.Sku.Contains("BAT") ? "/images/products/battery-pack.png" : 
                    item.Sku.Contains("TIRE") ? "/images/products/tire.png" :
                    "/images/products/motor.png",
            Price = item.Sku.Contains("BAT") ? 15000000m :
                    item.Sku.Contains("TIRE") ? 2500000m :
                    8000000m,
            OriginalPrice = item.Sku.Contains("BAT") ? 18000000m :
                            item.Sku.Contains("TIRE") ? 3000000m :
                            10000000m,
            DiscountText = "Giảm 15%",
            Specs = new List<string> { $"Mã kho: {item.Location}", $"Còn {item.Quantity} sản phẩm" },
            IsNew = false,
            InStock = item.Quantity > 0,
            BatteryType = item.Sku.Contains("BAT") ? "lfp" : null,
            BatteryOption = null
        });
    }

    private async Task SeedPostgresDataAsync(CancellationToken cancellationToken)
    {
        var count = await _dbContext.InventoryItems.CountAsync(cancellationToken);
        if (count == 0)
        {
            _logger.LogInformation("PostgreSQL inventory_items is empty. Seeding spare parts...");
            var items = new List<InventoryItem>
            {
                new("VF8-BAT-001", "VinFast VF8 Battery Pack", 50, "WH-A-01"),
                new("VF9-TIRE-002", "VinFast VF9 Michelin Tire 21\"", 120, "WH-B-04"),
                new("VFE34-MOT-003", "VinFast VF e34 Electric Motor", 15, "WH-C-02")
            };
            await _dbContext.InventoryItems.AddRangeAsync(items, cancellationToken);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    private async Task SeedMongoDataAsync(CancellationToken cancellationToken)
    {
        var count = await _vehicleModels.CountDocumentsAsync(Builders<VehicleModel>.Filter.Empty, cancellationToken: cancellationToken);
        if (count == 0)
        {
            _logger.LogInformation("MongoDB vehicle_models is empty. Seeding vehicles...");
            var seedModels = new List<VehicleModel>
            {
                // Electric Motorcycles
                new("vinfast-klara-s-2026", "VinFast Klara S 2026", "Electric Motorcycle", 35000000m, "/images/products/klara-s.png", "Mẫu xe máy điện thông minh thế hệ mới.", true, 0,
                    new Dictionary<string, string> { { "Battery", "Pin LFP kép" }, { "Range", "194 km / sạc" }, { "MaxSpeed", "78 km/h" } }),
                
                new("vinfast-impes", "VinFast Impes", "Electric Motorcycle", 12900000m, "/images/products/impes.png", "Xe máy điện thể thao cá tính.", true, 1,
                    new Dictionary<string, string> { { "Battery", "Pin Lithium-ion" }, { "Range", "70 km / sạc" }, { "MaxSpeed", "50 km/h" } }),
                
                new("vinfast-klara-s-premium", "VinFast Klara S 2026 Premium", "Electric Motorcycle", 36900000m, "/images/products/klara-s.png", "Mẫu xe điện Klara S phiên bản cao cấp.", true, 2,
                    new Dictionary<string, string> { { "Battery", "Pin LFP kép" }, { "Range", "194 km / sạc" }, { "MaxSpeed", "Màu sắc thanh lịch" } }),
                
                new("vinfast-evo200-lite", "VinFast Evo200 Lite", "Electric Motorcycle", 19400000m, "/images/products/evo200-lite.png", "Xe máy điện quốc dân thế hệ mới.", true, 3,
                    new Dictionary<string, string> { { "Battery", "Pin LFP" }, { "Range", "205 km / sạc" }, { "MaxSpeed", "49 km/h" } }),
                
                new("vinfast-feliz-s", "VinFast Feliz S", "Electric Motorcycle", 27000000m, "/images/products/feliz-s.png", "Mẫu xe máy điện Feliz S thanh lịch.", true, 4,
                    new Dictionary<string, string> { { "Battery", "Pin LFP" }, { "Range", "198 km / sạc" }, { "MaxSpeed", "80 km/h" } }),

                // Gasoline 50cc
                new("vinfast-ludo", "VinFast Ludo", "Gasoline 50cc", 12900000m, "/images/products/ludo.png", "Xe máy 50cc gọn nhẹ tiết kiệm.", true, 5,
                    new Dictionary<string, string> { { "Engine", "Động cơ 49.5cc" }, { "Range", "Quãng đường 75 km" }, { "MaxSpeed", "Tốc độ 35 km/h" } }),
                
                new("vinfast-theon-s", "VinFast Theon S", "Gasoline 50cc", 60000000m, "/images/products/evo300-turbo.png", "Xe máy 50cc thể thao đột phá.", true, 6,
                    new Dictionary<string, string> { { "Engine", "Động cơ 49.5cc" }, { "Range", "Quãng đường 150 km" }, { "MaxSpeed", "Tốc độ 90 km/h" } }),
                
                new("vinfast-zipp", "VinFast Zipp", "Gasoline 50cc", 15900000m, "/images/products/zipp.png", "Xe máy 50cc năng động sáng tạo.", true, 7,
                    new Dictionary<string, string> { { "Engine", "Động cơ 49.5cc" }, { "Range", "Quãng đường 80 km" }, { "MaxSpeed", "Tốc độ 40 km/h" } })
            };

            await _vehicleModels.InsertManyAsync(seedModels, cancellationToken: cancellationToken);
        }
    }

    private async Task SeedProductsPostgresDataAsync(CancellationToken cancellationToken)
    {
        var existingSkus = await _dbContext.Products.Select(p => p.Id).ToListAsync(cancellationToken);
        
        var productsToSeed = new List<Product>
        {
            // Electric vehicles
            new("vinfast-klara-s-2026", "VinFast Klara S 2026", "Xe máy điện", "/products/klara-s-white.png", 35000000m, 39200000m, "Giảm 11%", true, true, true, "lfp", "rent", "[\"Pin LFP kép\",\"Quãng đường 194 km / sạc\",\"Tốc độ tối đa 78 km/h\"]"),
            new("vinfast-impes", "VinFast Impes", "Xe máy điện", "/products/zgoo-1.jpg", 12900000m, 14448000m, "Giảm 11%", true, true, true, "lithium-ion", "rent", "[\"Pin Lithium-ion\",\"Quãng đường 70 km / sạc\",\"Tốc độ tối đa 50 km/h\"]"),
            new("vinfast-klara-s-premium", "VinFast Klara S 2026 Premium", "Xe máy điện", "/products/flazz-1.jpg", 36900000m, 41328000m, "Giảm 11%", true, true, true, "lfp", "rent", "[\"Pin LFP kép\",\"Quãng đường 194 km / sạc\",\"Màu sắc thanh lịch\"]"),
            new("vinfast-evo200-lite", "VinFast Evo200 Lite", "Xe máy điện", "/products/vinfast-evo-1.png", 19400000m, 21728000m, "Giảm 11%", true, true, true, "lfp", "rent", "[\"Pin LFP\",\"Quãng đường 205 km / sạc\",\"Tốc độ tối đa 49 km/h\"]"),
            new("vinfast-feliz-s", "VinFast Feliz S", "Xe máy điện", "/products/feliz-2025-den.jpg", 27000000m, 30240000m, "Giảm 11%", true, true, true, "lfp", "rent", "[\"Pin LFP\",\"Quãng đường 198 km / sạc\",\"Tốc độ tối đa 80 km/h\"]"),

            // CarOn Scraped New Models
            new("vinfast-amio", "VinFast Amio", "Xe máy điện", "/products/amio-white.webp", 15500000m, 18000000m, "Giảm 14%", true, true, true, "lithium-ion", "rent", "[\"Pin Lithium\",\"Quãng đường 100 km / sạc\",\"Nhỏ gọn linh hoạt\"]"),
            new("vinfast-evo-grand", "VinFast Evo Grand", "Xe máy điện", "/products/evo-grand-lite-1.jpg", 21000000m, 24500000m, "Giảm 14%", true, true, true, "lfp", "rent", "[\"Pin LFP\",\"Quãng đường 205 km / sạc\",\"Thiết kế thể thao\"]"),
            new("vinfast-zgoo", "VinFast Zgoo", "Xe máy điện", "/products/zgoo-1.jpg", 13900000m, 15900000m, "Giảm 12%", true, true, true, "lithium-ion", "rent", "[\"Pin Lithium\",\"Quãng đường 80 km / sạc\",\"Thể thao học sinh\"]"),
            new("vinfast-flazz", "VinFast Flazz", "Xe máy điện", "/products/flazz-1.jpg", 16500000m, 19000000m, "Giảm 13%", true, true, true, "lfp", "rent", "[\"Pin LFP\",\"Quãng đường 120 km / sạc\",\"Cá tính độc đáo\"]"),
            new("vinfast-kinet", "VinFast Kinet", "Xe máy điện", "/products/kinet.jpg", 17900000m, 20000000m, "Giảm 10%", true, true, true, "lfp", "rent", "[\"Pin LFP\",\"Quãng đường 150 km / sạc\",\"Công nghệ thông minh\"]"),
            new("vinfast-kyo", "VinFast Kyo", "Xe máy điện", "/products/kyo.jpg", 14900000m, 17000000m, "Giảm 12%", true, true, true, "lithium-ion", "rent", "[\"Pin Lithium\",\"Quãng đường 90 km / sạc\",\"Trẻ trung năng động\"]"),
            new("vinfast-viper", "VinFast Viper", "Xe máy điện", "/products/vinfast-viper-1.jpg", 32000000m, 36000000m, "Giảm 11%", true, true, true, "lfp", "rent", "[\"Pin LFP kép\",\"Quãng đường 180 km / sạc\",\"Phân khối lớn\"]"),

            // Gasoline 50cc
            new("vinfast-ludo", "VinFast Ludo", "Xe 50cc", "/products/ludo.png", 12900000m, 14835000m, "Giảm 13%", false, true, true, null, null, "[\"Động cơ 49.5cc\",\"Quãng đường 75 km\",\"Tốc độ 35 km/h\"]"),
            new("vinfast-theon-s", "VinFast Theon S", "Xe 50cc", "/products/vento-s.png", 60000000m, 69000000m, "Giảm 13%", true, true, true, null, null, "[\"Động cơ 49.5cc\",\"Quãng đường 150 km\",\"Tốc độ 90 km/h\"]"),
            new("vinfast-zipp", "VinFast Zipp", "Xe 50cc", "/products/zipp.png", 15900000m, 18285000m, "Giảm 13%", false, true, true, null, null, "[\"Động cơ 49.5cc\",\"Quãng đường 80 km\",\"Tốc độ 40 km/h\"]"),

            // Spare parts
            new("vf8-bat-001", "VinFast VF8 Battery Pack", "Phụ tùng", "/products/battery-pack.png", 15000000m, 18000000m, "Giảm 15%", false, true, true, "lfp", null, "[\"Mã kho: WH-A-01\",\"Còn 50 sản phẩm\"]"),
            new("vf9-tire-002", "VinFast VF9 Michelin Tire 21\"", "Phụ tùng", "/products/tire.png", 2500000m, 3000000m, "Giảm 15%", false, true, true, null, null, "[\"Mã kho: WH-B-04\",\"Còn 120 sản phẩm\"]"),
            new("vfe34-mot-003", "VinFast VF e34 Electric Motor", "Phụ tùng", "/products/motor.png", 8000000m, 10000000m, "Giảm 15%", false, true, true, null, null, "[\"Mã kho: WH-C-02\",\"Còn 15 sản phẩm\"]")
        };

        var missing = productsToSeed.Where(p => !existingSkus.Contains(p.Id)).ToList();
        if (missing.Any())
        {
            _logger.LogInformation("Seeding {Count} missing products to PostgreSQL...", missing.Count);
            await _dbContext.Products.AddRangeAsync(missing, cancellationToken);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
    }
}
