using System;

namespace EvO2O.OrderService.Domain.Entities;

/// <summary>
/// Thực thể Lưu nhật ký hoạt động kiểm toán bảo mật (Audit Log) hệ thống Admin.
/// </summary>
public class AuditLog
{
    public Guid Id { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string AdminUsername { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
    public string? UserAgent { get; set; }

    public AuditLog() { }

    public AuditLog(string adminUsername, string action, string description, string ipAddress, string? userAgent = null)
    {
        Id = Guid.NewGuid();
        Timestamp = DateTime.UtcNow;
        AdminUsername = adminUsername;
        Action = action;
        Description = description;
        IpAddress = ipAddress;
        UserAgent = userAgent;
    }
}
