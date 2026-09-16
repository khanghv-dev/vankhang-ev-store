using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VinFastO2O.OrderService.Domain.Entities;

namespace VinFastO2O.OrderService.Infrastructure.Persistence.Configurations;

public class BatteryHealthReportConfiguration : IEntityTypeConfiguration<BatteryHealthReport>
{
    public void Configure(EntityTypeBuilder<BatteryHealthReport> builder)
    {
        builder.ToTable("battery_health_reports");

        builder.HasKey(b => b.Vin);
        builder.Property(b => b.Vin).HasColumnName("vin").HasMaxLength(50);

        builder.Property(b => b.MaxTemp).HasColumnName("max_temp").IsRequired();
        builder.Property(b => b.AvgTemp).HasColumnName("avg_temp").IsRequired();
        builder.Property(b => b.TempAnomaliesCount).HasColumnName("temp_anomalies_count").IsRequired();
        builder.Property(b => b.TotalRecords).HasColumnName("total_records").IsRequired();
        builder.Property(b => b.AvgDischargeRate).HasColumnName("avg_discharge_rate");
        builder.Property(b => b.Soh).HasColumnName("soh").IsRequired();
        builder.Property(b => b.IsRisky).HasColumnName("is_risky").IsRequired();
        builder.Property(b => b.AnalysisDate).HasColumnName("analysis_date").HasMaxLength(20).IsRequired();
        builder.Property(b => b.ProcessedAt).HasColumnName("processed_at").IsRequired();
    }
}
