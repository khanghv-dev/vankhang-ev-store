namespace VinFastO2O.OrderService.Application.Common.Interfaces;

/// <summary>
/// Distributed vehicle lock service based on Redis.
/// </summary>
public interface IVehicleLockService
{
    /// <summary>
    /// Attempt to acquire a lock for a specific vehicle VIN.
    /// Key: vins_lock:{vin}, default TTL is 15 minutes.
    /// </summary>
    Task<bool> AcquireVehicleLockAsync(string vin, TimeSpan ttl = default);

    /// <summary>
    /// Release the lock for a specific vehicle VIN.
    /// </summary>
    Task<bool> ReleaseVehicleLockAsync(string vin);
}
