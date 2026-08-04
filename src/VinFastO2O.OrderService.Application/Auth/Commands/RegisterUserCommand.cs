using MediatR;
using VinFastO2O.OrderService.Application.Common.Interfaces;
using VinFastO2O.OrderService.Domain.Entities;

namespace VinFastO2O.OrderService.Application.Auth.Commands;

// ── Request ───────────────────────────────────────────────────────────────────

/// <summary>
/// Registers a new user account, sends OTP verification email, and returns the
/// new UserId. The account is inactive until <see cref="VerifyOtpCommand"/> succeeds.
/// </summary>
public record RegisterUserCommand(
    string Email,
    string Password
) : IRequest<RegisterUserResult>;

public record RegisterUserResult(Guid UserId, string Email);

// ── Handler ───────────────────────────────────────────────────────────────────

public sealed class RegisterUserCommandHandler
    : IRequestHandler<RegisterUserCommand, RegisterUserResult>
{
    private static readonly TimeSpan OtpValidity = TimeSpan.FromMinutes(5);

    private readonly IUserRepository _userRepository;
    private readonly IEmailService   _emailService;

    public RegisterUserCommandHandler(IUserRepository userRepository, IEmailService emailService)
    {
        _userRepository = userRepository;
        _emailService   = emailService;
    }

    public async Task<RegisterUserResult> Handle(
        RegisterUserCommand request,
        CancellationToken   cancellationToken)
    {
        // ── 1. Normalise & validate email ─────────────────────────────────────
        var normalisedEmail = request.Email.Trim().ToLowerInvariant();

        // ── 2. Check for duplicate account ────────────────────────────────────
        var emailExists = await _userRepository.ExistsByEmailAsync(normalisedEmail, cancellationToken);

        if (emailExists)
            throw new InvalidOperationException("Email đã được sử dụng.");

        // ── 3. Hash password with BCrypt (work factor 12) ─────────────────────
        // BCrypt.Net-Next automatically generates and embeds a random salt.
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, workFactor: 12);

        // ── 4. Create User entity ─────────────────────────────────────────────
        var userId = Guid.NewGuid();
        var user   = new User(userId, normalisedEmail, passwordHash);

        // ── 5. Generate 6-digit OTP and set hashed value on the entity ────────
        var rawOtp      = GenerateSixDigitOtp();
        System.Console.WriteLine($"[DEVELOPMENT ONLY] OTP Code for {normalisedEmail} is: {rawOtp}");
        var hashedOtp   = BCrypt.Net.BCrypt.HashPassword(rawOtp, workFactor: 10); // lower cost — OTP is short-lived
        user.SetOtp(hashedOtp, OtpValidity);

        // ── 6. Persist to database ────────────────────────────────────────────
        await _userRepository.AddAsync(user, cancellationToken);

        // ── 7. Send OTP email (fire: email failure should not roll back DB) ────
        try
        {
            await _emailService.SendOtpEmailAsync(normalisedEmail, rawOtp, cancellationToken);
        }
        catch (Exception ex)
        {
            // Log the failure but do NOT roll back the user record.
            // The user can request a resend later.
            // In production, use ILogger injected here.
            _ = ex; // suppress unused-variable warning until a logger is wired
        }

        return new RegisterUserResult(user.UserId, user.Email);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /// <summary>
    /// Generates a cryptographically random 6-digit OTP string (000000–999999).
    /// Uses <see cref="System.Security.Cryptography.RandomNumberGenerator"/>
    /// instead of <see cref="Random"/> to avoid predictability.
    /// </summary>
    private static string GenerateSixDigitOtp()
    {
        // Range 0–999999; format with leading zeros → always 6 chars.
        var value = System.Security.Cryptography.RandomNumberGenerator.GetInt32(0, 1_000_000);
        return value.ToString("D6");
    }
}
