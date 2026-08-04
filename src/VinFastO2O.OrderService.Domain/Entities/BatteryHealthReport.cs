using System;

namespace VinFastO2O.OrderService.Domain.Entities;

public class BatteryHealthReport
{
    public string Vin { get; set; } = string.Empty;
    public double MaxTemp { get; set; }
    public double AvgTemp { get; set; }
    public int TempAnomaliesCount { get; set; }
    public int TotalRecords { get; set; }
    public double? AvgDischargeRate { get; set; }
    public double Soh { get; set; }
    public bool IsRisky { get; set; }
    public string AnalysisDate { get; set; } = string.Empty;
    public DateTime ProcessedAt { get; set; } = DateTime.UtcNow;
}
