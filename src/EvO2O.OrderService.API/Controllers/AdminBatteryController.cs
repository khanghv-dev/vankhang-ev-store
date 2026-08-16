using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using EvO2O.OrderService.API.Authentication;
using EvO2O.OrderService.Domain.Entities;
using EvO2O.OrderService.Infrastructure.Persistence;

namespace EvO2O.OrderService.API.Controllers;

/// <summary>
/// API endpoints for Admin to monitor battery health reports calculated by Spark.
/// </summary>
[ApiController]
[Route("api/admin/battery/reports")]
[Produces("application/json")]
[HasPermission("manage_battery")]
public sealed class AdminBatteryController : ControllerBase
{
    private readonly OrderDbContext _db;
    private readonly ILogger<AdminBatteryController> _logger;

    public AdminBatteryController(OrderDbContext db, ILogger<AdminBatteryController> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// Gets all battery health reports.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetReports(CancellationToken ct)
    {
        try
        {
            var reports = await _db.BatteryHealthReports
                .OrderByDescending(r => r.ProcessedAt)
                .ToListAsync(ct);
            return Ok(reports);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching battery health reports.");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Lỗi hệ thống khi tải báo cáo pin." });
        }
    }

    /// <summary>
    /// Gets only risky battery health reports.
    /// </summary>
    [HttpGet("risky")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRiskyReports(CancellationToken ct)
    {
        try
        {
            var reports = await _db.BatteryHealthReports
                .Where(r => r.IsRisky)
                .OrderByDescending(r => r.ProcessedAt)
                .ToListAsync(ct);
            return Ok(reports);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching risky battery health reports.");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Lỗi hệ thống khi tải báo cáo pin cảnh báo." });
        }
    }
}
