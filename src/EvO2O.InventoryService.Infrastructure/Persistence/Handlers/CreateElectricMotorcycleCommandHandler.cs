using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Caching.Distributed;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using EvO2O.InventoryService.Application.Products.Commands;
using EvO2O.InventoryService.Domain.Entities;
using EvO2O.InventoryService.Infrastructure.Persistence;

namespace EvO2O.InventoryService.Infrastructure.Persistence.Handlers;

public class CreateElectricMotorcycleCommandHandler : IRequestHandler<CreateElectricMotorcycleCommand, string>
{
    private readonly InventoryDbContext _dbContext;
    private readonly IMongoCollection<VehicleModel> _vehicleModels;
    private readonly IDistributedCache _cache;
    private readonly ILogger<CreateElectricMotorcycleCommandHandler> _logger;

    public CreateElectricMotorcycleCommandHandler(
        InventoryDbContext dbContext,
        IMongoClient mongoClient,
        IConfiguration configuration,
        IDistributedCache cache,
        ILogger<CreateElectricMotorcycleCommandHandler> logger)
    {
        _dbContext = dbContext;
        _cache = cache;
        _logger = logger;

        var dbName = configuration["MongoSettings:DatabaseName"] ?? "EvO2O_Catalog";
        var database = mongoClient.GetDatabase(dbName);
        _vehicleModels = database.GetCollection<VehicleModel>("vehicle_models");
    }

    public async Task<string> Handle(CreateElectricMotorcycleCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Handling CreateElectricMotorcycleCommand for SKU/Id: {Sku}", request.Sku);

        // 1. Validation
        if (string.IsNullOrWhiteSpace(request.Sku))
            throw new ArgumentException("SKU/Id cannot be empty.", nameof(request.Sku));
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Name cannot be empty.", nameof(request.Name));
        if (request.Price < 0)
            throw new ArgumentException("Price cannot be negative.");

        var sku = request.Sku.Trim().ToLowerInvariant();

        // 2. Check for duplicates in both databases
        var existsInPostgres = await _dbContext.Products.AnyAsync(p => p.Id == sku, cancellationToken);
        if (existsInPostgres)
        {
            throw new InvalidOperationException($"Product with SKU/Id '{sku}' already exists in PostgreSQL.");
        }

        var existsInMongo = await _vehicleModels.Find(vm => vm.Id == sku).AnyAsync(cancellationToken);
        if (existsInMongo)
        {
            throw new InvalidOperationException($"Vehicle model with SKU/Id '{sku}' already exists in MongoDB.");
        }

        // 3. Create MongoDB entity
        var specifications = new Dictionary<string, string>
        {
            { "Dimension", request.Dimensions },
            { "Battery", request.BatteryType },
            { "EnginePower", request.EnginePower },
            { "MaxSpeed", request.MaxSpeed },
            { "Range", request.RangePerCharge }
        };

        var vehicleModel = new VehicleModel(
            sku,
            request.Name,
            "Electric Motorcycle",
            request.Price,
            request.ImageUrl,
            request.Description,
            showOnHomepage: true,
            displayOrder: 10,
            specifications: specifications,
            imageGallery: new List<string> { request.ImageUrl }
        );

        // 4. Create PostgreSQL entity
        var specsList = new List<string>
        {
            $"Kích thước: {request.Dimensions}",
            $"Pin: {request.BatteryType}",
            $"Công suất: {request.EnginePower}",
            $"Tốc độ tối đa: {request.MaxSpeed}",
            $"Quãng đường: {request.RangePerCharge}"
        };
        var specsJson = JsonSerializer.Serialize(specsList);

        var product = new Product(
            sku,
            request.Name,
            "Xe điện",
            request.ImageUrl,
            request.Price,
            originalPrice: request.Price * 1.12m, // Standard original price
            discountText: "Giảm 11%",
            isNew: true,
            inStock: true,
            isActive: true,
            batteryType: request.BatteryType.Contains("LFP") ? "lfp" : "lithium-ion",
            batteryOption: "rent",
            specsJson: specsJson
        );

        // 5. Dual-Write with Compensating Transaction
        try
        {
            // Insert into MongoDB first
            await _vehicleModels.InsertOneAsync(vehicleModel, null, cancellationToken);
            _logger.LogInformation("Successfully inserted VehicleModel '{Sku}' into MongoDB.", sku);

            try
            {
                // Insert into PostgreSQL
                _dbContext.Products.Add(product);
                await _dbContext.SaveChangesAsync(cancellationToken);
                _logger.LogInformation("Successfully inserted Product '{Sku}' into PostgreSQL.", sku);

                // Invalidate Redis homepage cache so new product appears instantly
                try
                {
                    const string homepageCacheKey = "catalog:homepage_vehicle_models";
                    await _cache.RemoveAsync(homepageCacheKey, cancellationToken);
                    _logger.LogInformation("Invalidated Redis homepage cache key '{CacheKey}' for new product SKU: {Sku}", homepageCacheKey, sku);
                }
                catch (Exception cacheEx)
                {
                    _logger.LogWarning(cacheEx, "Failed to invalidate Redis cache key 'catalog:homepage_vehicle_models'.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "PostgreSQL write failed. Compensating MongoDB write for SKU/Id '{Sku}'...", sku);
                
                // Compensating write: delete from MongoDB
                await _vehicleModels.DeleteOneAsync(vm => vm.Id == sku, cancellationToken);
                _logger.LogWarning("Compensated MongoDB write: deleted VehicleModel '{Sku}'.", sku);
                
                throw;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Transaction failed for hybrid product creation of SKU/Id '{Sku}'.", sku);
            throw;
        }

        return sku;
    }
}
