using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using StackExchange.Redis;
using VinFastO2O.OrderService.API.Authentication;
using VinFastO2O.OrderService.Domain.Entities;
using VinFastO2O.OrderService.Infrastructure.Persistence;

namespace VinFastO2O.OrderService.API.Controllers;

/// <summary>
/// Quản lý các API RESTful CRUD hệ thống Showroom & Đại lý VinFast 3S trên toàn quốc.
/// </summary>
[ApiController]
[Route("api/admin/showrooms")]
[Route("api/showrooms")]
[Produces("application/json")]
public sealed class AdminShowroomController : ControllerBase
{
    private readonly OrderDbContext _db;
    private readonly IDistributedCache _cache;
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<AdminShowroomController> _logger;
    private const string CacheKeyPrefix = "showrooms:list:";

    public AdminShowroomController(
        OrderDbContext db,
        IDistributedCache cache,
        IConnectionMultiplexer redis,
        ILogger<AdminShowroomController> logger)
    {
        _db = db;
        _cache = cache;
        _redis = redis;
        _logger = logger;
    }

    /// <summary>
    /// Lấy danh sách toàn bộ Showroom toàn quốc (Hỗ trợ phân trang và tìm kiếm).
    /// </summary>
    /// <param name="search">Từ khóa tìm kiếm theo Tên, Mã Code hoặc Địa chỉ</param>
    /// <param name="isActive">Lọc theo trạng thái hoạt động (true/false)</param>
    /// <param name="page">Số trang (Mặc định: 1)</param>
    /// <param name="pageSize">Kích thước trang (Mặc định: 20)</param>
    /// <param name="ct">Cancellation token</param>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetShowrooms(
        [FromQuery] string? search,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        // Cache-Aside: chỉ cache khi không có filter search (danh sách chuẩn)
        string? cacheKey = null;
        if (string.IsNullOrWhiteSpace(search))
        {
            cacheKey = $"{CacheKeyPrefix}p{page}_s{pageSize}_a{isActive}";
            try
            {
                var cached = await _cache.GetStringAsync(cacheKey, ct);
                if (!string.IsNullOrEmpty(cached))
                {
                    _logger.LogInformation("[Cache HIT] Showroom list from Redis: {Key}", cacheKey);
                    return Content(cached, "application/json");
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[Cache] Redis read failed, falling through to DB.");
            }
        }

        _logger.LogInformation("[Cache MISS] Querying showrooms from PostgreSQL...");

        var query = _db.Showrooms.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.Trim().ToLower();
            query = query.Where(s => s.Name.ToLower().Contains(searchLower) ||
                                     s.Code.ToLower().Contains(searchLower) ||
                                     s.Address.ToLower().Contains(searchLower));
        }

