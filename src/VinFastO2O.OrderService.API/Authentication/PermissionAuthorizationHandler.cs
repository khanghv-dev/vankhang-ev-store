using Microsoft.AspNetCore.Authorization;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace VinFastO2O.OrderService.API.Authentication;

public sealed class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        var user = context.User;
        if (user is null)
        {
            return Task.CompletedTask;
        }

        // Bypassing granular permission checks for Admin & SuperAdmin roles
        var roles = user.FindAll(ClaimTypes.Role)
            .Concat(user.FindAll("role"))
            .Concat(user.FindAll("http://schemas.microsoft.com/ws/2008/06/identity/claims/role"))
            .Select(c => c.Value)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        if (roles.Contains("SuperAdmin") || roles.Contains("Admin") || roles.Contains("ADMIN"))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        // Check for the specific permission in user claims
        var userPermissions = user.FindAll("permission")
            .Select(c => c.Value)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        if (userPermissions.Contains(requirement.Permission))
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}
