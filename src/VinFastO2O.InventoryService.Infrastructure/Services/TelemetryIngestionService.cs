using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using MongoDB.Bson;
using MongoDB.Driver;
using VinFastO2O.InventoryService.Application.Common.Interfaces;
using VinFastO2O.InventoryService.Application.DTOs;
using VinFastO2O.InventoryService.Infrastructure.Models;

namespace VinFastO2O.InventoryService.Infrastructure.Services;

public class TelemetryIngestionService : ITelemetryIngestionService
{
    private readonly IMongoCollection<RawTelemetryDocument> _telemetryCollection;

    public TelemetryIngestionService(IMongoClient mongoClient, IConfiguration configuration)
    {
        var databaseName = configuration["MongoSettings:TelemetryDatabaseName"] ?? "VinFastO2O_Telemetry";
        var collectionName = configuration["MongoSettings:TelemetryCollectionName"] ?? "raw_telemetry_queue";
        
        var database = mongoClient.GetDatabase(databaseName);
        _telemetryCollection = database.GetCollection<RawTelemetryDocument>(collectionName);
    }

    public async Task IngestTelemetryAsync(TelemetryIngestionRequestDto request, CancellationToken cancellationToken = default)
    {
        var document = new RawTelemetryDocument
        {
            Id = ObjectId.GenerateNewId().ToString(),
            Vin = request.Vin,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            Speed = request.Speed,
            BatteryPercentage = request.BatteryPercentage,
            BatteryTemperature = request.BatteryTemperature,
            TimestampUnix = request.TimestampUnix,
            IngestedAt = DateTime.UtcNow
        };

        // Bypass validation to prioritize high-throughput insertion speed
        var options = new InsertOneOptions { BypassDocumentValidation = true };
        await _telemetryCollection.InsertOneAsync(document, options, cancellationToken);
    }
}
