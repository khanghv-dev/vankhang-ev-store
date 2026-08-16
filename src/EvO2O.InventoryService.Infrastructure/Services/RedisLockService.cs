using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using EvO2O.InventoryService.Application.Common.Interfaces;

namespace EvO2O.InventoryService.Infrastructure.Services;

/// <summary>
/// Triển khai distributed lock dựa trên Redis cho xe máy điện VinFast.
///
/// Cơ chế hoạt động:
/// ┌──────────────────────────────────────────────────────────────────┐
/// │  AcquireVehicleLockAsync(vin, ttl = 15 min)                     │
/// │  ─── SET vins_lock:{vin} "LOCKED" NX EX 900 ──────────────────► │
/// │       NX = chỉ set nếu key CHƯA tồn tại (atomic, no race)       │
/// │       Trả về true  → xe chưa bị người khác giữ chỗ             │
/// │       Trả về false → xe đang trong quy trình thanh toán khác   │
/// │                                                                  │
/// │  ReleaseVehicleLockAsync(vin)                                    │
/// │  ─── DEL vins_lock:{vin} ─────────────────────────────────────► │
/// │       Giải phóng ngay lập tức, không cần chờ TTL hết hạn        │
/// └──────────────────────────────────────────────────────────────────┘
///
/// Tại sao dùng SET NX EX thay vì GET + SET?
/// Redis SET NX là atomic — tránh race condition khi 2 user
/// cùng lúc chọn 1 chiếc xe (không cần distributed mutex bên ngoài).
/// </summary>
public sealed class RedisLockService : IVehicleLockService
{
    // ── Constants ────────────────────────────────────────────────────────────

    /// <summary>Prefix của tất cả key lock trong Redis.</summary>
    private const string KeyPrefix = "vins_lock:";

    /// <summary>TTL mặc định: 15 phút — đủ để hoàn thành quy trình thanh toán VNPay/MoMo.</summary>
    private static readonly TimeSpan DefaultTtl = TimeSpan.FromMinutes(15);

    /// <summary>Giá trị lưu vào Redis key để dễ nhận biết khi debug.</summary>
    private const string LockValue = "LOCKED";

    // ── Dependencies ─────────────────────────────────────────────────────────

    private readonly IDatabase _db;
    private readonly ILogger<RedisLockService> _logger;

    /// <param name="multiplexer">
    /// <see cref="IConnectionMultiplexer"/> — Singleton, quản lý connection pool tới Redis.
    /// Được inject bởi DI sau khi gọi <c>AddSingleton&lt;IConnectionMultiplexer&gt;</c>.
    /// </param>
    /// <param name="logger">Logger cho audit trail và troubleshooting.</param>
    public RedisLockService(IConnectionMultiplexer multiplexer, ILogger<RedisLockService> logger)
    {
        // Database(0) = default Redis DB; có thể cấu hình qua options nếu cần multi-tenant
        _db     = multiplexer.GetDatabase();
        _logger = logger;
    }

    // ── Public API ───────────────────────────────────────────────────────────

    /// <inheritdoc/>
    public async Task<bool> AcquireVehicleLockAsync(string vin, TimeSpan ttl = default)
    {
        ValidateVin(vin);

        var resolvedTtl = ttl == TimeSpan.Zero ? DefaultTtl : ttl;
        var key         = BuildKey(vin);

        try
        {
            // SET key value NX EX seconds — atomic operation, không có race condition
            var acquired = await _db.StringSetAsync(
                key:   key,
                value: LockValue,
                expiry: resolvedTtl,
                when:  When.NotExists   // NX = chỉ set khi key CHƯA tồn tại
            );

            if (acquired)
            {
                _logger.LogInformation(
                    "[VehicleLock] ACQUIRED — VIN: {Vin} | TTL: {Ttl} | Key: {Key}",
                    vin, resolvedTtl, key);
            }
            else
            {
                _logger.LogWarning(
                    "[VehicleLock] CONFLICT — VIN: {Vin} đang bị giữ chỗ bởi giao dịch khác. Key: {Key}",
                    vin, key);
            }

            return acquired;
        }
        catch (RedisConnectionException ex)
        {
            // Fail-open: nếu Redis down, vẫn cho phép đặt cọc để không block toàn bộ hệ thống.
            // Production nên có circuit breaker (Polly) thay vì fail-open.
            _logger.LogError(ex,
                "[VehicleLock] Redis connection error khi AcquireVehicleLockAsync — VIN: {Vin}. Fail-open: trả về true.",
                vin);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "[VehicleLock] Lỗi không mong đợi khi AcquireVehicleLockAsync — VIN: {Vin}",
                vin);
            throw;
        }
    }

    /// <inheritdoc/>
    public async Task<bool> ReleaseVehicleLockAsync(string vin)
    {
        ValidateVin(vin);

        var key = BuildKey(vin);

        try
        {
            var deleted = await _db.KeyDeleteAsync(key);

            if (deleted)
            {
                _logger.LogInformation(
                    "[VehicleLock] RELEASED — VIN: {Vin} | Key: {Key}",
                    vin, key);
            }
            else
            {
                // Không phải lỗi — key có thể đã hết TTL tự nhiên
                _logger.LogDebug(
                    "[VehicleLock] RELEASE_NOOP — VIN: {Vin} key không tồn tại (đã hết TTL hoặc chưa được lock). Key: {Key}",
                    vin, key);
            }

            return deleted;
        }
        catch (RedisConnectionException ex)
        {
            _logger.LogError(ex,
                "[VehicleLock] Redis connection error khi ReleaseVehicleLockAsync — VIN: {Vin}",
                vin);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "[VehicleLock] Lỗi không mong đợi khi ReleaseVehicleLockAsync — VIN: {Vin}",
                vin);
            throw;
        }
    }

    /// <inheritdoc/>
    public async Task<bool> IsVehicleLockedAsync(string vin)
    {
        ValidateVin(vin);

        try
        {
            return await _db.KeyExistsAsync(BuildKey(vin));
        }
        catch (RedisConnectionException ex)
        {
            _logger.LogError(ex,
                "[VehicleLock] Redis connection error khi IsVehicleLockedAsync — VIN: {Vin}. Fail-open: trả về false.",
                vin);
            return false;
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /// <summary>Xây dựng Redis key theo convention <c>vins_lock:{vin}</c>.</summary>
    private static string BuildKey(string vin) => $"{KeyPrefix}{vin.ToUpperInvariant()}";

    /// <summary>Guard: VIN phải đúng 17 ký tự để tránh key rác trong Redis.</summary>
    private static void ValidateVin(string vin)
    {
        if (string.IsNullOrWhiteSpace(vin))
            throw new ArgumentException("VIN không được để trống.", nameof(vin));

        if (vin.Length != 17)
            throw new ArgumentException($"VIN phải đúng 17 ký tự. Nhận được: '{vin}' ({vin.Length} ký tự).", nameof(vin));
    }
}
