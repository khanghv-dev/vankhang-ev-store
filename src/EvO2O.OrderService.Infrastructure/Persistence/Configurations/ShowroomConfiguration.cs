using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using EvO2O.OrderService.Domain.Entities;

namespace EvO2O.OrderService.Infrastructure.Persistence.Configurations;

public class ShowroomConfiguration : IEntityTypeConfiguration<Showroom>
{
    public void Configure(EntityTypeBuilder<Showroom> builder)
    {
        builder.ToTable("showrooms");

        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasColumnName("id");

        builder.Property(s => s.Code)
            .HasColumnName("code")
            .HasMaxLength(50)
            .IsRequired();

        builder.HasIndex(s => s.Code).IsUnique();

        builder.Property(s => s.Name)
            .HasColumnName("name")
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(s => s.Address)
            .HasColumnName("address")
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(s => s.Latitude)
            .HasColumnName("latitude")
            .IsRequired();

        builder.Property(s => s.Longitude)
            .HasColumnName("longitude")
            .IsRequired();

        builder.Property(s => s.Hotline)
            .HasColumnName("hotline")
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(s => s.OpenTime)
            .HasColumnName("open_time")
            .HasMaxLength(20)
            .HasDefaultValue("08:00");

        builder.Property(s => s.CloseTime)
            .HasColumnName("close_time")
            .HasMaxLength(20)
            .HasDefaultValue("20:00");

        builder.Property(s => s.IsActive)
            .HasColumnName("is_active")
            .HasDefaultValue(true);

        builder.Property(s => s.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Property(s => s.UpdatedAt)
            .HasColumnName("updated_at");
    }
}
