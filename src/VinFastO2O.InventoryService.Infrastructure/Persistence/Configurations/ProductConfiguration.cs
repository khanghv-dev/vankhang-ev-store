using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VinFastO2O.InventoryService.Domain.Entities;

namespace VinFastO2O.InventoryService.Infrastructure.Persistence.Configurations;

internal sealed class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("products");

        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id)
               .HasMaxLength(100)
               .ValueGeneratedNever();

        builder.Property(p => p.Name)
               .IsRequired()
               .HasMaxLength(200);

        builder.Property(p => p.Category)
               .IsRequired()
               .HasMaxLength(50);

        builder.Property(p => p.Image)
               .IsRequired()
               .HasMaxLength(500);

        builder.Property(p => p.Price)
               .IsRequired()
               .HasColumnType("decimal(18,2)");

        builder.Property(p => p.OriginalPrice)
               .IsRequired(false)
               .HasColumnType("decimal(18,2)");

        builder.Property(p => p.DiscountText)
               .IsRequired(false)
               .HasMaxLength(50);

        builder.Property(p => p.IsNew)
               .IsRequired()
               .HasDefaultValue(false);

        builder.Property(p => p.InStock)
               .IsRequired()
               .HasDefaultValue(true);

        builder.Property(p => p.IsActive)
               .IsRequired()
               .HasDefaultValue(true);

        builder.Property(p => p.IsDeleted)
               .IsRequired()
               .HasDefaultValue(false);

        builder.Property(p => p.BatteryType)
               .IsRequired(false)
               .HasMaxLength(50);

        builder.Property(p => p.BatteryOption)
               .IsRequired(false)
               .HasMaxLength(50);

        builder.Property(p => p.SpecsJson)
               .IsRequired()
               .HasColumnType("jsonb")
               .HasDefaultValue("[]");
    }
}
