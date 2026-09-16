using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VinFastO2O.InventoryService.Domain.Entities;
using VinFastO2O.InventoryService.Domain.ValueObjects;

namespace VinFastO2O.InventoryService.Infrastructure.Persistence.Configurations;

public class VehicleConfiguration : IEntityTypeConfiguration<Vehicle>
{
    public void Configure(EntityTypeBuilder<Vehicle> builder)
    {
        builder.ToTable("vehicles");

        builder.HasKey(v => v.Id);

        builder.Property(v => v.Id)
            .HasConversion(
                id => id.Value,
                value => new VehicleId(value));

        builder.Property(v => v.Vin)
            .HasConversion(
                vin => vin.Value,
                value => new Vin(value))
            .HasMaxLength(17)
            .IsRequired();

        // Unique constraint for VIN
        builder.HasIndex(v => v.Vin)
            .IsUnique();

        builder.Property(v => v.EngineNumber)
            .HasConversion(
                eng => eng.Value,
                value => new EngineNumber(value))
            .HasMaxLength(50)
            .IsRequired();

        // Unique constraint for Engine Number
        builder.HasIndex(v => v.EngineNumber)
            .IsUnique();

        builder.Property(v => v.ModelName)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(v => v.Color)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(v => v.Brand)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(v => v.Price)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(v => v.BatteryType)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(v => v.Status)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(v => v.StoreId)
            .HasConversion(
                id => id != null ? id.Value : (Guid?)null,
                value => value.HasValue ? new StoreId(value.Value) : null);

        // Define relationship with Store (Vehicle belongs to an optional Store)
        builder.HasOne<Store>()
            .WithMany()
            .HasForeignKey(v => v.StoreId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Property(v => v.CreatedAt)
            .IsRequired();

        builder.Property(v => v.LastModifiedAt);
    }
}
