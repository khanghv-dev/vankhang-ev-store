using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using VinFastO2O.OrderService.API.Authentication;
using VinFastO2O.OrderService.Domain.Entities;
using VinFastO2O.OrderService.Infrastructure.Persistence;

namespace VinFastO2O.OrderService.API.Controllers;

/// <summary>
/// Quản lý các API CRUD bài viết tin tức và bài viết tư vấn xe điện dành cho Admin CMS.
/// </summary>
[ApiController]
[Route("api/admin/articles")]
[Produces("application/json")]
public sealed class AdminArticleController : ControllerBase
{
    private readonly OrderDbContext _db;
    private readonly ILogger<AdminArticleController> _logger;

    public AdminArticleController(OrderDbContext db, ILogger<AdminArticleController> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// Lấy danh sách bài viết phân trang dành cho bảng quản trị Admin CMS.
    /// </summary>
    /// <param name="search">Từ khóa tìm kiếm theo tiêu đề hoặc slug</param>
    /// <param name="status">Trạng thái lọc (Draft, Published)</param>
    /// <param name="page">Số trang (Mặc định: 1)</param>
    /// <param name="pageSize">Kích thước trang (Mặc định: 10)</param>
    /// <param name="ct">Cancellation token</param>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetArticles(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.Articles.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.Trim().ToLower();
            query = query.Where(a => a.Title.ToLower().Contains(searchLower) || a.Slug.ToLower().Contains(searchLower));
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(a => a.Status.ToLower() == status.Trim().ToLower());
        }

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new ArticleResponseDto(
                a.Id,
                a.Title,
                a.Slug,
                a.Content,
                a.ImageThumbnail,
                a.Status,
                a.ViewCount,
                a.AuthorId,
                a.CreatedAt,
                a.UpdatedAt
            ))
            .ToListAsync(ct);

        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

        return Ok(new
        {
            items,
            totalCount,
            page,
            pageSize,
            totalPages
        });
    }

    /// <summary>
    /// Xem chi tiết thông tin một bài viết theo ID GUID hoặc Slug.
    /// </summary>
    /// <param name="idOrSlug">Mã ID GUID hoặc chuỗi Slug bài viết</param>
    /// <param name="ct">Cancellation token</param>
    [HttpGet("{idOrSlug}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetArticleByIdOrSlug([FromRoute] string idOrSlug, CancellationToken ct = default)
    {
        Article? article = null;

        if (Guid.TryParse(idOrSlug, out var articleId))
        {
            article = await _db.Articles.FirstOrDefaultAsync(a => a.Id == articleId, ct);
        }

        article ??= await _db.Articles.FirstOrDefaultAsync(a => a.Slug.ToLower() == idOrSlug.Trim().ToLower(), ct);

        if (article is null)
        {
            return NotFound(new { message = $"Không tìm thấy bài viết với tham số '{idOrSlug}'." });
        }

        return Ok(new ArticleResponseDto(
            article.Id,
            article.Title,
            article.Slug,
            article.Content,
            article.ImageThumbnail,
            article.Status,
            article.ViewCount,
            article.AuthorId,
            article.CreatedAt,
            article.UpdatedAt
        ));
    }

    /// <summary>
    /// Tạo mới một bài viết tin tức CMS.
    /// </summary>
    /// <param name="dto">Thông tin bài viết cần tạo</param>
    /// <param name="ct">Cancellation token</param>
    [HttpPost]
    [HasPermission("manage_articles")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateArticle([FromBody] CreateArticleDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Title))
        {
            return BadRequest(new { message = "Tiêu đề bài viết không được để trống." });
        }

        if (string.IsNullOrWhiteSpace(dto.Content))
        {
            return BadRequest(new { message = "Nội dung bài viết không được để trống." });
        }

        var slug = !string.IsNullOrWhiteSpace(dto.Slug) ? GenerateSlug(dto.Slug) : GenerateSlug(dto.Title);

        // Kiểm tra xem Slug đã tồn tại hay chưa
        var slugExists = await _db.Articles.AnyAsync(a => a.Slug == slug, ct);
        if (slugExists)
        {
            slug = $"{slug}-{DateTime.UtcNow.Ticks % 10000}";
        }

        var authorId = dto.AuthorId ?? Guid.Parse("11111111-1111-1111-1111-111111111111");
        var status = dto.Status is "Published" ? "Published" : "Draft";

        var article = new Article(dto.Title.Trim(), slug, dto.Content, dto.ImageThumbnail, status, authorId);

        _db.Articles.Add(article);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("[CMS Article] Created new article ID '{ArticleId}', Title '{Title}'", article.Id, article.Title);

        return CreatedAtAction(nameof(GetArticleByIdOrSlug), new { idOrSlug = article.Id }, new ArticleResponseDto(
            article.Id,
            article.Title,
            article.Slug,
            article.Content,
            article.ImageThumbnail,
            article.Status,
            article.ViewCount,
            article.AuthorId,
            article.CreatedAt,
            article.UpdatedAt
        ));
    }

    /// <summary>
    /// Cập nhật nội dung và trạng thái bài viết tin tức.
    /// </summary>
    /// <param name="id">Mã Guid bài viết</param>
    /// <param name="dto">Thông tin bài viết mới</param>
    /// <param name="ct">Cancellation token</param>
    [HttpPut("{id:guid}")]
    [HasPermission("manage_articles")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateArticle([FromRoute] Guid id, [FromBody] UpdateArticleDto dto, CancellationToken ct = default)
    {
        var article = await _db.Articles.FirstOrDefaultAsync(a => a.Id == id, ct);
        if (article is null)
        {
            return NotFound(new { message = $"Không tìm thấy bài viết với ID {id}." });
        }

        if (string.IsNullOrWhiteSpace(dto.Title))
        {
            return BadRequest(new { message = "Tiêu đề bài viết không được để trống." });
        }

        var slug = !string.IsNullOrWhiteSpace(dto.Slug) ? GenerateSlug(dto.Slug) : GenerateSlug(dto.Title);

        // Kiểm tra xem Slug trùng lặp với bài viết khác
        var slugExists = await _db.Articles.AnyAsync(a => a.Slug == slug && a.Id != id, ct);
        if (slugExists)
        {
            slug = $"{slug}-{DateTime.UtcNow.Ticks % 10000}";
        }

        var status = dto.Status is "Published" ? "Published" : "Draft";

        article.Update(dto.Title.Trim(), slug, dto.Content, dto.ImageThumbnail, status);
        _db.Articles.Update(article);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("[CMS Article] Updated article ID '{ArticleId}'", id);

        return Ok(new ArticleResponseDto(
            article.Id,
            article.Title,
            article.Slug,
            article.Content,
            article.ImageThumbnail,
            article.Status,
            article.ViewCount,
            article.AuthorId,
            article.CreatedAt,
            article.UpdatedAt
        ));
    }

    /// <summary>
    /// Xóa hoàn toàn bài viết khỏi hệ thống CMS.
    /// </summary>
    /// <param name="id">Mã Guid bài viết cần xóa</param>
    /// <param name="ct">Cancellation token</param>
    [HttpDelete("{id:guid}")]
    [HasPermission("manage_articles")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteArticle([FromRoute] Guid id, CancellationToken ct = default)
    {
        var article = await _db.Articles.FirstOrDefaultAsync(a => a.Id == id, ct);
        if (article is null)
        {
            return NotFound(new { message = $"Không tìm thấy bài viết với ID {id}." });
        }

        _db.Articles.Remove(article);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("[CMS Article] Deleted article ID '{ArticleId}'", id);

        return Ok(new { message = $"Đã xóa thành công bài viết '{article.Title}'." });
    }

    private static string GenerateSlug(string phrase)
    {
        string str = phrase.ToLower().Trim();

        // Thay thế ký tự tiếng Việt có dấu
        string[] vietnameseSigns = new string[]
        {
            "aàáạảãâầấậẩẫăằắặẳẵ",
            "eèéẹẻẽêềếệểễ",
            "iìíịỉĩ",
            "oòóọỏõôồốộổỗơờớợởỡ",
            "uùúụủũưừứựửữ",
            "yỳýỵỷỹ",
            "dđ"
        };
        for (int i = 1; i < vietnameseSigns.Length; i++)
        {
            for (int j = 0; j < vietnameseSigns[i].Length - 1; j++)
                str = str.Replace(vietnameseSigns[i][j], vietnameseSigns[i][vietnameseSigns[i].Length - 1]);
        }

        str = Regex.Replace(str, @"[^a-z0-9\s-]", "");
        str = Regex.Replace(str, @"\s+", " ").Trim();
        str = Regex.Replace(str, @"\s", "-");
        return str;
    }
}

public record CreateArticleDto(
    string Title,
    string? Slug,
    string Content,
    string? ImageThumbnail,
    string Status,
    Guid? AuthorId
);

public record UpdateArticleDto(
    string Title,
    string? Slug,
    string Content,
    string? ImageThumbnail,
    string Status
);

public record ArticleResponseDto(
    Guid Id,
    string Title,
    string Slug,
    string Content,
    string? ImageThumbnail,
    string Status,
    int ViewCount,
    Guid AuthorId,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);
