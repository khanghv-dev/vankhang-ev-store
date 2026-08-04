using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System.Collections.Generic;
using VinFastO2O.OrderService.Domain.Entities;

namespace VinFastO2O.OrderService.Infrastructure.Persistence.Configurations;

internal sealed class AdminUserConfiguration : IEntityTypeConfiguration<AdminUser>
{
    public void Configure(EntityTypeBuilder<AdminUser> builder)
    {
        builder.ToTable("AdminUsers");

        builder.HasKey(u => u.Id);
        builder.Property(u => u.Id)
               .ValueGeneratedNever();

        builder.Property(u => u.Username)
               .IsRequired()
               .HasMaxLength(50);
        builder.HasIndex(u => u.Username)
               .IsUnique()
               .HasDatabaseName("UQ_AdminUsers_Username");

        builder.Property(u => u.Email)
               .IsRequired()
               .HasMaxLength(320);
        builder.HasIndex(u => u.Email)
               .IsUnique()
               .HasDatabaseName("UQ_AdminUsers_Email");

        builder.Property(u => u.PasswordHash)
               .IsRequired()
               .HasMaxLength(255);

        builder.Property(u => u.IsActive)
               .IsRequired()
               .HasDefaultValue(true);

        builder.Property(u => u.CreatedAt)
               .IsRequired()
               .HasDefaultValueSql("NOW()");

        // Many-to-many: AdminUsers <-> Roles
        builder.HasMany(u => u.Roles)
               .WithMany(r => r.AdminUsers)
               .UsingEntity<Dictionary<string, object>>(
                   "AdminUserRoles",
                   j => j.HasOne<Role>().WithMany().HasForeignKey("RoleId").OnDelete(DeleteBehavior.Cascade),
                   j => j.HasOne<AdminUser>().WithMany().HasForeignKey("AdminUserId").OnDelete(DeleteBehavior.Cascade),
                   j =>
                   {
                       j.ToTable("AdminUserRoles");
                       j.HasKey("AdminUserId", "RoleId");
                   }
               );
    }
}
