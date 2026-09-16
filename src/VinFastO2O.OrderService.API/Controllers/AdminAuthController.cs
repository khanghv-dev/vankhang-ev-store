using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using VinFastO2O.OrderService.Application.Auth.Commands;

namespace VinFastO2O.OrderService.API.Controllers;

/// <summary>
/// Authentication endpoints for system administrators (RBAC).
/// </summary>
[ApiController]
[Route("api/admin/auth")]
[Produces("application/json")]
public sealed class AdminAuthController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<AdminAuthController> _logger;

    public AdminAuthController(IMediator mediator, ILogger<AdminAuthController> logger)
    {
        _mediator = mediator;
        _logger   = logger;
    }

    /// <summary>
    /// Authenticates an administrator, returning a JWT token with role and permission claims.
    /// </summary>
    /// <response code="200">Login successful; returns admin info, roles, permissions, and JWT token.</response>
    /// <response code="400">Request payload is missing required fields.</response>
    /// <response code="401">Invalid credentials (wrong username/email or password).</response>
    /// <response code="403">The account is inactive or locked.</response>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AdminLoginResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponseDto),     StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponseDto),     StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponseDto),     StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Login(
        [FromBody] AdminLoginRequestDto dto,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.UsernameOrEmail))
        {
            return BadRequest(new ErrorResponseDto("Tên đăng nhập hoặc email không được để trống."));
        }

        if (string.IsNullOrWhiteSpace(dto.Password))
        {
            return BadRequest(new ErrorResponseDto("Mật khẩu không được để trống."));
        }

        try
        {
            var command = new LoginAdminCommand(dto.UsernameOrEmail, dto.Password);
            var result  = await _mediator.Send(command, cancellationToken);

            _logger.LogInformation(
                "[AdminAuth] Admin logged in successfully — AdminUserId: {AdminUserId} | Username: {Username}",
                result.AdminUserId, result.Username);

            return Ok(new AdminLoginResponseDto(
                result.AdminUserId,
                result.Username,
                result.Email,
                result.Roles,
                result.Permissions,
                result.AccessToken,
                result.ExpiresAt,
                result.RefreshToken,
                result.RefreshTokenExpiresAt,
                "Đăng nhập quản trị thành công."));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorResponseDto(ex.Message));
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(
                "[AdminAuth] Login failed — invalid credentials for: {Identifier}", 
                dto.UsernameOrEmail);

            return Unauthorized(new ErrorResponseDto(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(
                "[AdminAuth] Login blocked — account inactive/locked: {Identifier}", 
                dto.UsernameOrEmail);

            return StatusCode(StatusCodes.Status403Forbidden, new ErrorResponseDto(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex, 
                "[AdminAuth] Unexpected error during admin login — Identifier: {Identifier}", 
                dto.UsernameOrEmail);

            return StatusCode(
                StatusCodes.Status500InternalServerError, 
                new ErrorResponseDto("Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau."));
        }
    }

    /// <summary>
    /// Refreshes the session of an authenticated administrator using an expired Access Token and active Refresh Token.
    /// </summary>
    /// <response code="200">Session successfully extended; returns new access token and refresh token.</response>
    /// <response code="400">Request payload is missing required fields or has invalid tokens.</response>
    /// <response code="401">Unauthorized request.</response>
    /// <response code="403">The account is inactive or locked.</response>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(AdminRefreshResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponseDto),        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponseDto),        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponseDto),        StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Refresh(
        [FromBody] AdminRefreshRequestDto dto,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.AccessToken))
        {
            return BadRequest(new ErrorResponseDto("Access Token không được để trống."));
        }

        if (string.IsNullOrWhiteSpace(dto.RefreshToken))
        {
            return BadRequest(new ErrorResponseDto("Refresh Token không được để trống."));
        }

        try
        {
            var command = new RefreshAdminTokenCommand(dto.AccessToken, dto.RefreshToken);
            var result  = await _mediator.Send(command, cancellationToken);

            _logger.LogInformation("[AdminAuth] Session refreshed successfully for administrative token pair.");

            return Ok(new AdminRefreshResponseDto(
                result.AccessToken,
                result.ExpiresAt,
                result.RefreshToken,
                result.RefreshTokenExpiresAt,
                "Gia hạn phiên làm việc thành công."));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorResponseDto(ex.Message));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new ErrorResponseDto(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new ErrorResponseDto(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[AdminAuth] Unexpected error during admin token refresh");
            return StatusCode(
                StatusCodes.Status500InternalServerError, 
                new ErrorResponseDto("Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau."));
        }
    }

    [HttpGet("test-token")]
    public IActionResult GetTestToken()
    {
        var jwtTokenService = HttpContext.RequestServices.GetRequiredService<VinFastO2O.OrderService.Application.Common.Interfaces.IJwtTokenService>();
        var (token, _) = jwtTokenService.GenerateAdminToken(
            Guid.Parse("d6316469-cf14-4fd8-9839-f4399616f7c8"),
            "admin",
            "admin@evo2o.vn",
            new[] { "Admin" },
            new[] { "manage_orders" }
        );
        return Ok(new { token });
    }
}

// ── Request DTOs ─────────────────────────────────────────────────────────────
public record AdminLoginRequestDto(string UsernameOrEmail, string Password);
public record AdminRefreshRequestDto(string AccessToken, string RefreshToken);

// ── Response DTOs ────────────────────────────────────────────────────────────
public record AdminLoginResponseDto(
    Guid         AdminUserId,
    string       Username,
    string       Email,
    List<string> Roles,
    List<string> Permissions,
    string       AccessToken,
    DateTime     ExpiresAt,
    string       RefreshToken,
    DateTime     RefreshTokenExpiresAt,
    string       Message);

public record AdminRefreshResponseDto(
    string   AccessToken,
    DateTime ExpiresAt,
    string   RefreshToken,
    DateTime RefreshTokenExpiresAt,
    string   Message);
