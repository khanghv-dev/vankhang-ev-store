using MediatR;
using VinFastO2O.OrderService.Application.Common.Interfaces;

namespace VinFastO2O.OrderService.Application.Auth.Commands;

// ── Request ───────────────────────────────────────────────────────────────────

/// <summary>
/// Verifies the 6-digit OTP submitted by the user.
/// On success, marks <c>IsEmailConfirmed = true</c> and clears the OTP fields.
/// </summary>
public record VerifyOtpCommand(
    string Email,
    string OtpCode
) : IRequest<VerifyOtpResult>;

public record VerifyOtpResult(bool Success, string Message);

// ── Handler ───────────────────────────────────────────────────────────────────

public sealed class VerifyOtpCommandHandler
    : IRequestHandler<VerifyOtpCommand, VerifyOtpResult>
{
    private readonly IUserRepository _userRepository;

    public VerifyOtpCommandHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<VerifyOtpResult> Handle(
        VerifyOtpCommand  request,
        CancellationToken cancellationToken)
    {
        var normalisedEmail = request.Email.Trim().ToLowerInvariant();

        // ── 1. Find the user by email ─────────────────────────────────────────
        var user = await _userRepository.FindByEmailAsync(normalisedEmail, cancellationToken);

        if (user is null)
            return new VerifyOtpResult(false, "Không tìm thấy tài khoản với địa chỉ email này.");

        // ── 2. Reject already-confirmed accounts ──────────────────────────────
        if (user.IsEmailConfirmed)
            return new VerifyOtpResult(false, "Tài khoản này đã được xác thực trước đó.");

        // ── 3. Check OTP existence and expiry ─────────────────────────────────
        if (!user.HasActiveOtp())
            return new VerifyOtpResult(false, "Mã OTP không tồn tại hoặc đã hết hạn. Vui lòng yêu cầu gửi lại.");

        // ── 4. Verify OTP hash — BCrypt constant-time compare ─────────────────
        // user.OtpCode is the BCrypt hash stored during registration.
        // BCrypt.Verify performs a constant-time comparison to resist timing attacks.
        var isOtpValid = BCrypt.Net.BCrypt.Verify(request.OtpCode, user.OtpCode!);

        if (!isOtpValid)
            return new VerifyOtpResult(false, "Mã OTP không chính xác. Vui lòng kiểm tra lại.");

        // ── 5. Confirm email & clear OTP (entity enforces the business rule) ───
        var confirmed = user.ConfirmEmail();
        if (!confirmed)
        {
            // ConfirmEmail() can return false if OTP expired between step 3 and now
            // (edge case under heavy load — race condition guard).
            return new VerifyOtpResult(false, "Mã OTP đã hết hạn trong quá trình xử lý. Vui lòng yêu cầu gửi lại.");
        }

        // ── 6. Persist the confirmed state ────────────────────────────────────
        await _userRepository.UpdateAsync(user, cancellationToken);

        return new VerifyOtpResult(true, "Xác thực email thành công! Tài khoản của bạn đã được kích hoạt.");
    }
}
