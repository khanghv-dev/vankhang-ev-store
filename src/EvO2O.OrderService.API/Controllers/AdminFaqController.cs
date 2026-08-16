using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using EvO2O.OrderService.API.Authentication;
using EvO2O.OrderService.Domain.Entities;
using EvO2O.OrderService.Infrastructure.Persistence;

namespace EvO2O.OrderService.API.Controllers;

/// <summary>
/// Quản lý các API CRUD câu hỏi thường gặp FAQ và sắp xếp thứ tự ưu tiên dành cho Admin CMS.
/// </summary>
[ApiController]
[Route("api/admin/faqs")]
[Route("api/faqs")]
[Produces("application/json")]
public sealed class AdminFaqController : ControllerBase
{
    private readonly OrderDbContext _db;
    private readonly ILogger<AdminFaqController> _logger;

    public AdminFaqController(OrderDbContext db, ILogger<AdminFaqController> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// Lấy danh sách câu hỏi thường gặp FAQ sắp xếp theo thứ tự ưu tiên (DisplayOrder).
    /// </summary>
    /// <param name="category">Danh mục lọc (Bảo hành, Trả góp, Pin)</param>
    /// <param name="ct">Cancellation token</param>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFaqs([FromQuery] string? category, CancellationToken ct = default)
    {
        var query = _db.Faqs.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(category))
        {
            var categoryLower = category.Trim().ToLower();
            query = query.Where(f => f.Category.ToLower() == categoryLower);
        }

        var items = await query
            .OrderBy(f => f.DisplayOrder)
            .ThenByDescending(f => f.CreatedAt)
            .Select(f => new FaqResponseDto(
                f.Id,
                f.Question,
                f.Answer,
                f.Category,
                f.DisplayOrder,
                f.CreatedAt,
                f.UpdatedAt
            ))
            .ToListAsync(ct);

        return Ok(items);
    }

    /// <summary>
    /// Tạo mới một câu hỏi thường gặp FAQ.
    /// </summary>
    [HttpPost]
    [HasPermission("manage_faqs")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateFaq([FromBody] CreateFaqDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Question) || string.IsNullOrWhiteSpace(dto.Answer))
        {
            return BadRequest(new { message = "Câu hỏi và câu trả lời không được để trống." });
        }

        var category = !string.IsNullOrWhiteSpace(dto.Category) ? dto.Category.Trim() : "Bảo hành";

        var faq = new Faq
        {
            Id = Guid.NewGuid(),
            Question = dto.Question.Trim(),
            Answer = dto.Answer.Trim(),
            Category = category,
            DisplayOrder = dto.DisplayOrder,
            CreatedAt = DateTime.UtcNow
        };

        _db.Faqs.Add(faq);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("[CMS FAQ] Created new FAQ ID '{FaqId}', Question '{Question}'", faq.Id, faq.Question);

        return CreatedAtAction(nameof(GetFaqs), new { category = faq.Category }, new FaqResponseDto(
            faq.Id,
            faq.Question,
            faq.Answer,
            faq.Category,
            faq.DisplayOrder,
            faq.CreatedAt,
            faq.UpdatedAt
        ));
    }

    /// <summary>
    /// Cập nhật nội dung câu chữ và thứ tự ưu tiên của FAQ.
    /// </summary>
    [HttpPut("{id:guid}")]
    [HasPermission("manage_faqs")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateFaq([FromRoute] Guid id, [FromBody] UpdateFaqDto dto, CancellationToken ct = default)
    {
        var faq = await _db.Faqs.FirstOrDefaultAsync(f => f.Id == id, ct);
        if (faq is null)
        {
            return NotFound(new { message = $"Không tìm thấy FAQ với ID {id}." });
        }

        if (string.IsNullOrWhiteSpace(dto.Question) || string.IsNullOrWhiteSpace(dto.Answer))
        {
            return BadRequest(new { message = "Câu hỏi và câu trả lời không được để trống." });
        }

        faq.Question = dto.Question.Trim();
        faq.Answer = dto.Answer.Trim();
        faq.Category = !string.IsNullOrWhiteSpace(dto.Category) ? dto.Category.Trim() : faq.Category;
        faq.DisplayOrder = dto.DisplayOrder;
        faq.UpdatedAt = DateTime.UtcNow;

        _db.Faqs.Update(faq);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("[CMS FAQ] Updated FAQ ID '{FaqId}'", id);

        return Ok(new FaqResponseDto(
            faq.Id,
            faq.Question,
            faq.Answer,
            faq.Category,
            faq.DisplayOrder,
            faq.CreatedAt,
            faq.UpdatedAt
        ));
    }

    /// <summary>
    /// Đổi nhanh vị trí/thứ tự ưu tiên hiển thị (DisplayOrder).
    /// </summary>
    [HttpPatch("{id:guid}/reorder")]
    [HasPermission("manage_faqs")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReorderFaq([FromRoute] Guid id, [FromBody] ReorderFaqDto dto, CancellationToken ct = default)
    {
        var faq = await _db.Faqs.FirstOrDefaultAsync(f => f.Id == id, ct);
        if (faq is null)
        {
            return NotFound(new { message = $"Không tìm thấy FAQ với ID {id}." });
        }

        faq.DisplayOrder = dto.NewDisplayOrder;
        faq.UpdatedAt = DateTime.UtcNow;

        _db.Faqs.Update(faq);
        await _db.SaveChangesAsync(ct);

        return Ok(new { message = $"Đã cập nhật thứ tự hiển thị của FAQ thành {dto.NewDisplayOrder}." });
    }

    /// <summary>
    /// Xóa câu hỏi FAQ khỏi hệ thống.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [HasPermission("manage_faqs")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteFaq([FromRoute] Guid id, CancellationToken ct = default)
    {
        var faq = await _db.Faqs.FirstOrDefaultAsync(f => f.Id == id, ct);
        if (faq is null)
        {
            return NotFound(new { message = $"Không tìm thấy FAQ với ID {id}." });
        }

        _db.Faqs.Remove(faq);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("[CMS FAQ] Deleted FAQ ID '{FaqId}'", id);

        return Ok(new { message = $"Đã xóa thành công câu hỏi FAQ '{faq.Question}'." });
    }
}

public record CreateFaqDto(string Question, string Answer, string Category, int DisplayOrder);
public record UpdateFaqDto(string Question, string Answer, string Category, int DisplayOrder);
public record ReorderFaqDto(int NewDisplayOrder);
public record FaqResponseDto(Guid Id, string Question, string Answer, string Category, int DisplayOrder, DateTime CreatedAt, DateTime? UpdatedAt);
