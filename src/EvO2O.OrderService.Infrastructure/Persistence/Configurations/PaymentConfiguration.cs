using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using EvO2O.OrderService.Domain.Entities;
using EvO2O.OrderService.Domain.Enums;
using EvO2O.OrderService.Domain.ValueObjects;

namespace EvO2O.OrderService.Infrastructure.Persistence.Configurations;

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.ToTable("payments");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Id)
            .HasConversion(
                id    => id.Value,
                value => new PaymentId(value));

        builder.Property(p => p.OrderId)
            .HasConversion(
                id    => id.Value,
                value => new OrderId(value))
            .IsRequired();

        builder.Property(p => p.TransactionNo)
            .HasMaxLength(100)
            .IsRequired();

        builder.HasIndex(p => p.TransactionNo)
            .IsUnique()
            .HasDatabaseName("uq_payments_txn");

        builder.Property(p => p.Amount)
            .HasColumnType("numeric(18,2)")
            .IsRequired();

        builder.Property(p => p.PaymentMethod)
            .HasConversion<string>()    // Store as VARCHAR for readability in DB
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(p => p.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(p => p.GatewayResponse)
            .HasColumnType("jsonb")
            .IsRequired(false);

        builder.Property(p => p.PaidAt).IsRequired(false);
        builder.Property(p => p.FailedAt).IsRequired(false);
        builder.Property(p => p.RefundedAt).IsRequired(false);

        builder.Property(p => p.RefundReason)
            .HasMaxLength(500)
            .IsRequired(false);

        builder.Property(p => p.CreatedAt).IsRequired();
        builder.Property(p => p.LastModifiedAt).IsRequired(false);

        builder.HasIndex(p => p.Status)
            .HasDatabaseName("idx_payments_status");
    }
}
