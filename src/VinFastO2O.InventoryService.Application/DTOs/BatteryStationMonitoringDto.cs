using System;
using System.Collections.Generic;

namespace VinFastO2O.InventoryService.Application.DTOs;

public class BatteryStationMonitoringDto
{
    public string StationId { get; set; } = string.Empty;
    public string StationName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public int TotalSlots { get; set; }
    public int ChargingSlotsCount { get; set; }
    public int ReadyBatteriesCount { get; set; } // Số pin sạc đầy 100% sẵn sàng đổi
    public int EmptySlotsCount { get; set; }
    public string StationStatus { get; set; } = "OPERATIONAL"; // "OPERATIONAL", "FULL_CAPACITY", "OFFLINE"
    public DateTime LastUpdatedAt { get; set; }
}
