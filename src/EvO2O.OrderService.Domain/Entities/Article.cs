using System;

namespace EvO2O.OrderService.Domain.Entities;

/// <summary>
/// Thực thể Bài viết Tin tức / Khuyến mãi trong hệ thống CMS VinFast O2O.
/// </summary>
public class Article
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? ImageThumbnail { get; set; }
    public string Status { get; set; } = "Draft"; // "Draft", "Published"
    public int ViewCount { get; set; } = 0;
    public Guid AuthorId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Article() { }

    public Article(string title, string slug, string content, string? imageThumbnail, string status, Guid authorId)
    {
        Id = Guid.NewGuid();
        Title = title;
        Slug = slug;
        Content = content;
        ImageThumbnail = imageThumbnail;
        Status = status;
        AuthorId = authorId;
        CreatedAt = DateTime.UtcNow;
    }

    public void Update(string title, string slug, string content, string? imageThumbnail, string status)
    {
        Title = title;
        Slug = slug;
        Content = content;
        ImageThumbnail = imageThumbnail;
        Status = status;
        UpdatedAt = DateTime.UtcNow;
    }

    public void IncrementViewCount()
    {
        ViewCount++;
    }
}
