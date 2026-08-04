using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VinFastO2O.InventoryService.Domain.Entities;
using VinFastO2O.InventoryService.Domain.ValueObjects;

namespace VinFastO2O.InventoryService.Infrastructure.Persistence.Configurations;

public class InventoryLogConfiguration : IEntityTypeConfiguration<InventoryLog>
{
    public void Configure(EntityTypeBuilder<InventoryLog> builder)
    {
        builder.ToTable("inventory_logs");

        builder.HasKey(l => l.Id);

        builder.Property(l => l.Id)
            .HasConversion(
                id => id.Value,
                value => new InventoryLogId(value));

        builder.Property(l => l.VehicleId)
            .HasConversion(
                id => id.Value,
                value => new VehicleId(value))
            .IsRequired();

        builder.Property(l => l.FromStoreId)
            .HasConversion(
                id => id != null ? id.Value : (Guid?)null,
                value => value.HasValue ? new StoreId(value.Value) : null);

        builder.Property(l => l.ToStoreId)
            .HasConversion(
                id => id != null ? id.Value : (Guid?)null,
                value => value.HasValue ? new StoreId(value.Value) : null);

        builder.Property(l => l.Action)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(l => l.Timestamp)
            .IsRequired();

        builder.Property(l => l.PerformedBy)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(l => l.Notes)
            .HasMaxLength(500);

        // Define relationships
        builder.HasOne<Vehicle>()
            .WithMany()
            .HasForeignKey(l => l.VehicleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<Store>()
            .WithMany()
            .HasForeignKey(l => l.FromStoreId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Store>()
            .WithMany()
            .HasForeignKey(l => l.ToStoreId)
            .OnDelete(DeleteBehavior.Restrict);
            
        builder.Property(l => l.CreatedAt)
            .IsRequired();

        builder.Property(l => l.LastModifiedAt);
    }
}
