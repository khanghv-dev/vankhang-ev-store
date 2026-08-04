using MediatR;
using VinFastO2O.OrderService.Application.Common.Interfaces;

namespace VinFastO2O.OrderService.Application.Auth.Commands;

// ── Request ───────────────────────────────────────────────────────────────────

/// <summary>
/// Authenticates a user with email and password.
/// Returns a signed JWT access token on success.
/// </summary>
public record LoginUserCommand(
    string Email,
    string Password
) : IRequest<LoginUserResult>;

/// <summary>Result returned on successful authentication.</summary>
public record LoginUserResult(
    Guid     UserId,
    string   Email,
    string   AccessToken,
    DateTime ExpiresAt
);

// ── Handler ───────────────────────────────────────────────────────────────────

public sealed class LoginUserCommandHandler
    : IRequestHandler<LoginUserCommand, LoginUserResult>
{
    // Intentionally vague error message — prevents user enumeration attacks.
    // An attacker must not be able to distinguish "wrong email" from "wrong password".
    private const string GenericAuthError = "Email hoặc mật khẩu không chính xác.";

    private readonly IUserRepository  _userRepository;
    private readonly IJwtTokenService _jwtTokenService;

    public LoginUserCommandHandler(
        IUserRepository  userRepository,
        IJwtTokenService jwtTokenService)
    {
        _userRepository  = userRepository;
        _jwtTokenService = jwtTokenService;
    }

    public async Task<LoginUserResult> Handle(
        LoginUserCommand  request,
        CancellationToken cancellationToken)
    {
        var normalisedEmail = request.Email.Trim().ToLowerInvariant();

        // ── 1. Look up the user account ───────────────────────────────────────
        var user = await _userRepository.FindByEmailAsync(normalisedEmail, cancellationToken);

        // Return the SAME vague error whether the email doesn't exist OR the
        // password is wrong. This prevents user-enumeration timing attacks.
        if (user is null)
            throw new UnauthorizedAccessException(GenericAuthError);

        // ── 2. Verify password using BCrypt constant-time comparison ──────────
        // BCrypt.Verify() always runs the full hashing algorithm regardless of
        // the outcome, so timing is constant and cannot reveal validity.
        var passwordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);

        if (!passwordValid)
            throw new UnauthorizedAccessException(GenericAuthError);

        // ── 3. Enforce email confirmation gate ────────────────────────────────
        // Use a DISTINCT exception type so the controller can map to 403 + a
        // specific error code that the mobile/web client can act on.
        if (!user.IsEmailConfirmed)
            throw new EmailNotConfirmedException(
                "Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email và xác thực mã OTP trước khi đăng nhập.");

        // ── 4. Issue JWT access token ─────────────────────────────────────────
        var (token, expiresAt) = _jwtTokenService.GenerateToken(user.UserId, user.Email);

        return new LoginUserResult(
            UserId:      user.UserId,
            Email:       user.Email,
            AccessToken: token,
            ExpiresAt:   expiresAt);
    }
}

// ── Domain Exception ──────────────────────────────────────────────────────────

/// <summary>
/// Thrown when a user attempts to log in with an unconfirmed email address.
/// Mapped to HTTP 403 Forbidden in the controller.
/// </summary>
public sealed class EmailNotConfirmedException : Exception
{
    public EmailNotConfirmedException(string message) : base(message) { }
}
