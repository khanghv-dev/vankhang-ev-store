using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using EvO2O.OrderService.Domain.Entities;

namespace EvO2O.OrderService.Infrastructure.Persistence.Configurations;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("audit_logs");

        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).HasColumnName("id");

        builder.Property(a => a.Timestamp)
            .HasColumnName("timestamp")
            .IsRequired();

        builder.Property(a => a.AdminUsername)
            .HasColumnName("admin_username")
            .HasMaxLength(100)
            .IsRequired();

        builder.HasIndex(a => a.AdminUsername);

        builder.Property(a => a.Action)
            .HasColumnName("action")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(a => a.Description)
            .HasColumnName("description")
            .IsRequired();

        builder.Property(a => a.IpAddress)
            .HasColumnName("ip_address")
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(a => a.UserAgent)
            .HasColumnName("user_agent")
            .HasMaxLength(500);
    }
}
