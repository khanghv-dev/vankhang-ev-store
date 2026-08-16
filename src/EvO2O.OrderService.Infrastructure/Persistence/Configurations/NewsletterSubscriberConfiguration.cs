using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using EvO2O.OrderService.Domain.Entities;

namespace EvO2O.OrderService.Infrastructure.Persistence.Configurations;

/// <summary>
/// EF Core Fluent API configuration for the <see cref="NewsletterSubscriber"/> entity.
/// Maps to the "NewsletterSubscribers" table with appropriate constraints.
/// </summary>
internal sealed class NewsletterSubscriberConfiguration : IEntityTypeConfiguration<NewsletterSubscriber>
{
    public void Configure(EntityTypeBuilder<NewsletterSubscriber> builder)
    {
        // ── Table Name ────────────────────────────────────────────────────────
        builder.ToTable("NewsletterSubscribers");

        // ── Primary Key ───────────────────────────────────────────────────────
        builder.HasKey(n => n.Id);
        builder.Property(n => n.Id)
               .ValueGeneratedNever(); // GUID generated in application layer

        // ── Email ─────────────────────────────────────────────────────────────
        builder.Property(n => n.Email)
               .IsRequired()
               .HasMaxLength(320); // Max email length standard

        // Unique index on Email column
        builder.HasIndex(n => n.Email)
               .IsUnique()
               .HasDatabaseName("UQ_NewsletterSubscribers_Email");

        // ── Timestamps & Status Flags ─────────────────────────────────────────
        builder.Property(n => n.SubscribedAt)
               .IsRequired()
               .HasDefaultValueSql("NOW()");

        builder.Property(n => n.IsActive)
               .IsRequired()
               .HasDefaultValue(true);
    }
}
