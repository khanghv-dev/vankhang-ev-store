using System.Threading;
using System.Threading.Tasks;
using VinFastO2O.OrderService.Domain.Entities;

namespace VinFastO2O.OrderService.Application.Common.Interfaces;

/// <summary>
/// Persistence contract for the <see cref="NewsletterSubscriber"/> aggregate.
/// </summary>
public interface INewsletterRepository
{
    /// <summary>
    /// Checks if a subscriber with the specified email address already exists in the database.
    /// </summary>
    Task<bool> ExistsByEmailAsync(string email, CancellationToken ct = default);

    /// <summary>
    /// Saves a new subscriber to the database.
    /// </summary>
    Task AddAsync(NewsletterSubscriber subscriber, CancellationToken ct = default);
}
