using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using VinFastO2O.OrderService.Application.Common.Interfaces;
using VinFastO2O.OrderService.Domain.Entities;
using VinFastO2O.OrderService.Infrastructure.Persistence;

namespace VinFastO2O.OrderService.Infrastructure.Repositories;

/// <summary>
/// EF Core implementation of <see cref="INewsletterRepository"/>.
/// </summary>
public sealed class NewsletterRepository : INewsletterRepository
{
    private readonly OrderDbContext _db;

    public NewsletterRepository(OrderDbContext db)
    {
        _db = db;
    }

    public Task<bool> ExistsByEmailAsync(string email, CancellationToken ct = default)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        return _db.NewsletterSubscribers.AnyAsync(n => n.Email == normalizedEmail, ct);
    }

    public async Task AddAsync(NewsletterSubscriber subscriber, CancellationToken ct = default)
    {
        await _db.NewsletterSubscribers.AddAsync(subscriber, ct);
        await _db.SaveChangesAsync(ct);
    }
}
