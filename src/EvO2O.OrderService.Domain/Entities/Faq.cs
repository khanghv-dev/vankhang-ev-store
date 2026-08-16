using System;

namespace EvO2O.OrderService.Domain.Entities;

/// <summary>
/// Thực thể Câu hỏi thường gặp (FAQ) trong hệ thống CMS VinFast O2O.
/// </summary>
public class Faq
{
    public Guid Id { get; set; }
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
    public string Category { get; set; } = "Bảo hành"; // "Bảo hành", "Trả góp", "Pin"
    public int DisplayOrder { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
