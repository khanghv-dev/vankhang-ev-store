using System.Threading;
using System.Threading.Tasks;
using VinFastO2O.OrderService.Domain.Entities;

namespace VinFastO2O.OrderService.Application.Common.Interfaces;

/// <summary>
/// Data access contract for the <see cref="AdminUser"/> aggregate.
/// </summary>
public interface IAdminUserRepository
{
    /// <summary>
    /// Finds an admin user by username or email address, eagerly loading their associated roles and permissions.
    /// </summary>
    Task<AdminUser?> FindByUsernameOrEmailWithRolesAndPermissionsAsync(string identifier, CancellationToken ct = default);

    /// <summary>
    /// Finds an admin user by their ID, eagerly loading their associated roles and permissions.
    /// </summary>
    Task<AdminUser?> FindByIdWithRolesAndPermissionsAsync(Guid id, CancellationToken ct = default);

    /// <summary>
    /// Persists a new refresh token to the database.
    /// </summary>
    Task SaveRefreshTokenAsync(AdminRefreshToken token, CancellationToken ct = default);

    /// <summary>
    /// Retrieves a refresh token by its string value.
    /// </summary>
    Task<AdminRefreshToken?> GetRefreshTokenAsync(string token, CancellationToken ct = default);

    /// <summary>
    /// Updates an existing refresh token's state (e.g. revocation status).
    /// </summary>
    Task UpdateRefreshTokenAsync(AdminRefreshToken token, CancellationToken ct = default);
}
