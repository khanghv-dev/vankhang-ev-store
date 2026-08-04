namespace VinFastO2O.InventoryService.Application.DTOs;

public record TelemetryIngestionRequestDto(
    string Vin,
    double Latitude,
    double Longitude,
    double Speed,
    double BatteryPercentage,
    double BatteryTemperature,
    long TimestampUnix
);
