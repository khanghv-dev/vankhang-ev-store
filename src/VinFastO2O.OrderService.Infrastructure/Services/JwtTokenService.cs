using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using VinFastO2O.OrderService.Application.Common.Interfaces;
using VinFastO2O.OrderService.Infrastructure.Settings;

namespace VinFastO2O.OrderService.Infrastructure.Services;

/// <summary>
/// Generates signed JWT access tokens using HMAC-SHA256.
/// Token claims: sub (UserId), email, jti (unique token ID), iat, exp, iss, aud.
/// </summary>
public sealed class JwtTokenService : IJwtTokenService
{
    private readonly JwtSettings _settings;

    public JwtTokenService(IOptions<JwtSettings> options)
    {
        _settings = options.Value;

        // Fail fast at startup rather than issuing unsigned tokens at runtime.
        if (string.IsNullOrWhiteSpace(_settings.SecretKey) || _settings.SecretKey.Length < 32)
            throw new InvalidOperationException(
                "JwtSettings:SecretKey must be at least 32 characters. " +
                "Configure it via User Secrets or an environment variable.");
    }

    /// <inheritdoc/>
    public (string Token, DateTime ExpiresAt) GenerateToken(Guid userId, string email)
    {
        var signingKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_settings.SecretKey));

        var credentials = new SigningCredentials(
            signingKey,
            SecurityAlgorithms.HmacSha256);

        var issuedAt  = DateTime.UtcNow;
        var expiresAt = issuedAt.AddDays(_settings.ExpiryDays);

        // ── Build claims ──────────────────────────────────────────────────────
        // Using registered claim names per RFC 7519 where possible.
        var claims = new[]
        {
            // "sub" (subject) — uniquely identifies the user
            new Claim(JwtRegisteredClaimNames.Sub,   userId.ToString()),

            // "email" — standard OIDC claim
            new Claim(JwtRegisteredClaimNames.Email, email),

            // "jti" (JWT ID) — allows token revocation / replay detection
            new Claim(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString()),

            // "iat" (issued at) — useful for auditing
            new Claim(JwtRegisteredClaimNames.Iat,
                      new DateTimeOffset(issuedAt).ToUnixTimeSeconds().ToString(),
                      ClaimValueTypes.Integer64),

            // Additional convenience claims for the API consumer
            new Claim("userId", userId.ToString()),
        };

        var token = new JwtSecurityToken(
            issuer:             _settings.Issuer,
            audience:           _settings.Audience,
            claims:             claims,
            notBefore:          issuedAt,
            expires:            expiresAt,
            signingCredentials: credentials);

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        return (tokenString, expiresAt);
    }

    /// <inheritdoc/>
    public (string Token, DateTime ExpiresAt) GenerateAdminToken(
        Guid adminUserId,
        string username,
        string email,
        System.Collections.Generic.IEnumerable<string> roles,
        System.Collections.Generic.IEnumerable<string> permissions)
    {
        var signingKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_settings.SecretKey));

        var credentials = new SigningCredentials(
            signingKey,
            SecurityAlgorithms.HmacSha256);

        var issuedAt  = DateTime.UtcNow;
        var expiresAt = issuedAt.AddMinutes(15);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub,   adminUserId.ToString()),
            new Claim(JwtRegisteredClaimNames.UniqueName, username),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Iat,
                      new DateTimeOffset(issuedAt).ToUnixTimeSeconds().ToString(),
                      ClaimValueTypes.Integer64),
            new Claim("adminUserId", adminUserId.ToString()),
        };

        // Add Role claims
        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        // Add Permission claims
        foreach (var permission in permissions)
        {
            claims.Add(new Claim("permission", permission));
        }

        var token = new JwtSecurityToken(
            issuer:             _settings.Issuer,
            audience:           _settings.Audience,
            claims:             claims,
            notBefore:          issuedAt,
            expires:            expiresAt,
            signingCredentials: credentials);

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        return (tokenString, expiresAt);
    }

    /// <inheritdoc/>
    public string GenerateRefreshToken()
    {
        var randomNumber = new byte[64];
        using var rng = System.Security.Cryptography.RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    /// <inheritdoc/>
    public ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
    {
        try
        {
            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateAudience = false,
                ValidateIssuer = false,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.SecretKey)),
                ValidateLifetime = false // Retrieve claims regardless of expiry status
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out SecurityToken securityToken);
            
            if (securityToken is not JwtSecurityToken jwtSecurityToken || 
                !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                return null;
            }

            return principal;
        }
        catch
        {
            return null;
        }
    }
}
