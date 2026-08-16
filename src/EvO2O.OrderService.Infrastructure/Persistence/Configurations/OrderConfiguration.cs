using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using EvO2O.OrderService.Domain.Entities;
using EvO2O.OrderService.Domain.Enums;
using EvO2O.OrderService.Domain.ValueObjects;

namespace EvO2O.OrderService.Infrastructure.Persistence.Configurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("orders");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.Id)
            .HasConversion(
                id    => id.Value,
                value => new OrderId(value));

        // ── Customer snapshot ────────────────────────────────────────────────
        builder.Property(o => o.CustomerId).IsRequired();

        builder.Property(o => o.CustomerName)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(o => o.CustomerEmail)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(o => o.CustomerPhone)
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(o => o.CustomerIdCard)
            .HasMaxLength(30)
            .IsRequired();

        // ── Store ────────────────────────────────────────────────────────────
        builder.Property(o => o.StoreId).IsRequired();

        // ── Financials ───────────────────────────────────────────────────────
        builder.Property(o => o.TotalAmount)
            .HasColumnType("numeric(18,2)")
            .IsRequired();

        builder.Property(o => o.DepositAmount)
            .HasColumnType("numeric(18,2)")
            .IsRequired();

        builder.Property(o => o.DepositType)
            .HasConversion<string>()    // 'LinhHoat' | 'CamKet' in DB
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(o => o.BatteryOption)
            .HasConversion<string>()    // 'ThuePin' | 'MuaPin' in DB
            .HasMaxLength(20)
            .IsRequired();

        // ── Status & audit ───────────────────────────────────────────────────
        builder.Property(o => o.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(o => o.CancellationReason)
            .HasMaxLength(500)
            .IsRequired(false);

        builder.Property(o => o.PaidAt).IsRequired(false);
        builder.Property(o => o.CancelledAt).IsRequired(false);
        builder.Property(o => o.CreatedAt).IsRequired();
        builder.Property(o => o.LastModifiedAt).IsRequired(false);

        // ── Indexes ──────────────────────────────────────────────────────────
        builder.HasIndex(o => o.CustomerId).HasDatabaseName("idx_orders_customer_id");
        builder.HasIndex(o => o.StoreId).HasDatabaseName("idx_orders_store_id");
        builder.HasIndex(o => o.Status).HasDatabaseName("idx_orders_status");
        builder.HasIndex(o => new { o.CustomerId, o.Status }).HasDatabaseName("idx_orders_customer_status");

        // ── Relationships ────────────────────────────────────────────────────
        builder.HasMany(o => o.Items)
            .WithOne()
            .HasForeignKey("OrderId")           // shadow FK matching SQL column
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(o => o.Payments)
            .WithOne()
            .HasForeignKey("OrderId")
            .OnDelete(DeleteBehavior.Restrict);  // giữ lại lịch sử payment khi huỷ đơn
    }
}
