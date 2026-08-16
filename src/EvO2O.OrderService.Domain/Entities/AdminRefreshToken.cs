using System;

namespace EvO2O.OrderService.Domain.Entities;

/// <summary>
/// Domain entity representing a database-persisted refresh token for administrative users.
/// </summary>
public sealed class AdminRefreshToken
{
    public Guid Id { get; private set; }
    public string Token { get; private set; } = string.Empty;
    public Guid AdminUserId { get; private set; }
    
    // Navigation property
    public AdminUser AdminUser { get; private set; } = null!;
    
    public DateTime ExpiresAt { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? RevokedAt { get; private set; }

    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsRevoked => RevokedAt != null;
    public bool IsActive => !IsExpired && !IsRevoked;

    // EF Core Constructor
    private AdminRefreshToken()
    {
    }

    public AdminRefreshToken(Guid id, string token, Guid adminUserId, DateTime expiresAt)
    {
        if (string.IsNullOrWhiteSpace(token))
            throw new ArgumentException("Token không được để trống.", nameof(token));

        Id = id;
        Token = token;
        AdminUserId = adminUserId;
        ExpiresAt = expiresAt;
        CreatedAt = DateTime.UtcNow;
    }

    public void Revoke()
    {
        if (RevokedAt == null)
        {
            RevokedAt = DateTime.UtcNow;
        }
    }
}
