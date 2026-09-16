using VinFastO2O.OrderService.Domain.Common;
using VinFastO2O.OrderService.Domain.ValueObjects;

namespace VinFastO2O.OrderService.Domain.Entities;

/// <summary>
/// Dòng sản phẩm trong đơn đặt cọc.
/// Mỗi OrderItem đại diện cho một model xe máy điện VinFast.
/// AssignedVin được gán bởi InventoryService sau khi thanh toán cọc thành công.
/// </summary>
public class OrderItem : Entity<OrderItemId>
{
    public OrderId    OrderId     { get; private set; } = null!;
    public Guid       ProductId   { get; private set; }
    public string     ProductName { get; private set; } = string.Empty;
    public decimal    UnitPrice   { get; private set; }
    public int        Quantity    { get; private set; }

    /// <summary>
    /// Số khung xe (VIN) — NULL cho đến khi InventoryService gán.
    /// Format: 17 ký tự, ký tự hợp lệ A-H J-N P-R S-Z 0-9 (không có I, O, Q).
    /// </summary>
    public string?    AssignedVin     { get; private set; }
    public DateTime?  VinAssignedAt   { get; private set; }

    /// <summary>Tổng tiền dòng = UnitPrice × Quantity.</summary>
    public decimal LineTotal => UnitPrice * Quantity;

    private OrderItem() { } // EF Core

    public OrderItem(
        OrderItemId id,
        OrderId     orderId,
        Guid        productId,
        string      productName,
        decimal     unitPrice,
        int         quantity = 1) : base(id)
    {
        if (string.IsNullOrWhiteSpace(productName))
            throw new ArgumentException("Product name cannot be empty.", nameof(productName));
        if (unitPrice <= 0)
            throw new ArgumentOutOfRangeException(nameof(unitPrice), "Unit price must be greater than zero.");
        if (quantity <= 0)
            throw new ArgumentOutOfRangeException(nameof(quantity), "Quantity must be at least 1.");

        OrderId     = orderId;
        ProductId   = productId;
        ProductName = productName.Trim();
        UnitPrice   = unitPrice;
        Quantity    = quantity;
    }

    /// <summary>
    /// Gán số khung VIN cho item sau khi InventoryService reserve thành công.
    /// </summary>
    /// <param name="vin">Số VIN 17 ký tự.</param>
    public void AssignVin(string vin)
    {
        if (string.IsNullOrWhiteSpace(vin) || vin.Length != 17)
            throw new ArgumentException("A valid 17-character VIN is required.", nameof(vin));
        if (AssignedVin is not null)
            throw new InvalidOperationException($"VIN already assigned: {AssignedVin}.");

        AssignedVin   = vin.Trim().ToUpperInvariant();
        VinAssignedAt = DateTime.UtcNow;
        LastModifiedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Ghi đè số khung VIN cho item khi điều phối viên thực hiện đổi/gán lại xe.
    /// </summary>
    /// <param name="vin">Số VIN 17 ký tự.</param>
    public void OverrideVin(string vin)
    {
        if (string.IsNullOrWhiteSpace(vin) || vin.Length != 17)
            throw new ArgumentException("A valid 17-character VIN is required.", nameof(vin));

        AssignedVin   = vin.Trim().ToUpperInvariant();
        VinAssignedAt = DateTime.UtcNow;
        LastModifiedAt = DateTime.UtcNow;
    }
}
