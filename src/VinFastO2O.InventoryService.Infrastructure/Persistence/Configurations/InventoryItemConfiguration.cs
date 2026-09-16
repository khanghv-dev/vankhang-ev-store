using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VinFastO2O.InventoryService.Domain.Entities;

namespace VinFastO2O.InventoryService.Infrastructure.Persistence.Configurations;

public class InventoryItemConfiguration : IEntityTypeConfiguration<InventoryItem>
{
    public void Configure(EntityTypeBuilder<InventoryItem> builder)
    {
        builder.ToTable("inventory_items");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.Sku)
            .HasMaxLength(50)
            .IsRequired();

        builder.HasIndex(i => i.Sku)
            .IsUnique();

        builder.Property(i => i.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(i => i.Quantity)
            .IsRequired();

        builder.Property(i => i.Location)
            .HasMaxLength(100);
            
        builder.Property(i => i.CreatedAt)
            .IsRequired();

        builder.Property(i => i.LastModifiedAt);
    }
}
