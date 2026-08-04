using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using VinFastO2O.OrderService.API.Authentication;
using VinFastO2O.OrderService.Domain.Enums;
using VinFastO2O.OrderService.Infrastructure.Persistence;

namespace VinFastO2O.OrderService.API.Controllers;

/// <summary>
/// Administrative endpoints for dashboard analytics and reports.
/// </summary>
[ApiController]
[Route("api/admin/dashboard")]
[Produces("application/json")]
public sealed class AdminDashboardController : ControllerBase
{
    private readonly OrderDbContext _db;
    private readonly ILogger<AdminDashboardController> _logger;

    public AdminDashboardController(OrderDbContext db, ILogger<AdminDashboardController> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// Fetches core admin dashboard statistics including daily revenue, pending deposits, delivered vehicles, and station health.
    /// Protected by granular RBAC permissions.
    /// </summary>
    /// <response code="200">Stats retrieved successfully.</response>
    /// <response code="401">Missing or invalid JWT token.</response>
    /// <response code="403">Authenticated user lacks the required permission (view_revenue).</response>
    [HttpGet("stats")]
    [HasPermission("view_revenue")]
    [ProducesResponseType(typeof(AdminDashboardStatsResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetStats(CancellationToken ct)
    {
        try
        {
            // Align the "Today" calculation with Vietnam Timezone (UTC+7)
            var localToday = DateTime.UtcNow.AddHours(7).Date;
            var startOfTodayUtc = localToday.AddHours(-7);
            var endOfTodayUtc = startOfTodayUtc.AddDays(1);

            // 1. Tổng doanh thu cọc trong ngày (Vietnam timezone)
            var totalDepositRevenueToday = await _db.Orders
                .Where(o => o.PaidAt != null 
                            && o.PaidAt.Value >= startOfTodayUtc 
                            && o.PaidAt.Value < endOfTodayUtc 
                            && (o.Status == OrderStatus.Paid 
                                || o.Status == OrderStatus.Preparing 
                                || o.Status == OrderStatus.Delivered))
                .SumAsync(o => o.DepositAmount, ct);

            // 2. Số lượng đơn cọc mới chờ duyệt (Status: Pending)
            var newPendingDepositsCount = await _db.Orders
                .CountAsync(o => o.Status == OrderStatus.Pending, ct);

            // 3. Số lượng xe đã bàn giao thành công (Status: Delivered)
            var deliveredVehiclesCount = await _db.Orders
                .CountAsync(o => o.Status == OrderStatus.Delivered, ct);

            // 4. Số lượng trạm sạc đang gặp sự cố cảnh báo lỗi (Mocked)
            var faultyChargingStationsCount = 3;

            _logger.LogInformation(
                "[AdminDashboard] Fetched stats: Revenue={Revenue} | Pending={Pending} | Delivered={Delivered} | FaultyStations={FaultyStations}",
                totalDepositRevenueToday, newPendingDepositsCount, deliveredVehiclesCount, faultyChargingStationsCount);

            return Ok(new AdminDashboardStatsResponseDto(
                totalDepositRevenueToday,
                newPendingDepositsCount,
                deliveredVehiclesCount,
                faultyChargingStationsCount
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[AdminDashboard] Error occurred while fetching dashboard statistics.");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Lỗi hệ thống khi tải thống kê." });
        }
    }

    /// <summary>
    /// Fetches advanced deposit statistics for line and pie charts.
    /// Protected by granular RBAC permissions.
    /// </summary>
    /// <response code="200">Stats retrieved successfully.</response>
    /// <response code="401">Missing or invalid JWT token.</response>
    /// <response code="403">Authenticated user lacks the required permission (view_revenue).</response>
    [HttpGet("charts")]
    [HasPermission("view_revenue")]
    [ProducesResponseType(typeof(AdminDashboardChartsResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetCharts(CancellationToken ct)
    {
        try
        {
            // 1. Calculate monthly revenue for year 2026
            var currentYear = 2026;
            var startOfYear = new DateTime(currentYear, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            var endOfYear = startOfYear.AddYears(1);

            var monthlyRevenue = await _db.Orders
                .Where(o => o.PaidAt != null 
                            && o.PaidAt.Value >= startOfYear 
                            && o.PaidAt.Value < endOfYear
                            && (o.Status == OrderStatus.Paid 
                                || o.Status == OrderStatus.Preparing 
                                || o.Status == OrderStatus.VinAssigned 
                                || o.Status == OrderStatus.Delivered))
                .GroupBy(o => o.PaidAt!.Value.Month)
                .Select(g => new
                {
                    Month = g.Key,
                    TotalRevenue = g.Sum(o => o.DepositAmount),
                    TotalOrders = g.Count()
                })
                .ToListAsync(ct);

            var chartPoints = Enumerable.Range(1, 12).Select(m =>
            {
                var dbPoint = monthlyRevenue.FirstOrDefault(mr => mr.Month == m);
                var revenueInMillions = dbPoint != null ? (double)dbPoint.TotalRevenue / 1_000_000.0 : 0.0;
                return new MonthlyRevenuePointDto(
                    Month: $"T{m}",
                    Revenue: Math.Round(revenueInMillions, 2),
                    Orders: dbPoint?.TotalOrders ?? 0
                );
            }).ToList();

            // 2. Deposit type breakdown (flexible vs committed)
            var totalPaidOrders = await _db.Orders
                .CountAsync(o => o.Status == OrderStatus.Paid 
                                 || o.Status == OrderStatus.Preparing 
                                 || o.Status == OrderStatus.VinAssigned 
                                 || o.Status == OrderStatus.Delivered, ct);

            var flexibleCount = await _db.Orders
                .CountAsync(o => (o.Status == OrderStatus.Paid 
                                  || o.Status == OrderStatus.Preparing 
                                  || o.Status == OrderStatus.VinAssigned 
                                  || o.Status == OrderStatus.Delivered) 
                                 && o.DepositType == DepositType.LinhHoat, ct);

            var committedCount = await _db.Orders
                .CountAsync(o => (o.Status == OrderStatus.Paid 
                                  || o.Status == OrderStatus.Preparing 
                                  || o.Status == OrderStatus.VinAssigned 
                                  || o.Status == OrderStatus.Delivered) 
                                 && o.DepositType == DepositType.CamKet, ct);

            var flexiblePercentage = totalPaidOrders > 0 ? Math.Round((double)flexibleCount / totalPaidOrders * 100, 1) : 0.0;
            var committedPercentage = totalPaidOrders > 0 ? Math.Round((double)committedCount / totalPaidOrders * 100, 1) : 0.0;

            // 3. Cancellation rate
            var totalOrdersCount = await _db.Orders.CountAsync(ct);
            var cancelledOrdersCount = await _db.Orders.CountAsync(o => o.Status == OrderStatus.Cancelled, ct);
            var cancellationRate = totalOrdersCount > 0 ? Math.Round((double)cancelledOrdersCount / totalOrdersCount * 100, 1) : 0.0;

            _logger.LogInformation(
                "[AdminDashboard] Fetched charts: Flexible={Flex}% | Committed={Commit}% | Cancellation={Cancel}%",
                flexiblePercentage, committedPercentage, cancellationRate);

            return Ok(new AdminDashboardChartsResponseDto(
                chartPoints,
                new DepositTypeBreakdownDto(flexibleCount, flexiblePercentage, committedCount, committedPercentage),
                cancellationRate
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[AdminDashboard] Error occurred while fetching dashboard chart analytics.");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Lỗi hệ thống khi tải dữ liệu phân tích biểu đồ." });
        }
    }
}

public record AdminDashboardStatsResponseDto(
    decimal TotalDepositRevenueToday,
    int NewPendingDepositsCount,
    int DeliveredVehiclesCount,
    int FaultyChargingStationsCount
);

public record AdminDashboardChartsResponseDto(
    System.Collections.Generic.List<MonthlyRevenuePointDto> MonthlyData,
    DepositTypeBreakdownDto DepositBreakdown,
    double CancellationRate
);

public record MonthlyRevenuePointDto(
    string Month,
    double Revenue,
    int Orders
);

public record DepositTypeBreakdownDto(
    int FlexibleCount,
    double FlexiblePercentage,
    int CommittedCount,
    double CommittedPercentage
);
