using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VinFastO2O.OrderService.Domain.Entities;

namespace VinFastO2O.OrderService.Infrastructure.Persistence.Configurations;

internal sealed class AdminRefreshTokenConfiguration : IEntityTypeConfiguration<AdminRefreshToken>
{
    public void Configure(EntityTypeBuilder<AdminRefreshToken> builder)
    {
        builder.ToTable("AdminRefreshTokens");

        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id)
               .ValueGeneratedNever();

        builder.Property(t => t.Token)
               .IsRequired()
               .HasMaxLength(255);

        builder.HasIndex(t => t.Token)
               .IsUnique()
               .HasDatabaseName("UQ_AdminRefreshTokens_Token");

        builder.Property(t => t.ExpiresAt)
               .IsRequired();

        builder.Property(t => t.CreatedAt)
               .IsRequired()
               .HasDefaultValueSql("NOW()");

        builder.Property(t => t.RevokedAt)
               .IsRequired(false);

        // One-to-many relationship mapping: AdminUser -> RefreshTokens
        builder.HasOne(t => t.AdminUser)
               .WithMany()
               .HasForeignKey(t => t.AdminUserId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(t => t.AdminUserId)
               .HasDatabaseName("IX_AdminRefreshTokens_AdminUserId");
    }
}
