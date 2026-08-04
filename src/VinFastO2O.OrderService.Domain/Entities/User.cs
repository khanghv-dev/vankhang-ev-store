namespace VinFastO2O.OrderService.Domain.Entities;

/// <summary>
/// User account entity for the VinFast O2O Authentication module.
/// OTP is stored as a BCrypt hash — never as plaintext.
/// </summary>
public sealed class User
{
    // ── Primary Key ───────────────────────────────────────────────────────────
    public Guid   UserId             { get; private set; }

    // ── Identity ──────────────────────────────────────────────────────────────
    public string Email              { get; private set; }
    public string PasswordHash       { get; private set; }

    // ── Email Verification ────────────────────────────────────────────────────
    public bool   IsEmailConfirmed   { get; private set; }
    public string? OtpCode           { get; private set; }   // BCrypt hash of the 6-digit OTP
    public DateTime? OtpExpiry       { get; private set; }   // UTC expiry

    // ── Audit ─────────────────────────────────────────────────────────────────
    public DateTime CreatedAt        { get; private set; }

    // ── EF Core constructor (parameterless, private) ──────────────────────────
    private User() { Email = string.Empty; PasswordHash = string.Empty; }

    // ── Factory constructor ───────────────────────────────────────────────────
    public User(Guid userId, string email, string passwordHash)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(email,        nameof(email));
        ArgumentException.ThrowIfNullOrWhiteSpace(passwordHash, nameof(passwordHash));

        UserId           = userId;
        Email            = email.Trim().ToLowerInvariant();
        PasswordHash     = passwordHash;
        IsEmailConfirmed = false;
        CreatedAt        = DateTime.UtcNow;
    }

    // ── Domain Behaviours ─────────────────────────────────────────────────────

    /// <summary>
    /// Stores a hashed OTP code and sets the 5-minute expiry window.
    /// Call this every time a new OTP is generated.
    /// </summary>
    public void SetOtp(string hashedOtpCode, TimeSpan expiryDuration)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(hashedOtpCode, nameof(hashedOtpCode));
        OtpCode   = hashedOtpCode;
        OtpExpiry = DateTime.UtcNow.Add(expiryDuration);
    }

    /// <summary>
    /// Confirms the email, clears the OTP fields to prevent reuse.
    /// Returns false if there is no active OTP or it has expired.
    /// </summary>
    public bool ConfirmEmail()
    {
        if (OtpCode is null || OtpExpiry is null || OtpExpiry < DateTime.UtcNow)
            return false;

        IsEmailConfirmed = true;
        OtpCode          = null;
        OtpExpiry        = null;
        return true;
    }

    /// <summary>Returns true when an OTP has been issued and has not yet expired.</summary>
    public bool HasActiveOtp() =>
        OtpCode is not null && OtpExpiry.HasValue && OtpExpiry.Value > DateTime.UtcNow;
}
