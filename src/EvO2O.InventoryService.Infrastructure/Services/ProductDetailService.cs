using Dapper;
using Microsoft.Extensions.Configuration;
using MongoDB.Driver;
using System.Data;
using EvO2O.InventoryService.Application.Common.Interfaces;
using EvO2O.InventoryService.Application.DTOs;
using EvO2O.InventoryService.Domain.Entities;
using EvO2O.InventoryService.Infrastructure.Persistence;

namespace EvO2O.InventoryService.Infrastructure.Services;

public class ProductDetailService : IProductDetailService
{
    private readonly IMongoCollection<VehicleModel> _vehicleModels;
    private readonly ISqlConnectionFactory _sqlConnectionFactory;

    public ProductDetailService(
        IMongoClient mongoClient,
        IConfiguration configuration,
        ISqlConnectionFactory sqlConnectionFactory)
    {
        _sqlConnectionFactory = sqlConnectionFactory;

        var dbName = configuration["MongoSettings:DatabaseName"] ?? "EvO2O_Catalog";
        var database = mongoClient.GetDatabase(dbName);
        _vehicleModels = database.GetCollection<VehicleModel>("vehicle_models");
    }

    public async Task<ProductDetailDto?> GetProductDetailByNameAsync(string modelName, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(modelName))
            return null;

        // 1. Fetch dynamic specifications & image gallery from MongoDB
        var filter = Builders<VehicleModel>.Filter.Regex(x => x.Name, new MongoDB.Bson.BsonRegularExpression(modelName, "i"));
        var mongoModel = await _vehicleModels.Find(filter).FirstOrDefaultAsync(cancellationToken);

        if (mongoModel == null)
        {
            if (modelName.Equals("Evo Max", StringComparison.OrdinalIgnoreCase))
            {
                var seedModel = new VehicleModel("evo-max", "Evo Max", "Electric Motorcycle", 22000000m, "https://vinfastauto.com/themes/custom/vinfast/images/evo-max.png", "Xe máy điện quốc dân thế hệ mới.", true, 0,
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
                    });
                await _vehicleModels.InsertOneAsync(seedModel, cancellationToken: cancellationToken);
                mongoModel = seedModel;
            }
            else
            {
                return null;
            }
        }

        // 2. Fetch base price and brand from PostgreSQL using Dapper
        decimal? sqlPrice = null;
        string? sqlBrand = null;

        try
        {
            using var connection = _sqlConnectionFactory.CreateConnection();
            const string sql = @"
                SELECT DISTINCT 
                    v.""Brand"" AS Brand,
                    MIN(v.""Price"") AS Price
                FROM vehicles v
                WHERE v.""ModelName"" ILIKE @ModelName
                GROUP BY v.""Brand""
                LIMIT 1;";

            var sqlResult = await connection.QueryFirstOrDefaultAsync<dynamic>(
                new CommandDefinition(sql, new { ModelName = modelName }, cancellationToken: cancellationToken));

            if (sqlResult != null)
            {
                sqlPrice = (decimal)sqlResult.Price;
                sqlBrand = (string)sqlResult.Brand;
            }
        }
        catch
        {
            // Fallback to MongoDB values if Postgres has no entries
        }

        // 3. Aggregate data into a clean ProductDetailDto
        return new ProductDetailDto
        {
            ProductCode = mongoModel.Id,
            ModelName = mongoModel.Name,
            Brand = sqlBrand ?? "VinFast",
            Price = sqlPrice ?? mongoModel.BasePrice,
            Segment = mongoModel.Segment,
            ImageUrl = mongoModel.ImageUrl,
            Description = mongoModel.Description,
            Specifications = mongoModel.Specifications,
            ImageGallery = mongoModel.ImageGallery
        };
    }
}
