namespace VinFastO2O.OrderService.Domain.Enums;

/// <summary>
/// Phương thức thanh toán được hỗ trợ tại cổng thanh toán.
/// </summary>
public enum PaymentMethod
{
    BankTransfer = 1,   // Chuyển khoản ngân hàng
    VNPay        = 2,   // Cổng VNPay
    MoMo         = 3,   // Ví điện tử MoMo
    ZaloPay      = 4,   // Ví điện tử ZaloPay
    Cash         = 5    // Tiền mặt tại showroom
}
