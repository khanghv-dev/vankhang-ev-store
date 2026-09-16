using Microsoft.AspNetCore.Authorization;

namespace VinFastO2O.OrderService.API.Authentication;

public sealed class PermissionRequirement : IAuthorizationRequirement
{
    public string Permission { get; }

    public PermissionRequirement(string permission)
    {
        Permission = permission;
    }
}
