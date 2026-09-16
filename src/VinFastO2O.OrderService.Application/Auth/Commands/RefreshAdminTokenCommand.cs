using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using VinFastO2O.OrderService.Application.Common.Interfaces;
using VinFastO2O.OrderService.Domain.Entities;

namespace VinFastO2O.OrderService.Application.Auth.Commands;

// ── Request Command ──────────────────────────────────────────────────────────
public record RefreshAdminTokenCommand(
    string AccessToken,
    string RefreshToken
) : IRequest<RefreshAdminTokenResult>;

// ── Result Envelope ──────────────────────────────────────────────────────────
public record RefreshAdminTokenResult(
    string AccessToken,
    DateTime ExpiresAt,
    string RefreshToken,
    DateTime RefreshTokenExpiresAt
);

// ── Command Handler ──────────────────────────────────────────────────────────
public sealed class RefreshAdminTokenCommandHandler
    : IRequestHandler<RefreshAdminTokenCommand, RefreshAdminTokenResult>
{
    private readonly IAdminUserRepository _adminUserRepository;
    private readonly IJwtTokenService     _jwtTokenService;

    public RefreshAdminTokenCommandHandler(
        IAdminUserRepository adminUserRepository,
        IJwtTokenService     jwtTokenService)
    {
        _adminUserRepository = adminUserRepository;
        _jwtTokenService     = jwtTokenService;
    }

    public async Task<RefreshAdminTokenResult> Handle(
        RefreshAdminTokenCommand request, 
        CancellationToken cancellationToken)
    {
        // 1. Basic validation
        if (string.IsNullOrWhiteSpace(request.AccessToken))
            throw new ArgumentException("Access Token không được để trống.", nameof(request.AccessToken));

        if (string.IsNullOrWhiteSpace(request.RefreshToken))
            throw new ArgumentException("Refresh Token không được để trống.", nameof(request.RefreshToken));

        // 2. Decode claims from the expired token without validating its signature expiry
        var principal = _jwtTokenService.GetPrincipalFromExpiredToken(request.AccessToken);
        if (principal == null)
        {
            throw new UnauthorizedAccessException("Access Token không hợp lệ.");
        }

        // 3. Extract the AdminUserId from claims
        var userIdClaim = principal.FindFirst("adminUserId") ?? principal.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var adminUserId))
        {
            throw new UnauthorizedAccessException("Access Token không hợp lệ.");
        }

        // 4. Look up the AdminUser
        var admin = await _adminUserRepository.FindByIdWithRolesAndPermissionsAsync(adminUserId, cancellationToken);
        if (admin == null)
        {
            throw new UnauthorizedAccessException("Tài khoản quản trị viên không tồn tại.");
        }

        if (!admin.IsActive)
        {
            throw new InvalidOperationException("Tài khoản quản trị viên này đã bị khóa. Vui lòng liên hệ người quản lý.");
        }

        // 5. Query and validate the Refresh Token
        var dbRefreshToken = await _adminUserRepository.GetRefreshTokenAsync(request.RefreshToken, cancellationToken);
        if (dbRefreshToken == null || dbRefreshToken.AdminUserId != adminUserId || !dbRefreshToken.IsActive)
        {
            throw new UnauthorizedAccessException("Refresh Token không hợp lệ hoặc đã hết hạn.");
        }

        // 6. Rotate tokens: revoke the current refresh token
        dbRefreshToken.Revoke();
        await _adminUserRepository.UpdateRefreshTokenAsync(dbRefreshToken, cancellationToken);

        // 7. Extract roles and permissions
        var roles = admin.Roles
            .Select(r => r.Code)
            .ToList();

        var permissions = admin.Roles
            .SelectMany(r => r.Permissions)
            .Select(p => p.Code)
            .Distinct()
            .ToList();

        // 8. Generate a new Access Token (15 mins) and a new Refresh Token (7 days)
        var (newAccessToken, newExpiresAt) = _jwtTokenService.GenerateAdminToken(
            admin.Id, 
            admin.Username, 
            admin.Email, 
            roles, 
            permissions);

        var newRefreshTokenString = _jwtTokenService.GenerateRefreshToken();
        var newRefreshTokenExpiresAt = DateTime.UtcNow.AddDays(7);
        var newRefreshTokenEntity = new AdminRefreshToken(Guid.NewGuid(), newRefreshTokenString, admin.Id, newRefreshTokenExpiresAt);
        await _adminUserRepository.SaveRefreshTokenAsync(newRefreshTokenEntity, cancellationToken);

        return new RefreshAdminTokenResult(
            AccessToken: newAccessToken,
            ExpiresAt: newExpiresAt,
            RefreshToken: newRefreshTokenString,
            RefreshTokenExpiresAt: newRefreshTokenExpiresAt);
    }
}
