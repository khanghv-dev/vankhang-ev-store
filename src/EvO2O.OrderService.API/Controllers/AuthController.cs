using MediatR;
using Microsoft.AspNetCore.Mvc;
using EvO2O.OrderService.Application.Auth.Commands;

namespace EvO2O.OrderService.API.Controllers;

/// <summary>
/// Authentication endpoints for the VinFast O2O platform.
/// Handles account registration and email OTP verification.
/// </summary>
[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public sealed class AuthController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IMediator mediator, ILogger<AuthController> logger)
    {
        _mediator = mediator;
        _logger   = logger;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/auth/register
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Registers a new user account and sends a 6-digit OTP to their email.
    /// The account is inactive (IsEmailConfirmed = false) until OTP is verified.
    /// </summary>
    /// <response code="200">Account created; OTP sent to the provided email.</response>
    /// <response code="400">Validation failed (missing fields, weak password, etc.).</response>
    /// <response code="409">Email address is already registered.</response>
    [HttpPost("register")]
    [ProducesResponseType(typeof(RegisterResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponseDto),    StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponseDto),    StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register(
        [FromBody] RegisterRequestDto dto,
        CancellationToken cancellationToken)
    {
        // ── Basic input validation ────────────────────────────────────────────
        if (string.IsNullOrWhiteSpace(dto.Email))
            return BadRequest(new ErrorResponseDto("Email không được để trống."));

        if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 8)
            return BadRequest(new ErrorResponseDto("Mật khẩu phải có ít nhất 8 ký tự."));

        try
        {
            var command = new RegisterUserCommand(dto.Email, dto.Password);
            var result  = await _mediator.Send(command, cancellationToken);

            _logger.LogInformation(
                "[Auth] New account registered — UserId: {UserId} | Email: {Email}",
                result.UserId, MaskEmail(dto.Email));

            return Ok(new RegisterResponseDto(
                result.UserId,
                result.Email,
                "Tài khoản đã được tạo thành công. Vui lòng kiểm tra email để lấy mã xác thực OTP."));
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Email đã được sử dụng"))
        {
            _logger.LogWarning(
                "[Auth] Registration rejected — duplicate email: {Email}", MaskEmail(dto.Email));

            return Conflict(new ErrorResponseDto(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "[Auth] Unexpected error during registration — Email: {Email}", MaskEmail(dto.Email));
            return StatusCode(StatusCodes.Status500InternalServerError,
                new ErrorResponseDto("Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau."));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/auth/verify-otp
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Verifies the 6-digit OTP submitted by the user.
    /// On success, activates the account (IsEmailConfirmed = true) and invalidates the OTP.
    /// </summary>
    /// <response code="200">OTP verified; account is now active.</response>
    /// <response code="400">OTP is invalid, expired, or account not found.</response>
    [HttpPost("verify-otp")]
    [ProducesResponseType(typeof(VerifyOtpResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponseDto),     StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyOtp(
        [FromBody] VerifyOtpRequestDto dto,
        CancellationToken cancellationToken)
    {
        // ── Basic input validation ────────────────────────────────────────────
        if (string.IsNullOrWhiteSpace(dto.Email))
            return BadRequest(new ErrorResponseDto("Email không được để trống."));

        if (string.IsNullOrWhiteSpace(dto.OtpCode) || dto.OtpCode.Length != 6)
            return BadRequest(new ErrorResponseDto("Mã OTP phải gồm đúng 6 chữ số."));

        if (!dto.OtpCode.All(char.IsDigit))
            return BadRequest(new ErrorResponseDto("Mã OTP chỉ được chứa chữ số."));

        try
        {
            var command = new VerifyOtpCommand(dto.Email, dto.OtpCode);
            var result  = await _mediator.Send(command, cancellationToken);

            if (!result.Success)
            {
                _logger.LogWarning(
                    "[Auth] OTP verification failed — Email: {Email} | Reason: {Reason}",
                    MaskEmail(dto.Email), result.Message);

                return BadRequest(new ErrorResponseDto(result.Message));
            }

            _logger.LogInformation(
                "[Auth] OTP verified successfully — Email: {Email}", MaskEmail(dto.Email));

            return Ok(new VerifyOtpResponseDto(result.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "[Auth] Unexpected error during OTP verification — Email: {Email}", MaskEmail(dto.Email));
            return StatusCode(StatusCodes.Status500InternalServerError,
                new ErrorResponseDto("Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau."));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/auth/login
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Authenticates a user with email and password, returns a signed JWT token.
    /// The account must have a confirmed email before login is permitted.
    /// </summary>
    /// <response code="200">Login successful; JWT access token returned.</response>
    /// <response code="400">Request payload is missing required fields.</response>
    /// <response code="401">Credentials are invalid (wrong email or password).</response>
    /// <response code="403">Account exists but email has not been confirmed yet.</response>
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponseDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponseDto), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(LoginUnconfirmedResponseDto), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequestDto dto,
        CancellationToken cancellationToken)
    {
        // ── Basic input validation ────────────────────────────────────────────
        if (string.IsNullOrWhiteSpace(dto.Email))
            return BadRequest(new ErrorResponseDto("Email không được để trống."));

        if (string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest(new ErrorResponseDto("Mật khẩu không được để trống."));

        try
        {
            var command = new LoginUserCommand(dto.Email, dto.Password);
            var result  = await _mediator.Send(command, cancellationToken);

            _logger.LogInformation(
                "[Auth] Login successful — UserId: {UserId} | Email: {Email}",
                result.UserId, MaskEmail(dto.Email));

            return Ok(new LoginResponseDto(
                result.UserId,
                result.Email,
                result.AccessToken,
                result.ExpiresAt,
                "Đăng nhập thành công."));
        }
        catch (EmailNotConfirmedException ex)
        {
            // 403 Forbidden — distinct from 401 so the client can show a
            // "Please verify your email" prompt instead of a generic error.
            _logger.LogWarning(
                "[Auth] Login blocked — email not confirmed: {Email}", MaskEmail(dto.Email));

            return StatusCode(StatusCodes.Status403Forbidden,
                new LoginUnconfirmedResponseDto(
                    ex.Message,
                    ErrorCode: "EMAIL_NOT_CONFIRMED"));
        }
        catch (UnauthorizedAccessException ex)
        {
            // 401 Unauthorized — wrong email or wrong password (vague on purpose).
            _logger.LogWarning(
                "[Auth] Login failed — invalid credentials for email: {Email}", MaskEmail(dto.Email));

            return Unauthorized(new ErrorResponseDto(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "[Auth] Unexpected error during login — Email: {Email}", MaskEmail(dto.Email));
            return StatusCode(StatusCodes.Status500InternalServerError,
                new ErrorResponseDto("Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau."));
        }
    }

    /// <summary>
    /// Authenticates or registers a user via Google OAuth 2.0.
    /// </summary>
    [HttpPost("google-login")]
    [ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponseDto), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GoogleLogin(
        [FromBody] GoogleLoginRequestDto dto,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.Email))
            return BadRequest(new ErrorResponseDto("Email từ Google không hợp lệ."));

        try
        {
            var command = new GoogleLoginCommand(dto.Email, dto.Name, dto.PictureUrl);
            var result  = await _mediator.Send(command, cancellationToken);

            _logger.LogInformation(
                "[Auth] Google Login successful — UserId: {UserId} | Email: {Email}",
                result.UserId, MaskEmail(dto.Email));

            return Ok(new LoginResponseDto(
                result.UserId,
                result.Email,
                result.AccessToken,
                result.ExpiresAt,
                "Đăng nhập Google thành công."));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Auth] Error during Google login — Email: {Email}", MaskEmail(dto.Email));
            return StatusCode(StatusCodes.Status500InternalServerError,
                new ErrorResponseDto("Đã xảy ra lỗi khi đăng nhập bằng Google."));
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /// <summary>Masks the local part of an email address for safe logging.</summary>
    private static string MaskEmail(string email)
    {
        var at = email.IndexOf('@');
        return at <= 1 ? "***" : $"{email[0]}***{email[at..]}";
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Request / Response DTOs (co-located for readability — move to DTOs/ if needed)
// ─────────────────────────────────────────────────────────────────────────────

/// <summary>Payload for POST /api/auth/register.</summary>
public record RegisterRequestDto(string Email, string Password);

/// <summary>Payload for POST /api/auth/verify-otp.</summary>
public record VerifyOtpRequestDto(string Email, string OtpCode);

/// <summary>Payload for POST /api/auth/login.</summary>
public record LoginRequestDto(string Email, string Password);

/// <summary>Success response for account registration.</summary>
public record RegisterResponseDto(Guid UserId, string Email, string Message);

/// <summary>Success response for OTP verification.</summary>
public record VerifyOtpResponseDto(string Message);

/// <summary>Success response for login — contains the JWT access token.</summary>
public record LoginResponseDto(
    Guid     UserId,
    string   Email,
    string   AccessToken,
    DateTime ExpiresAt,
    string   Message);

/// <summary>
/// 403 response when login is blocked because the email is not confirmed.
/// Provides a machine-readable <c>ErrorCode</c> for client-side routing.
/// </summary>
public record LoginUnconfirmedResponseDto(string Message, string ErrorCode);

/// <summary>Uniform error envelope returned on 4xx/5xx responses.</summary>
public record ErrorResponseDto(string Message);

/// <summary>Payload for POST /api/auth/google-login.</summary>
public record GoogleLoginRequestDto(string Email, string? Name, string? PictureUrl);
