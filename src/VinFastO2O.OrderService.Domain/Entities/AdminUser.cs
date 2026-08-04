using System;
using System.Collections.Generic;

namespace VinFastO2O.OrderService.Domain.Entities;

/// <summary>
/// Domain entity representing a system administrator.
/// </summary>
public sealed class AdminUser
{
    public Guid Id { get; private set; }
    public string Username { get; private set; }
    public string Email { get; private set; }
    public string PasswordHash { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // Navigation property for many-to-many relationship with Roles
    public ICollection<Role> Roles { get; private set; } = new List<Role>();

    // EF Core Constructor
    private AdminUser()
    {
        Username = string.Empty;
        Email = string.Empty;
        PasswordHash = string.Empty;
    }

    // Factory Constructor
    public AdminUser(Guid id, string username, string email, string passwordHash)
    {
        if (string.IsNullOrWhiteSpace(username))
            throw new ArgumentException("Username không được để trống.", nameof(username));
        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("Email không được để trống.", nameof(email));
        if (string.IsNullOrWhiteSpace(passwordHash))
            throw new ArgumentException("Mật khẩu băm không được để trống.", nameof(passwordHash));

        Id = id;
        Username = username.Trim().ToLowerInvariant();
        Email = email.Trim().ToLowerInvariant();
        PasswordHash = passwordHash;
        IsActive = true;
        CreatedAt = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        IsActive = false;
    }

    public void Activate()
    {
        IsActive = true;
    }
}
