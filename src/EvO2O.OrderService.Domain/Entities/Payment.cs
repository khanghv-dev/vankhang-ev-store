using EvO2O.OrderService.Domain.Common;
using EvO2O.OrderService.Domain.Enums;
using EvO2O.OrderService.Domain.ValueObjects;

namespace EvO2O.OrderService.Domain.Entities;

/// <summary>
/// Giao dịch thanh toán cho một đơn đặt cọc.
/// Mỗi lần khách nhấn "Thanh toán" = một Payment row mới (cho phép retry).
/// Chỉ một Payment.Status == Success được phép tồn tại trên mỗi Order.
/// </summary>
public class Payment : Entity<PaymentId>
{
    public OrderId       OrderId          { get; private set; } = null!;

    /// <summary>Mã giao dịch duy nhất từ cổng thanh toán (VNPay/MoMo...).</summary>
    public string        TransactionNo    { get; private set; } = string.Empty;

    public decimal       Amount           { get; private set; }
    public PaymentMethod PaymentMethod    { get; private set; }
    public PaymentStatus Status           { get; private set; }

    /// <summary>Raw JSON callback từ cổng thanh toán — phục vụ audit.</summary>
    public string?       GatewayResponse  { get; private set; }

    public DateTime?     PaidAt           { get; private set; }
    public DateTime?     FailedAt         { get; private set; }
    public DateTime?     RefundedAt       { get; private set; }
    public string?       RefundReason     { get; private set; }

    private Payment() { } // EF Core

    public Payment(
        PaymentId     id,
        OrderId       orderId,
        string        transactionNo,
        decimal       amount,
        PaymentMethod paymentMethod) : base(id)
    {
        if (string.IsNullOrWhiteSpace(transactionNo))
            throw new ArgumentException("Transaction number cannot be empty.", nameof(transactionNo));
        if (amount <= 0)
            throw new ArgumentOutOfRangeException(nameof(amount), "Amount must be greater than zero.");

        OrderId       = orderId;
        TransactionNo = transactionNo.Trim();
        Amount        = amount;
        PaymentMethod = paymentMethod;
        Status        = PaymentStatus.Pending;
    }

    /// <summary>
    /// Đánh dấu giao dịch thành công. Lưu raw response từ cổng thanh toán.
    /// </summary>
    public void MarkAsSuccess(string? gatewayResponse = null)
    {
        if (Status != PaymentStatus.Pending)
            throw new InvalidOperationException($"Cannot mark a {Status} payment as Success.");

        Status          = PaymentStatus.Success;
        PaidAt          = DateTime.UtcNow;
        GatewayResponse = gatewayResponse;
        LastModifiedAt  = DateTime.UtcNow;
    }

    /// <summary>
    /// Đánh dấu giao dịch thất bại. Khách có thể tạo Payment mới để retry.
    /// </summary>
    public void MarkAsFailed(string? gatewayResponse = null)
    {
        if (Status != PaymentStatus.Pending)
            throw new InvalidOperationException($"Cannot mark a {Status} payment as Failed.");

        Status          = PaymentStatus.Failed;
        FailedAt        = DateTime.UtcNow;
        GatewayResponse = gatewayResponse;
        LastModifiedAt  = DateTime.UtcNow;
    }

    /// <summary>
    /// Hoàn tiền — chỉ áp dụng sau khi giao dịch đã Success.
    /// </summary>
    public void Refund(string reason)
    {
        if (Status != PaymentStatus.Success)
            throw new InvalidOperationException("Only successful payments can be refunded.");
        if (string.IsNullOrWhiteSpace(reason))
            throw new ArgumentException("Refund reason is required.", nameof(reason));

        Status        = PaymentStatus.Refunded;
        RefundedAt    = DateTime.UtcNow;
        RefundReason  = reason.Trim();
        LastModifiedAt = DateTime.UtcNow;
    }
}
