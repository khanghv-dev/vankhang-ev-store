using System;
using System.Collections.Generic;

namespace VinFastO2O.OrderService.Domain.Entities;

/// <summary>
/// Domain entity representing a system permission in RBAC.
/// </summary>
public sealed class Permission
{
    public Guid Id { get; private set; }
    public string Code { get; private set; }
    public string Name { get; private set; }
    public string? Description { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // Navigation property
    public ICollection<Role> Roles { get; private set; } = new List<Role>();

    // EF Core Constructor
    private Permission()
    {
        Code = string.Empty;
        Name = string.Empty;
    }

    // Factory Constructor
    public Permission(Guid id, string code, string name, string? description = null)
    {
        if (string.IsNullOrWhiteSpace(code))
            throw new ArgumentException("Mã quyền hạn không được để trống.", nameof(code));
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Tên quyền hạn không được để trống.", nameof(name));

        Id = id;
        Code = code.Trim();
        Name = name.Trim();
        Description = description?.Trim();
        CreatedAt = DateTime.UtcNow;
    }
}
