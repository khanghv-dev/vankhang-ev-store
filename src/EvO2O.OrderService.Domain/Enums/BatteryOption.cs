namespace EvO2O.OrderService.Domain.Enums;

/// <summary>
/// Tùy chọn sở hữu pin xe máy điện VinFast.
/// Ảnh hưởng đến cách tính tổng giá trị đơn hàng.
/// </summary>
public enum BatteryOption
{
    ThuePin = 1,    // Battery-as-a-Service — thuê pin, giá xe thấp hơn
    MuaPin  = 2     // Mua đứt pin — giá xe cao hơn, không phụ thuộc gói thuê
}
