namespace VinFastO2O.OrderService.Domain.Enums;

/// <summary>
/// Loại tiền cọc: Linh hoạt (có thể hoàn) hay Cam kết (không hoàn nếu khách huỷ).
/// </summary>
public enum DepositType
{
    LinhHoat = 1,   // Flexible — hoàn 100% nếu huỷ trước X ngày
    CamKet   = 2    // Committed — không hoàn khi huỷ
}
