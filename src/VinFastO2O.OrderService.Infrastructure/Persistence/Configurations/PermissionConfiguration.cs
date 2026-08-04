using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VinFastO2O.OrderService.Domain.Entities;

namespace VinFastO2O.OrderService.Infrastructure.Persistence.Configurations;

internal sealed class PermissionConfiguration : IEntityTypeConfiguration<Permission>
{
    public void Configure(EntityTypeBuilder<Permission> builder)
    {
        builder.ToTable("Permissions");

        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id)
               .ValueGeneratedNever();

        builder.Property(p => p.Code)
               .IsRequired()
               .HasMaxLength(50);
        builder.HasIndex(p => p.Code)
               .IsUnique()
               .HasDatabaseName("UQ_Permissions_Code");

        builder.Property(p => p.Name)
               .IsRequired()
               .HasMaxLength(100);

        builder.Property(p => p.Description)
               .HasMaxLength(255)
               .IsRequired(false);

        builder.Property(p => p.CreatedAt)
               .IsRequired()
               .HasDefaultValueSql("NOW()");
    }
}
