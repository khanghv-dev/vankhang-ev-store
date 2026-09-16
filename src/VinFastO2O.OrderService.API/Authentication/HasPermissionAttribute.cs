using Microsoft.AspNetCore.Authorization;
using System;

namespace VinFastO2O.OrderService.API.Authentication;

/// <summary>
/// Specifies that the target controller or action method requires a granular RBAC permission via native Policy.
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = true)]
public sealed class HasPermissionAttribute : AuthorizeAttribute
{
    public string Permission { get; }

    public HasPermissionAttribute(string permission) : base(policy: permission)
    {
        if (string.IsNullOrWhiteSpace(permission))
        {
            throw new ArgumentException("Permission code cannot be null or empty.", nameof(permission));
        }

        Permission = permission;
    }
}
