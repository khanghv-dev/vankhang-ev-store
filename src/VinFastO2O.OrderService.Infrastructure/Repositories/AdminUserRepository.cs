using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using VinFastO2O.OrderService.Application.Common.Interfaces;
using VinFastO2O.OrderService.Domain.Entities;
using VinFastO2O.OrderService.Infrastructure.Persistence;

namespace VinFastO2O.OrderService.Infrastructure.Repositories;

/// <summary>
/// EF Core implementation of <see cref="IAdminUserRepository"/>.
/// </summary>
public sealed class AdminUserRepository : IAdminUserRepository
{
    private readonly OrderDbContext _db;

    public AdminUserRepository(OrderDbContext db)
    {
        _db = db;
    }

    public async Task<AdminUser?> FindByUsernameOrEmailWithRolesAndPermissionsAsync(string identifier, CancellationToken ct = default)
    {
        var normalizedIdentifier = identifier.Trim().ToLowerInvariant();

        return await _db.AdminUsers
            .Include(u => u.Roles)
                .ThenInclude(r => r.Permissions)
            .FirstOrDefaultAsync(u => 
                u.Username == normalizedIdentifier || 
                u.Email == normalizedIdentifier, 
                ct);
    }

    public async Task<AdminUser?> FindByIdWithRolesAndPermissionsAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.AdminUsers
            .Include(u => u.Roles)
                .ThenInclude(r => r.Permissions)
            .FirstOrDefaultAsync(u => u.Id == id, ct);
    }

    public async Task SaveRefreshTokenAsync(AdminRefreshToken token, CancellationToken ct = default)
    {
        await _db.AdminRefreshTokens.AddAsync(token, ct);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<AdminRefreshToken?> GetRefreshTokenAsync(string token, CancellationToken ct = default)
    {
        return await _db.AdminRefreshTokens
            .FirstOrDefaultAsync(t => t.Token == token, ct);
    }

    public async Task UpdateRefreshTokenAsync(AdminRefreshToken token, CancellationToken ct = default)
    {
        _db.AdminRefreshTokens.Update(token);
        await _db.SaveChangesAsync(ct);
    }
}
