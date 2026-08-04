using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using VinFastO2O.OrderService.API.Authentication;
using VinFastO2O.OrderService.Domain.Entities;
using VinFastO2O.OrderService.Infrastructure.Persistence;

namespace VinFastO2O.OrderService.API.Controllers;

/// <summary>
/// Quản lý các API truy vấn và ghi nhận Nhật ký hoạt động kiểm toán bảo mật (Audit Logs) cho hệ thống Admin.
/// </summary>
[ApiController]
[Route("api/admin/audit-logs")]
[Produces("application/json")]
public sealed class AdminAuditLogController : ControllerBase
{
    private readonly OrderDbContext _db;
    private readonly ILogger<AdminAuditLogController> _logger;

    public AdminAuditLogController(OrderDbContext db, ILogger<AdminAuditLogController> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// Lấy danh sách nhật ký hoạt động hệ thống phân trang (phục vụ tra cứu sự cố và kiểm toán).
    /// </summary>
    /// <param name="search">Từ khóa tìm kiếm theo Tài khoản Admin, Hành động, Chi tiết hoặc IP</param>
    /// <param name="page">Số trang (Mặc định: 1)</param>
    /// <param name="pageSize">Kích thước trang (Mặc định: 20)</param>
    /// <param name="ct">Cancellation token</param>
    [HttpGet]
    [HasPermission("manage_audit_logs")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.AuditLogs.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.Trim().ToLower();
            query = query.Where(a => a.AdminUsername.ToLower().Contains(searchLower) ||
                                     a.Action.ToLower().Contains(searchLower) ||
                                     a.Description.ToLower().Contains(searchLower) ||
                                     a.IpAddress.ToLower().Contains(searchLower));
        }

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(a => a.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AuditLogResponseDto(
                a.Id,
                a.Timestamp,
                a.AdminUsername,
                a.Action,
                a.Description,
                a.IpAddress,
                a.UserAgent
            ))
            .ToListAsync(ct);

        return Ok(new
        {
            items,
            totalCount,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
        });
    }

    /// <summary>
    /// Ghi nhận một hành động kiểm toán mới vào hệ thống.
    /// </summary>
    [HttpPost]
    [HasPermission("manage_audit_logs")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateAuditLog([FromBody] CreateAuditLogDto dto, CancellationToken ct = default)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? dto.IpAddress ?? "127.0.0.1";
        var userAgent = HttpContext.Request.Headers["User-Agent"].ToString();

        var log = new AuditLog(
            dto.AdminUsername.Trim(),
            dto.Action.Trim(),
            dto.Description.Trim(),
            ipAddress,
            userAgent
        );

        _db.AuditLogs.Add(log);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("[AuditLog] Recorded action '{Action}' by '{Admin}' from IP '{IP}'", log.Action, log.AdminUsername, log.IpAddress);

        return CreatedAtAction(nameof(GetAuditLogs), new { id = log.Id }, new AuditLogResponseDto(
            log.Id,
            log.Timestamp,
            log.AdminUsername,
            log.Action,
            log.Description,
            log.IpAddress,
            log.UserAgent
        ));
    }
}

public record CreateAuditLogDto(
    string AdminUsername,
    string Action,
    string Description,
    string? IpAddress
);

public record AuditLogResponseDto(
    Guid Id,
    DateTime Timestamp,
    string AdminUsername,
    string Action,
    string Description,
    string IpAddress,
    string? UserAgent
);
