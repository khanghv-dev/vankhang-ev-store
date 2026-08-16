namespace EvO2O.OrderService.Application.Common.Interfaces;

/// <summary>
/// Contract for the transactional email delivery service.
/// Implementations live in the Infrastructure layer (MailKit/SMTP).
/// </summary>
public interface IEmailService
{
    /// <summary>
    /// Sends a one-time password (OTP) email to the specified address.
    /// The OTP must already be generated and hashed by the caller before
    /// calling this method; this service only transmits the raw 6-digit code.
    /// </summary>
    /// <param name="toEmail">Recipient email address (validated by the caller).</param>
    /// <param name="otpCode">Plain 6-digit OTP to display in the email body.</param>
    /// <param name="cancellationToken">Propagates notification that the operation should be cancelled.</param>
    Task SendOtpEmailAsync(
        string toEmail,
        string otpCode,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Sends a deposit confirmation email with order details and a QR code for pickup.
    /// </summary>
    Task SendDepositConfirmationEmailAsync(
        string toEmail,
        string customerName,
        Guid orderId,
        string vehicleModel,
        decimal amount,
        CancellationToken cancellationToken = default);
}
