using VinFastO2O.OrderService.Domain.Common;
using VinFastO2O.OrderService.Domain.Enums;
using VinFastO2O.OrderService.Domain.ValueObjects;

namespace VinFastO2O.OrderService.Domain.Entities;

public class Order : Entity<OrderId>
{
    // ── Thông tin khách hàng (snapshot tại thời điểm đặt cọc) ──────────────
    public Guid   CustomerId      { get; private set; }
    public string CustomerName    { get; private set; } = string.Empty;
    public string CustomerEmail   { get; private set; } = string.Empty;
    public string CustomerPhone   { get; private set; } = string.Empty;
    public string CustomerIdCard  { get; private set; } = string.Empty;

    // ── Showroom ────────────────────────────────────────────────────────────
    public Guid StoreId { get; private set; }

    // ── Tài chính ───────────────────────────────────────────────────────────
    public decimal      TotalAmount   { get; private set; }
    public decimal      DepositAmount { get; private set; }
    public DepositType  DepositType   { get; private set; }
    public BatteryOption BatteryOption { get; private set; }

    // ── Trạng thái ──────────────────────────────────────────────────────────
    public OrderStatus Status            { get; private set; }
    public string?     CancellationReason { get; private set; }

    // ── Timestamps ──────────────────────────────────────────────────────────
    public DateTime?   PaidAt               { get; private set; }
    public DateTime?   CancelledAt          { get; private set; }
    public DateTime?   RefundedAt           { get; private set; }
    public string?     RefundTransactionId  { get; private set; }

    // ── Navigation properties (EF Core) ─────────────────────────────────────
    private readonly List<OrderItem> _items    = [];
    private readonly List<Payment>   _payments = [];

    public IReadOnlyCollection<OrderItem> Items    => _items.AsReadOnly();
    public IReadOnlyCollection<Payment>   Payments => _payments.AsReadOnly();

    private Order() { } // EF Core

    public Order(
        OrderId      id,
        Guid         customerId,
        string       customerName,
        string       customerEmail,
        string       customerPhone,
        string       customerIdCard,
        Guid         storeId,
        decimal      totalAmount,
        decimal      depositAmount,
        DepositType  depositType   = DepositType.LinhHoat,
        BatteryOption batteryOption = BatteryOption.MuaPin) : base(id)
    {
        if (string.IsNullOrWhiteSpace(customerName))
            throw new ArgumentException("Customer name cannot be empty.", nameof(customerName));
        if (string.IsNullOrWhiteSpace(customerEmail))
            throw new ArgumentException("Customer email cannot be empty.", nameof(customerEmail));
        if (string.IsNullOrWhiteSpace(customerPhone))
            throw new ArgumentException("Customer phone cannot be empty.", nameof(customerPhone));
        if (string.IsNullOrWhiteSpace(customerIdCard))
            throw new ArgumentException("Customer ID card cannot be empty.", nameof(customerIdCard));
        if (totalAmount <= 0)
            throw new ArgumentOutOfRangeException(nameof(totalAmount), "Total amount must be greater than zero.");
        if (depositAmount <= 0 || depositAmount > totalAmount)
            throw new ArgumentOutOfRangeException(nameof(depositAmount), "Deposit must be > 0 and ≤ total amount.");

        CustomerId     = customerId;
        CustomerName   = customerName.Trim();
        CustomerEmail  = customerEmail.Trim().ToLowerInvariant();
        CustomerPhone  = customerPhone.Trim();
        CustomerIdCard = customerIdCard.Trim();
        StoreId        = storeId;
        TotalAmount    = totalAmount;
        DepositAmount  = depositAmount;
        DepositType    = depositType;
        BatteryOption  = batteryOption;
        Status         = OrderStatus.Draft;
    }

    // ── Domain methods ───────────────────────────────────────────────────────

    /// <summary>Thêm dòng sản phẩm vào đơn hàng (chỉ khi Draft).</summary>
    public void AddItem(OrderItem item)
    {
        if (Status != OrderStatus.Draft)
            throw new InvalidOperationException("Items can only be added to a Draft order.");

        _items.Add(item);
        LastModifiedAt = DateTime.UtcNow;
    }

    /// <summary>Ghi nhận một giao dịch thanh toán mới.</summary>
    public void AddPayment(Payment payment)
    {
        if (Status is OrderStatus.Delivered or OrderStatus.Cancelled)
            throw new InvalidOperationException($"Cannot add payment to a {Status} order.");

        _payments.Add(payment);
        LastModifiedAt = DateTime.UtcNow;
    }

    // ── State transitions (ủy quyền cho State pattern) ──────────────────────
    internal void TransitionTo(OrderStatus nextStatus, string? reason = null)
    {
        Status = nextStatus;
        switch (nextStatus)
        {
            case OrderStatus.Paid:
                PaidAt = DateTime.UtcNow;
                break;
            case OrderStatus.Cancelled:
                CancelledAt = DateTime.UtcNow;
                CancellationReason = reason
                    ?? throw new ArgumentNullException(nameof(reason), "Cancellation reason is required.");
                break;
            case OrderStatus.Refunded:
                RefundedAt = DateTime.UtcNow;
                break;
        }
        LastModifiedAt = DateTime.UtcNow;
    }

    public void Submit()  => States.OrderState.FromStatus(Status).Submit(this);
    public void Pay()     => States.OrderState.FromStatus(Status).Pay(this);
    public void Prepare() => States.OrderState.FromStatus(Status).Prepare(this);
    public void Deliver() => States.OrderState.FromStatus(Status).Deliver(this);
    public void Cancel(string reason) => States.OrderState.FromStatus(Status).Cancel(this);

    /// <summary>
    /// Thực hiện hủy đơn và hoàn tiền cọc đối với các đơn hàng có gói cọc linh hoạt.
    /// </summary>
    public void RefundOrder(string? refundTransactionId = null)
    {
        if (DepositType != DepositType.LinhHoat)
        {
            throw new InvalidOperationException("Chỉ đơn hàng sử dụng gói cọc Linh Hoạt (LinhHoat) mới được phép hoàn tiền cọc.");
        }

        RefundTransactionId = refundTransactionId;
        States.OrderState.FromStatus(Status).Refund(this);
    }

    /// <summary>
    /// Gán thủ công số VIN thực tế cho đơn hàng và chuyển trạng thái sang VinAssigned.
    /// </summary>
    public void AssignVinManual(string vin, Guid? itemId = null)
    {
        if (_items.Count == 0)
            throw new InvalidOperationException("Không thể gán VIN cho đơn hàng không có sản phẩm.");

        var targetItem = itemId.HasValue
            ? _items.FirstOrDefault(i => i.Id.Value == itemId.Value)
            : _items.FirstOrDefault();

        if (targetItem is null)
            throw new InvalidOperationException($"Không tìm thấy dòng sản phẩm với ID '{itemId}'.");

        targetItem.OverrideVin(vin);
        States.OrderState.FromStatus(Status).AssignVin(this);
    }

    // Convenience aliases
    public void MarkAsPaid()            => Pay();
    public void CancelOrder(string reason) => Cancel(reason);
}
