using System;

namespace VinFastO2O.OrderService.Domain.Entities;

/// <summary>
/// Thực thể Showroom / Đại lý 3S VinFast trên toàn quốc trong hệ thống O2O.
/// </summary>
public class Showroom
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string Hotline { get; set; } = string.Empty;
    public string OpenTime { get; set; } = "08:00";
    public string CloseTime { get; set; } = "20:00";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Showroom() { }

    public Showroom(string code, string name, string address, double latitude, double longitude, string hotline, string openTime, string closeTime)
    {
        Id = Guid.NewGuid();
        Code = code;
        Name = name;
        Address = address;
        Latitude = latitude;
        Longitude = longitude;
        Hotline = hotline;
        OpenTime = openTime;
        CloseTime = closeTime;
        IsActive = true;
        CreatedAt = DateTime.UtcNow;
    }

    public void UpdateDetails(string name, string address, double latitude, double longitude, string hotline, string openTime, string closeTime, bool isActive)
    {
        Name = name;
        Address = address;
        Latitude = latitude;
        Longitude = longitude;
        Hotline = hotline;
        OpenTime = openTime;
        CloseTime = closeTime;
        IsActive = isActive;
        UpdatedAt = DateTime.UtcNow;
    }
}
