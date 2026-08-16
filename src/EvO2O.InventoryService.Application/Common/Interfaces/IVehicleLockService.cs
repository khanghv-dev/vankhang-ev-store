namespace EvO2O.InventoryService.Application.Common.Interfaces;

/// <summary>
/// Dịch vụ khóa phân tán (distributed lock) dựa trên Redis.
/// Dùng để giữ chỗ (reserve) một xe máy điện VinFast trong khi
/// khách hàng đang thực hiện quy trình thanh toán.
/// </summary>
public interface IVehicleLockService
{
    /// <summary>
    /// Cố gắng đặt khóa cho một xe theo số VIN.
    /// Key Redis: <c>vins_lock:{vin}</c>, TTL mặc định 15 phút.
    /// </summary>
    /// <param name="vin">Số khung xe 17 ký tự.</param>
    /// <param name="ttl">
    /// Thời gian tồn tại của khóa.
    /// Mặc định là <see cref="TimeSpan.Zero"/> — khi đó service dùng 15 phút.
    /// </param>
    /// <returns>
    /// <c>true</c> nếu khóa được đặt thành công (xe chưa bị reserve).
    /// <c>false</c> nếu xe đã có người giữ chỗ.
    /// </returns>
    Task<bool> AcquireVehicleLockAsync(string vin, TimeSpan ttl = default);

    /// <summary>
    /// Giải phóng khóa của một xe khi:
    /// - Giao dịch thất bại / bị huỷ.
    /// - Thanh toán hoàn tất thành công (chuyển sang trạng thái Paid).
    /// </summary>
    /// <param name="vin">Số khung xe 17 ký tự.</param>
    /// <returns>
    /// <c>true</c> nếu key tồn tại và đã được xóa.
    /// <c>false</c> nếu key không tồn tại (đã hết TTL hoặc chưa được lock).
    /// </returns>
    Task<bool> ReleaseVehicleLockAsync(string vin);

    /// <summary>
    /// Kiểm tra trạng thái khóa của một xe — hữu ích cho UI hoặc Admin dashboard.
    /// </summary>
    /// <param name="vin">Số khung xe 17 ký tự.</param>
    /// <returns><c>true</c> nếu xe đang bị khóa (đang trong quy trình thanh toán).</returns>
    Task<bool> IsVehicleLockedAsync(string vin);
}
