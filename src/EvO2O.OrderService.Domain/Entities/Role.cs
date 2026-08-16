using System;
using System.Collections.Generic;

namespace EvO2O.OrderService.Domain.Entities;

/// <summary>
/// Domain entity representing a system role in RBAC.
/// </summary>
public sealed class Role
{
    public Guid Id { get; private set; }
    public string Code { get; private set; }
    public string Name { get; private set; }
    public string? Description { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // Navigation properties
    public ICollection<AdminUser> AdminUsers { get; private set; } = new List<AdminUser>();
    public ICollection<Permission> Permissions { get; private set; } = new List<Permission>();

    // EF Core Constructor
    private Role()
    {
        Code = string.Empty;
        Name = string.Empty;
    }

    // Factory Constructor
    public Role(Guid id, string code, string name, string? description = null)
    {
        if (string.IsNullOrWhiteSpace(code))
            throw new ArgumentException("Mã vai trò không được để trống.", nameof(code));
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Tên vai trò không được để trống.", nameof(name));

        Id = id;
        Code = code.Trim();
        Name = name.Trim();
        Description = description?.Trim();
        CreatedAt = DateTime.UtcNow;
    }
}