        if (isActive.HasValue)
        {
            query = query.Where(s => s.IsActive == isActive.Value);
        }

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .OrderBy(s => s.Code)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new ShowroomResponseDto(
                s.Id,
                s.Code,
                s.Name,
                s.Address,
                s.Latitude,
                s.Longitude,
                s.Hotline,
                s.OpenTime,
                s.CloseTime,
                s.IsActive,
                s.CreatedAt,
                s.UpdatedAt
            ))
            .ToListAsync(ct);

        var result = new
        {
            items,
            totalCount,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
        };

        // Save to Redis cache (TTL = 15 minutes)
        if (cacheKey is not null)
        {
            try
            {
                var serialized = JsonSerializer.Serialize(result);
                await _cache.SetStringAsync(cacheKey, serialized, new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(15)
                }, ct);
                _logger.LogInformation("[Cache SET] Showroom list cached: {Key}, TTL=15m", cacheKey);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[Cache] Redis write failed, data served from DB only.");
            }
        }

        return Ok(result);
    }

    /// <summary>
    /// Xem chi tiết thông tin cấu hình một Showroom theo ID GUID hoặc Mã Code.
    /// </summary>
    /// <param name="idOrCode">Mã ID GUID hoặc Mã Code Showroom (VD: SR_HN_01)</param>
    /// <param name="ct">Cancellation token</param>
    [HttpGet("{idOrCode}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetShowroomByIdOrCode([FromRoute] string idOrCode, CancellationToken ct = default)
    {
        Showroom? showroom = null;

        if (Guid.TryParse(idOrCode, out var showroomId))
        {
            showroom = await _db.Showrooms.FirstOrDefaultAsync(s => s.Id == showroomId, ct);
        }

        showroom ??= await _db.Showrooms.FirstOrDefaultAsync(s => s.Code.ToLower() == idOrCode.Trim().ToLower(), ct);

        if (showroom is null)
        {
            return NotFound(new { message = $"Không tìm thấy Showroom với tham số '{idOrCode}'." });
        }

        return Ok(new ShowroomResponseDto(
            showroom.Id,
            showroom.Code,
            showroom.Name,
            showroom.Address,
            showroom.Latitude,
            showroom.Longitude,
            showroom.Hotline,
            showroom.OpenTime,
            showroom.CloseTime,
            showroom.IsActive,
            showroom.CreatedAt,
            showroom.UpdatedAt
        ));
    }

    /// <summary>
    /// Thêm mới một Showroom VinFast trên hệ thống.
    /// </summary>
    /// <param name="dto">Thông tin cấu hình Showroom mới</param>
    /// <param name="ct">Cancellation token</param>
    [HttpPost]
    [HasPermission("manage_showrooms")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateShowroom([FromBody] CreateShowroomDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Code))
            return BadRequest(new { message = "Mã Showroom không được để trống." });
        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest(new { message = "Tên Showroom không được để trống." });
        if (string.IsNullOrWhiteSpace(dto.Address))
            return BadRequest(new { message = "Địa chỉ chi tiết không được để trống." });

        var codeUpper = dto.Code.Trim().ToUpper();

        var codeExists = await _db.Showrooms.AnyAsync(s => s.Code == codeUpper, ct);
        if (codeExists)
        {
            return BadRequest(new { message = $"Mã Showroom '{codeUpper}' đã tồn tại trên hệ thống." });
        }

        var openTime = !string.IsNullOrWhiteSpace(dto.OpenTime) ? dto.OpenTime.Trim() : "08:00";
        var closeTime = !string.IsNullOrWhiteSpace(dto.CloseTime) ? dto.CloseTime.Trim() : "20:00";

        var showroom = new Showroom(
            codeUpper,
            dto.Name.Trim(),
            dto.Address.Trim(),
            dto.Latitude,
            dto.Longitude,
            dto.Hotline?.Trim() ?? "1900 23 23 89",
            openTime,
            closeTime
        );

        _db.Showrooms.Add(showroom);
        await _db.SaveChangesAsync(ct);
        await InvalidateShowroomCacheAsync();

        _logger.LogInformation("[CMS Showroom] Created new showroom Code '{Code}', Name '{Name}'", showroom.Code, showroom.Name);

        return CreatedAtAction(nameof(GetShowroomByIdOrCode), new { idOrCode = showroom.Id }, new ShowroomResponseDto(
            showroom.Id,
            showroom.Code,
            showroom.Name,
            showroom.Address,
            showroom.Latitude,
            showroom.Longitude,
            showroom.Hotline,
            showroom.OpenTime,
            showroom.CloseTime,
            showroom.IsActive,
            showroom.CreatedAt,
            showroom.UpdatedAt
        ));
    }

    /// <summary>
    /// Cập nhật thông tin địa chỉ, tọa độ GPS, hotline và giờ hoạt động Showroom.
    /// </summary>
    /// <param name="id">Mã GUID Showroom cần cập nhật</param>
    /// <param name="dto">Dữ liệu cấu hình mới</param>
    /// <param name="ct">Cancellation token</param>
    [HttpPut("{id:guid}")]
    [HasPermission("manage_showrooms")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateShowroom([FromRoute] Guid id, [FromBody] UpdateShowroomDto dto, CancellationToken ct = default)
    {
        var showroom = await _db.Showrooms.FirstOrDefaultAsync(s => s.Id == id, ct);
        if (showroom is null)
        {
            return NotFound(new { message = $"Không tìm thấy Showroom với ID {id}." });
        }

        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest(new { message = "Tên Showroom không được để trống." });
        if (string.IsNullOrWhiteSpace(dto.Address))
            return BadRequest(new { message = "Địa chỉ chi tiết không được để trống." });

        showroom.UpdateDetails(
            dto.Name.Trim(),
            dto.Address.Trim(),
            dto.Latitude,
            dto.Longitude,
            dto.Hotline?.Trim() ?? "1900 23 23 89",
            !string.IsNullOrWhiteSpace(dto.OpenTime) ? dto.OpenTime.Trim() : "08:00",
            !string.IsNullOrWhiteSpace(dto.CloseTime) ? dto.CloseTime.Trim() : "20:00",
            dto.IsActive
        );

        _db.Showrooms.Update(showroom);
        await _db.SaveChangesAsync(ct);
        await InvalidateShowroomCacheAsync();

        _logger.LogInformation("[CMS Showroom] Updated showroom ID '{ShowroomId}'", id);

        return Ok(new ShowroomResponseDto(
            showroom.Id,
            showroom.Code,
            showroom.Name,
            showroom.Address,
            showroom.Latitude,
            showroom.Longitude,
            showroom.Hotline,
            showroom.OpenTime,
            showroom.CloseTime,
            showroom.IsActive,
            showroom.CreatedAt,
            showroom.UpdatedAt
        ));
    }

    /// <summary>
    /// Xóa Showroom khỏi hệ thống.
    /// </summary>
    /// <param name="id">Mã GUID Showroom cần xóa</param>
    /// <param name="ct">Cancellation token</param>
    [HttpDelete("{id:guid}")]
    [HasPermission("manage_showrooms")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteShowroom([FromRoute] Guid id, CancellationToken ct = default)
    {
        var showroom = await _db.Showrooms.FirstOrDefaultAsync(s => s.Id == id, ct);
        if (showroom is null)
        {
            return NotFound(new { message = $"Không tìm thấy Showroom với ID {id}." });
        }

        _db.Showrooms.Remove(showroom);
        await _db.SaveChangesAsync(ct);
        await InvalidateShowroomCacheAsync();

        _logger.LogInformation("[CMS Showroom] Deleted showroom ID '{ShowroomId}'", id);

        return Ok(new { message = $"Đã xóa thành công Showroom '{showroom.Name}'." });
    }

    /// <summary>
    /// Xóa toàn bộ cache key showroom list khi có mutation (Create/Update/Delete).
    /// Sử dụng Redis SCAN để tìm và xóa các key theo prefix.
    /// </summary>
    private async Task InvalidateShowroomCacheAsync()
    {
        try
        {
            var server = _redis.GetServers().FirstOrDefault();
            if (server is null) return;

            var db = _redis.GetDatabase();
            var pattern = $"VinFastO2O_{CacheKeyPrefix}*";
            var keys = server.Keys(pattern: pattern).ToArray();

            if (keys.Length > 0)
            {
                await db.KeyDeleteAsync(keys);
                _logger.LogInformation("[Cache INVALIDATE] Cleared {Count} showroom cache keys.", keys.Length);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[Cache] Failed to invalidate showroom cache, will expire by TTL.");
        }
    }
}

public record CreateShowroomDto(
    string Code,
    string Name,
    string Address,
    double Latitude,
    double Longitude,
    string? Hotline,
    string? OpenTime,
    string? CloseTime
);

public record UpdateShowroomDto(
    string Name,
    string Address,
    double Latitude,
    double Longitude,
    string? Hotline,
    string? OpenTime,
    string? CloseTime,
    bool IsActive
);

public record ShowroomResponseDto(
    Guid Id,
    string Code,
    string Name,
    string Address,
    double Latitude,
    double Longitude,
    string Hotline,
    string OpenTime,
    string CloseTime,
    bool IsActive,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);
