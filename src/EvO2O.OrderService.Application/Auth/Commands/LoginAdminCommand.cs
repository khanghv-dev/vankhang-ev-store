using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using EvO2O.OrderService.Application.Common.Interfaces;
using EvO2O.OrderService.Domain.Entities;

namespace EvO2O.OrderService.Application.Auth.Commands;

// ── Request Command ──────────────────────────────────────────────────────────
public record LoginAdminCommand(
    string UsernameOrEmail,
    string Password
) : IRequest<LoginAdminResult>;

// ── Result Envelope ──────────────────────────────────────────────────────────
public record LoginAdminResult(
    Guid AdminUserId,
    string Username,
    string Email,
    List<string> Roles,
    List<string> Permissions,
    string AccessToken,
    DateTime ExpiresAt,
    string RefreshToken,
    DateTime RefreshTokenExpiresAt
);

// ── Command Handler ──────────────────────────────────────────────────────────
public sealed class LoginAdminCommandHandler
    : IRequestHandler<LoginAdminCommand, LoginAdminResult>
{
    private const string GenericAuthError = "Tên đăng nhập hoặc mật khẩu không chính xác.";
    
    private readonly IAdminUserRepository _adminUserRepository;
    private readonly IJwtTokenService     _jwtTokenService;

    public LoginAdminCommandHandler(
        IAdminUserRepository adminUserRepository,
        IJwtTokenService     jwtTokenService)
    {
        _adminUserRepository = adminUserRepository;
        _jwtTokenService     = jwtTokenService;
    }

    public async Task<LoginAdminResult> Handle(
        LoginAdminCommand request, 
        CancellationToken cancellationToken)
    {
        // 1. Basic Validation
        if (string.IsNullOrWhiteSpace(request.UsernameOrEmail))
            throw new ArgumentException("Tên đăng nhập hoặc email không được để trống.", nameof(request.UsernameOrEmail));

        if (string.IsNullOrWhiteSpace(request.Password))
            throw new ArgumentException("Mật khẩu không được để trống.", nameof(request.Password));

        var identifier = request.UsernameOrEmail.Trim().ToLowerInvariant();

        // 2. Look up the admin user eagerly loading Roles and Permissions
        var admin = await _adminUserRepository.FindByUsernameOrEmailWithRolesAndPermissionsAsync(identifier, cancellationToken);
        if (admin is null)
        {
            throw new UnauthorizedAccessException(GenericAuthError);
        }

        // 3. Verify status
        if (!admin.IsActive)
        {
            throw new InvalidOperationException("Tài khoản quản trị viên này đã bị khóa. Vui lòng liên hệ người quản lý.");
        }

        // 4. Verify password hash using BCrypt constant-time comparison
        var isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, admin.PasswordHash);
        if (!isPasswordValid)
        {
            throw new UnauthorizedAccessException(GenericAuthError);
        }

        // 5. Gather unique roles and distinct permissions codes
        var roles = admin.Roles
            .Select(r => r.Code)
            .ToList();

        var permissions = admin.Roles
            .SelectMany(r => r.Permissions)
            .Select(p => p.Code)
            .Distinct()
            .ToList();

        // 6. Generate signed JWT access token containing Roles and Permissions claims
        var (token, expiresAt) = _jwtTokenService.GenerateAdminToken(
            admin.Id, 
            admin.Username, 
            admin.Email, 
            roles, 
            permissions);

        // 7. Generate and save Refresh Token (7 days expiry)
        var refreshTokenString = _jwtTokenService.GenerateRefreshToken();
        var refreshTokenExpiresAt = DateTime.UtcNow.AddDays(7);
        var refreshTokenEntity = new AdminRefreshToken(Guid.NewGuid(), refreshTokenString, admin.Id, refreshTokenExpiresAt);
        await _adminUserRepository.SaveRefreshTokenAsync(refreshTokenEntity, cancellationToken);

        return new LoginAdminResult(
            AdminUserId: admin.Id,
            Username:    admin.Username,
            Email:       admin.Email,
            Roles:       roles,
            Permissions: permissions,
            AccessToken: token,
            ExpiresAt:   expiresAt,
            RefreshToken: refreshTokenString,
            RefreshTokenExpiresAt: refreshTokenExpiresAt);
    }
}
