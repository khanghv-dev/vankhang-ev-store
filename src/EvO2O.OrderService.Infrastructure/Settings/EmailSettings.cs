namespace EvO2O.OrderService.Infrastructure.Settings;

/// <summary>
/// Strongly-typed SMTP configuration bound from appsettings.json → "EmailSettings".
/// Never hard-code credentials; always read from configuration / secrets.
/// </summary>
public sealed class EmailSettings
{
    /// <summary>Configuration section key in appsettings.json.</summary>
    public const string SectionName = "EmailSettings";

    /// <summary>SMTP host (e.g. "smtp.gmail.com", "smtp.sendgrid.net").</summary>
    public string Host { get; init; } = string.Empty;

    /// <summary>SMTP port — 587 (STARTTLS) or 465 (SSL).</summary>
    public int Port { get; init; } = 587;

    /// <summary>Whether to enable SSL/TLS on connection (true for port 465).</summary>
    public bool UseSsl { get; init; } = false;

    /// <summary>SMTP authentication username (Gmail address or SendGrid "apikey").</summary>
    public string Username { get; init; } = string.Empty;

    /// <summary>SMTP authentication password or API key. Store in User Secrets / env var in production.</summary>
    public string Password { get; init; } = string.Empty;

    /// <summary>The "From" address that appears in the recipient's inbox.</summary>
    public string FromAddress { get; init; } = string.Empty;

    /// <summary>Display name shown alongside the From address.</summary>
    public string FromName { get; init; } = "VinFast O2O";

    /// <summary>Operation timeout in seconds for the SMTP connection.</summary>
    public int TimeoutSeconds { get; init; } = 30;
}
