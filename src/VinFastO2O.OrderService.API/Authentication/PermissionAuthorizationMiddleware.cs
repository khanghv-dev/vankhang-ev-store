using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using VinFastO2O.OrderService.Infrastructure.Settings;

namespace VinFastO2O.OrderService.API.Authentication;

/// <summary>
/// Custom Authorization Middleware that intercepts endpoints decorated with HasPermissionAttribute,
/// validates the JWT token, extracts permission claims, and handles 401 Unauthorized / 403 Forbidden.
/// </summary>
public sealed class PermissionAuthorizationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly JwtSettings _jwtSettings;
    private readonly ILogger<PermissionAuthorizationMiddleware> _logger;

    public PermissionAuthorizationMiddleware(
        RequestDelegate next,
        IOptions<JwtSettings> jwtOptions,
        ILogger<PermissionAuthorizationMiddleware> logger)
    {
        _next = next;
        _jwtSettings = jwtOptions.Value;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var endpoint = context.GetEndpoint();
        var requiresAuthorize = endpoint?.Metadata.GetMetadata<Microsoft.AspNetCore.Authorization.IAuthorizeData>() != null;

        // 1. Extract Authorization header containing Bearer JWT or SignalR query parameter
        string token = string.Empty;
        if (context.Request.Headers.TryGetValue("Authorization", out var authHeader) &&
            !string.IsNullOrWhiteSpace(authHeader.ToString()) &&
            authHeader.ToString().StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            token = authHeader.ToString().Substring("Bearer ".Length).Trim();
        }
        else if (context.Request.Query.TryGetValue("access_token", out var accessTokenQuery) &&
                 !string.IsNullOrWhiteSpace(accessTokenQuery.ToString()))
        {
            token = accessTokenQuery.ToString().Trim();
        }

        if (string.IsNullOrWhiteSpace(token))
        {
            if (requiresAuthorize)
            {
                _logger.LogWarning("[AuthorizationFailed] Request to '{Path}' missing Bearer Authorization header and access_token query.", context.Request.Path);
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(new { message = "Yêu cầu cung cấp Access Token hợp lệ." });
                return;
            }

            await _next(context);
            return;
        }

        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_jwtSettings.SecretKey);

            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = _jwtSettings.Issuer,
                ValidateAudience = true,
                ValidAudience = _jwtSettings.Audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };

            // 2. Validate and parse the security token
            var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);

            // Set the claims principal to HttpContext.User
            context.User = principal;
        }
        catch (SecurityTokenExpiredException)
        {
            _logger.LogWarning("[AuthorizationFailed] Access token expired on request to '{Path}'.", context.Request.Path);
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new { message = "Token đã hết hạn." });
            return;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[AuthorizationFailed] Token validation failed on request to '{Path}'.", context.Request.Path);
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new { message = "Token không hợp lệ." });
            return;
        }

        await _next(context);
    }
}
