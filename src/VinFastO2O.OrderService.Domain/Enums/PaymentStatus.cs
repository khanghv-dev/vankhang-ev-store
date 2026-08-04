namespace VinFastO2O.OrderService.Domain.Enums;

/// <summary>
/// Trạng thái của một giao dịch thanh toán.
/// Mỗi lần gọi cổng tạo ra một Payment row mới với status ban đầu là Pending.
/// </summary>
public enum PaymentStatus
{
    Pending  = 1,   // Đang xử lý — chờ callback từ cổng
    Success  = 2,   // Thanh toán thành công
    Failed   = 3,   // Thất bại — user có thể thử lại
    Refunded = 4    // Đã hoàn tiền
}
