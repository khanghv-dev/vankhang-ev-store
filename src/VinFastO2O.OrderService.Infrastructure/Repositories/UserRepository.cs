using Microsoft.EntityFrameworkCore;
using VinFastO2O.OrderService.Application.Common.Interfaces;
using VinFastO2O.OrderService.Domain.Entities;
using VinFastO2O.OrderService.Infrastructure.Persistence;

namespace VinFastO2O.OrderService.Infrastructure.Repositories;

/// <summary>
/// EF Core implementation of <see cref="IUserRepository"/>.
/// </summary>
public sealed class UserRepository : IUserRepository
{
    private readonly OrderDbContext _db;

    public UserRepository(OrderDbContext db) => _db = db;

    public Task<bool> ExistsByEmailAsync(string normalisedEmail, CancellationToken ct = default) =>
        _db.Users.AnyAsync(u => u.Email == normalisedEmail, ct);

    public Task<User?> FindByEmailAsync(string normalisedEmail, CancellationToken ct = default) =>
        _db.Users.FirstOrDefaultAsync(u => u.Email == normalisedEmail, ct);

    public async Task AddAsync(User user, CancellationToken ct = default)
    {
        await _db.Users.AddAsync(user, ct);
        await _db.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(User user, CancellationToken ct = default)
    {
        _db.Users.Update(user);
        await _db.SaveChangesAsync(ct);
    }
}
