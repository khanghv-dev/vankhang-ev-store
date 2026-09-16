using System;
using System.Collections.Generic;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace VinFastO2O.InventoryService.Infrastructure.Models;

public class BatteryStationLogDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("stationId")]
    public string StationId { get; set; } = string.Empty;

    [BsonElement("stationName")]
    public string StationName { get; set; } = string.Empty;

    [BsonElement("address")]
    public string Address { get; set; } = string.Empty;

    [BsonElement("totalSlots")]
    public int TotalSlots { get; set; } = 12;

    [BsonElement("slots")]
    public List<BatterySlotDetail> Slots { get; set; } = new();

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class BatterySlotDetail
{
    [BsonElement("slotNumber")]
    public int SlotNumber { get; set; }

    [BsonElement("batteryId")]
    public string? BatteryId { get; set; }

    [BsonElement("chargePercentage")]
    public int ChargePercentage { get; set; }

    [BsonElement("status")]
    public string Status { get; set; } = "EMPTY"; // "CHARGING", "FULL", "EMPTY", "FAULT"
}
