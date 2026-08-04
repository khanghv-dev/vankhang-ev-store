using VinFastO2O.OrderService.Domain.Entities;

namespace VinFastO2O.OrderService.Application.Common.Interfaces;

/// <summary>
/// Data access contract for the <see cref="User"/> aggregate.
/// Implemented in the Infrastructure layer; consumed by Application layer handlers.
/// </summary>
public interface IUserRepository
{
    /// <summary>Returns true when an account with the given email already exists.</summary>
    Task<bool> ExistsByEmailAsync(string normalisedEmail, CancellationToken ct = default);

    /// <summary>Returns the User entity for the given email, or null if not found.</summary>
    Task<User?> FindByEmailAsync(string normalisedEmail, CancellationToken ct = default);

    /// <summary>Persists a newly created User and commits the change.</summary>
    Task AddAsync(User user, CancellationToken ct = default);

    /// <summary>Persists changes to an existing User and commits the change.</summary>
    Task UpdateAsync(User user, CancellationToken ct = default);
}
