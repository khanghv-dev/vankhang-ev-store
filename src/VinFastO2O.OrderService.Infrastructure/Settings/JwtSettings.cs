namespace VinFastO2O.OrderService.Infrastructure.Settings;

/// <summary>
/// Strongly-typed JWT configuration bound from appsettings.json → "JwtSettings".
/// Store the SecretKey in User Secrets / environment variables in production.
/// </summary>
public sealed class JwtSettings
{
    /// <summary>Configuration section key in appsettings.json.</summary>
    public const string SectionName = "JwtSettings";

    /// <summary>
    /// HMAC-SHA256 signing key — must be at least 32 characters (256 bits).
    /// NEVER commit the real value; use User Secrets or env vars.
    /// </summary>
    public string SecretKey { get; init; } = string.Empty;

    /// <summary>JWT "iss" (issuer) claim — identifies who issued the token.</summary>
    public string Issuer { get; init; } = "VinFastO2O";

    /// <summary>JWT "aud" (audience) claim — identifies intended recipients.</summary>
    public string Audience { get; init; } = "VinFastO2O.Client";

    /// <summary>Token lifetime in days. Default: 7 days.</summary>
    public int ExpiryDays { get; init; } = 7;
}
