using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using EvO2O.OrderService.Domain.Entities;
using EvO2O.OrderService.Domain.ValueObjects;

namespace EvO2O.OrderService.Infrastructure.Persistence.Configurations;

public class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> builder)
    {
        builder.ToTable("order_items");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.Id)
            .HasConversion(
                id    => id.Value,
                value => new OrderItemId(value));

        builder.Property(i => i.OrderId)
            .HasConversion(
                id    => id.Value,
                value => new OrderId(value))
            .IsRequired();

        builder.Property(i => i.ProductId)
            .IsRequired();

        builder.Property(i => i.ProductName)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(i => i.UnitPrice)
            .HasColumnType("numeric(18,2)")
            .IsRequired();

        builder.Property(i => i.Quantity)
            .IsRequired();

        // AssignedVin: optional, fixed-length 17-char string
        builder.Property(i => i.AssignedVin)
            .HasMaxLength(17)
            .IsFixedLength()
            .IsRequired(false);

        builder.Property(i => i.VinAssignedAt)
            .IsRequired(false);

        // Computed column LineTotal is calculated in-memory and in DB — ignore in EF Core
        builder.Ignore(i => i.LineTotal);

        builder.Property(i => i.CreatedAt).IsRequired();
        builder.Property(i => i.LastModifiedAt).IsRequired(false);

        // Unique partial index: one VIN → one order_item (handled in SQL; EF index below)
        builder.HasIndex(i => i.AssignedVin)
            .IsUnique()
            .HasFilter("\"AssignedVin\" IS NOT NULL")
            .HasDatabaseName("uq_order_items_assigned_vin");
    }
}
