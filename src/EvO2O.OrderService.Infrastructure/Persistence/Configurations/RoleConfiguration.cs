using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System.Collections.Generic;
using EvO2O.OrderService.Domain.Entities;

namespace EvO2O.OrderService.Infrastructure.Persistence.Configurations;

internal sealed class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> builder)
    {
        builder.ToTable("Roles");

        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id)
               .ValueGeneratedNever();

        builder.Property(r => r.Code)
               .IsRequired()
               .HasMaxLength(50);
        builder.HasIndex(r => r.Code)
               .IsUnique()
               .HasDatabaseName("UQ_Roles_Code");

        builder.Property(r => r.Name)
               .IsRequired()
               .HasMaxLength(100);

        builder.Property(r => r.Description)
               .HasMaxLength(255)
               .IsRequired(false);

        builder.Property(r => r.CreatedAt)
               .IsRequired()
               .HasDefaultValueSql("NOW()");

        // Many-to-many: Roles <-> Permissions
        builder.HasMany(r => r.Permissions)
               .WithMany(p => p.Roles)
               .UsingEntity<Dictionary<string, object>>(
                   "RolePermissions",
                   j => j.HasOne<Permission>().WithMany().HasForeignKey("PermissionId").OnDelete(DeleteBehavior.Cascade),
                   j => j.HasOne<Role>().WithMany().HasForeignKey("RoleId").OnDelete(DeleteBehavior.Cascade),
                   j =>
                   {
                       j.ToTable("RolePermissions");
                       j.HasKey("RoleId", "PermissionId");
                   }
               );
    }
}
