using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using System.Text.Json;
using EvO2O.InventoryService.Application.Common.Interfaces;
using EvO2O.InventoryService.Application.DTOs;
using EvO2O.InventoryService.Domain.Entities;

namespace EvO2O.InventoryService.Infrastructure.Services;

public class CatalogService : ICatalogService
{
    private readonly IMongoCollection<VehicleModel> _vehicleModels;
    private readonly IDistributedCache _cache;
    private readonly ILogger<CatalogService> _logger;
    private const string CacheKey = "catalog:homepage_vehicle_models";

    public CatalogService(
        IMongoClient mongoClient,
        IConfiguration configuration,
        IDistributedCache cache,
        ILogger<CatalogService> logger)
    {
        _cache = cache;
        _logger = logger;

        var dbName = configuration["MongoSettings:DatabaseName"] ?? "EvO2O_Catalog";
        var database = mongoClient.GetDatabase(dbName);
        _vehicleModels = database.GetCollection<VehicleModel>("vehicle_models");
    }

    public async Task<IEnumerable<VehicleModelDto>> GetHomepageVehicleModelsAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Checking homepage vehicle models in Redis Cache...");

        // 1. Try to get from Redis Cache
        var cachedData = await _cache.GetStringAsync(CacheKey, cancellationToken);
        if (!string.IsNullOrEmpty(cachedData))
        {
            _logger.LogInformation("Cache hit! Returning vehicle models from Redis.");
            return JsonSerializer.Deserialize<List<VehicleModelDto>>(cachedData) ?? new List<VehicleModelDto>();
        }

        _logger.LogInformation("Cache miss! Querying vehicle models from MongoDB...");

        // 2. Query MongoDB
        var filter = Builders<VehicleModel>.Filter.Eq(x => x.ShowOnHomepage, true);
        var sort = Builders<VehicleModel>.Sort.Ascending(x => x.DisplayOrder);
        
        var models = await _vehicleModels
            .Find(filter)
            .Sort(sort)
            .ToListAsync(cancellationToken);

        // Seed data if MongoDB is completely empty
        if (!models.Any())
        {
            _logger.LogInformation("MongoDB is empty. Seeding initial vehicle models...");
            models = GetSeedVehicleModels();
            await _vehicleModels.InsertManyAsync(models, cancellationToken: cancellationToken);
        }

        // Map to DTOs
        var dtos = models.Select(m => new VehicleModelDto
        {
            Id = m.Id,
            Name = m.Name,
            Segment = m.Segment,
            BasePrice = m.BasePrice,
            ImageUrl = m.ImageUrl,
            Description = m.Description,
            DisplayOrder = m.DisplayOrder
        }).ToList();

        // 3. Save to Redis Cache (Cache for 30 minutes)
        var cacheOptions = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30)
        };

        _logger.LogInformation("Saving queried vehicle models to Redis Cache...");
        var serializedData = JsonSerializer.Serialize(dtos);
        await _cache.SetStringAsync(CacheKey, serializedData, cacheOptions, cancellationToken);

        return dtos;
    }

    public async Task<VehicleModelDto?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(id))
            return null;

        var filter = Builders<VehicleModel>.Filter.Eq(x => x.Id, id.ToLowerInvariant().Trim());
        var model = await _vehicleModels.Find(filter).FirstOrDefaultAsync(cancellationToken);

        if (model == null)
            return null;

        return new VehicleModelDto
        {
            Id = model.Id,
            Name = model.Name,
            Segment = model.Segment,
            BasePrice = model.BasePrice,
            ImageUrl = model.ImageUrl,
            Description = model.Description,
            DisplayOrder = model.DisplayOrder
        };
    }

    private static List<VehicleModel> GetSeedVehicleModels()
    {
        return new List<VehicleModel>
        {
            new("evo-max", "Evo Max", "Electric Motorcycle", 22000000m, "https://vinfastauto.com/themes/custom/vinfast/images/evo-max.png", "Xe máy điện quốc dân thế hệ mới.", true, 0,
                new Dictionary<string, string>
                {
                    { "BatteryCapacity", "3.5 kWh" },
                    { "Range", "203 km" },
                    { "MaxSpeed", "70 km/h" },
                    { "ChargingTime", "4 hours" },
                    { "MotorPower", "1500 W" }
                },
                new List<string>
                {
                    "https://vinfastauto.com/images/evo-max-front.jpg",
                    "https://vinfastauto.com/images/evo-max-side.jpg",
                    "https://vinfastauto.com/images/evo-max-dashboard.jpg"
                }),
            new("vf5", "VinFast VF 5 Plus", "A-SUV", 468000000m, "https://vinfastauto.com/themes/custom/vinfast/images/vf5.png", "Mẫu SUV hạng A năng động, thời thượng cho đô thị.", true, 1,
                new Dictionary<string, string>
                {
                    { "BatteryCapacity", "37.23 kWh" },
                    { "Range", "326 km" },
                    { "MaxPower", "100 kW" },
                    { "MaxTorque", "135 Nm" }
                },
                new List<string> { "https://vinfastauto.com/images/vf5-red.jpg", "https://vinfastauto.com/images/vf5-blue.jpg" }),
            new("vf8", "VinFast VF 8", "D-SUV", 1090000000m, "https://vinfastauto.com/themes/custom/vinfast/images/vf8.png", "Đỉnh cao công nghệ lái thông minh phân khúc D-SUV.", true, 4,
                new Dictionary<string, string>
                {
                    { "BatteryCapacity", "88.5 kWh" },
                    { "Range", "420 km" },
                    { "MaxPower", "300 kW" },
                    { "Acceleration_0_100", "5.5s" }
                },
                new List<string> { "https://vinfastauto.com/images/vf8-front.jpg", "https://vinfastauto.com/images/vf8-interior.jpg" })
        };
    }
}
