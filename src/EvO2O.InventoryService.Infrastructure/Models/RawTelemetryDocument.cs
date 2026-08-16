using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EvO2O.InventoryService.Infrastructure.Models;

public class RawTelemetryDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;

    public string Vin { get; set; } = string.Empty;
    
    public double Latitude { get; set; }
    
    public double Longitude { get; set; }
    
    public double Speed { get; set; }
    
    public double BatteryPercentage { get; set; }
    
    public double BatteryTemperature { get; set; }
    
    public long TimestampUnix { get; set; }
    
    public DateTime IngestedAt { get; set; } = DateTime.UtcNow;
}
