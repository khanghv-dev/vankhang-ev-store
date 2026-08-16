using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using EvO2O.OrderService.Application.Common.Interfaces;

namespace EvO2O.OrderService.Infrastructure.Services;

/// <summary>
/// Distributed vehicle lock service based on Redis for OrderService.
/// </summary>
public sealed class RedisLockService : IVehicleLockService
{
    private const string KeyPrefix = "vins_lock:";
    private static readonly TimeSpan DefaultTtl = TimeSpan.FromMinutes(15);
    private const string LockValue = "LOCKED";

    private readonly IDatabase _db;
    private readonly ILogger<RedisLockService> _logger;

    public RedisLockService(IConnectionMultiplexer multiplexer, ILogger<RedisLockService> logger)
    {
        _db = multiplexer.GetDatabase();
        _logger = logger;
    }

    public async Task<bool> AcquireVehicleLockAsync(string vin, TimeSpan ttl = default)
    {
        ValidateVin(vin);

        var resolvedTtl = ttl == TimeSpan.Zero ? DefaultTtl : ttl;
        var key = BuildKey(vin);

        try
        {
            var acquired = await _db.StringSetAsync(
                key: key,
                value: LockValue,
                expiry: resolvedTtl,
                when: When.NotExists
            );

            if (acquired)
            {
                _logger.LogInformation(
                    "[OrderService-VehicleLock] ACQUIRED — VIN: {Vin} | TTL: {Ttl} | Key: {Key}",
                    vin, resolvedTtl, key);
            }
            else
            {
                _logger.LogWarning(
                    "[OrderService-VehicleLock] CONFLICT — VIN: {Vin} is already locked by another transaction. Key: {Key}",
                    vin, key);
            }

            return acquired;
        }
        catch (RedisConnectionException ex)
        {
            _logger.LogError(ex,
                "[OrderService-VehicleLock] Redis connection error in AcquireVehicleLockAsync — VIN: {Vin}. Fail-open: returning true.",
                vin);
            return true; // Fail-open to avoid blocking checkout when Redis is down
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "[OrderService-VehicleLock] Unexpected error in AcquireVehicleLockAsync — VIN: {Vin}",
                vin);
            throw;
        }
    }

    public async Task<bool> ReleaseVehicleLockAsync(string vin)
    {
        if (string.IsNullOrWhiteSpace(vin))
        {
            _logger.LogDebug("[OrderService-VehicleLock] ReleaseVehicleLockAsync called with null/empty VIN. Skipping.");
            return false;
        }

        ValidateVin(vin);

        var key = BuildKey(vin);

        try
        {
            var deleted = await _db.KeyDeleteAsync(key);

            if (deleted)
            {
                _logger.LogInformation(
                    "[OrderService-VehicleLock] RELEASED — VIN: {Vin} | Key: {Key}",
                    vin, key);
            }
            else
            {
                _logger.LogDebug(
                    "[OrderService-VehicleLock] RELEASE_NOOP — VIN: {Vin} key not found or expired. Key: {Key}",
                    vin, key);
            }

            return deleted;
        }
        catch (RedisConnectionException ex)
        {
            _logger.LogError(ex,
                "[OrderService-VehicleLock] Redis connection error in ReleaseVehicleLockAsync — VIN: {Vin}",
                vin);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "[OrderService-VehicleLock] Unexpected error in ReleaseVehicleLockAsync — VIN: {Vin}",
                vin);
            throw;
        }
    }

    private static string BuildKey(string vin) => $"{KeyPrefix}{vin.ToUpperInvariant()}";

    private static void ValidateVin(string vin)
    {
        if (string.IsNullOrWhiteSpace(vin))
            throw new ArgumentException("VIN cannot be null or empty.", nameof(vin));

        if (vin.Length != 17)
            throw new ArgumentException($"VIN must be exactly 17 characters. Received: '{vin}' ({vin.Length} characters).", nameof(vin));
    }
}
