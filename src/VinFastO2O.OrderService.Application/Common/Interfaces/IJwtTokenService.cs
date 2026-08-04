namespace VinFastO2O.OrderService.Application.Common.Interfaces;

/// <summary>
/// Contract for generating signed JWT access tokens.
/// Implemented in the Infrastructure layer; consumed by Application handlers.
/// </summary>
public interface IJwtTokenService
{
    /// <summary>
    /// Generates a signed JWT access token for the given user identity.
    /// </summary>
    /// <param name="userId">The user's unique identifier (sub claim).</param>
    /// <param name="email">The user's email address (email claim).</param>
    /// <returns>
    /// A tuple containing the signed JWT string and its UTC expiry timestamp.
    /// </returns>
    (string Token, DateTime ExpiresAt) GenerateToken(Guid userId, string email);

    /// <summary>
    /// Generates a signed JWT access token for an administrative user containing role and permission claims.
    /// </summary>
    (string Token, DateTime ExpiresAt) GenerateAdminToken(
        Guid adminUserId,
        string username,
        string email,
        System.Collections.Generic.IEnumerable<string> roles,
        System.Collections.Generic.IEnumerable<string> permissions);

    /// <summary>
    /// Generates a cryptographically secure random refresh token.
    /// </summary>
    string GenerateRefreshToken();

    /// <summary>
    /// Extracts the ClaimsPrincipal from an expired JWT access token without verifying its expiration.
    /// </summary>
    System.Security.Claims.ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
}
