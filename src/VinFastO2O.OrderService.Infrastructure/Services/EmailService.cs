using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using VinFastO2O.OrderService.Application.Common.Interfaces;
using VinFastO2O.OrderService.Infrastructure.Settings;

namespace VinFastO2O.OrderService.Infrastructure.Services;

/// <summary>
/// Production SMTP email service using MailKit and MimeKit.
/// Sends branded OTP verification emails for the VinFast O2O platform.
/// </summary>
public sealed class EmailService : IEmailService
{
    private readonly EmailSettings _settings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IOptions<EmailSettings> options, ILogger<EmailService> logger)
    {
        _settings = options.Value;
        _logger   = logger;
    }

    /// <inheritdoc/>
    public async Task SendOtpEmailAsync(
        string toEmail,
        string otpCode,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(toEmail,  nameof(toEmail));
        ArgumentException.ThrowIfNullOrWhiteSpace(otpCode,  nameof(otpCode));

        var message = BuildOtpMessage(toEmail, otpCode);

        using var client = new SmtpClient();
        client.Timeout = _settings.TimeoutSeconds * 1_000; // SmtpClient.Timeout is in ms

        try
        {
            _logger.LogInformation(
                "[EmailService] Connecting to SMTP — Host: {Host}:{Port} | TLS: {Ssl}",
                _settings.Host, _settings.Port, _settings.UseSsl);

            // SecureSocketOptions.Auto: picks STARTTLS (587) or SSL (465) automatically.
            // Override with StartTls / SslOnConnect when UseSsl is explicitly set.
            var socketOption = _settings.UseSsl
                ? SecureSocketOptions.SslOnConnect
                : SecureSocketOptions.StartTls;

            await client.ConnectAsync(_settings.Host, _settings.Port, socketOption, cancellationToken);
            await client.AuthenticateAsync(_settings.Username, _settings.Password, cancellationToken);

            await client.SendAsync(message, cancellationToken);
            await client.DisconnectAsync(quit: true, cancellationToken);

            _logger.LogInformation(
                "[EmailService] OTP email SENT — Recipient: {Email}",
                // Mask the local part for privacy in logs: user@domain → u***@domain
                MaskEmail(toEmail));
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("[EmailService] Send operation was cancelled — Recipient: {Email}", MaskEmail(toEmail));
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "[EmailService] Failed to send OTP email — Recipient: {Email} | SMTP: {Host}:{Port}",
                MaskEmail(toEmail), _settings.Host, _settings.Port);
            throw;
        }
    }

    /// <inheritdoc/>
    public async Task SendDepositConfirmationEmailAsync(
        string toEmail,
        string customerName,
        Guid orderId,
        string vehicleModel,
        decimal amount,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(toEmail, nameof(toEmail));

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_settings.FromName, _settings.FromAddress));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = "Xác nhận đặt cọc thành công xe VinFast";

        var qrUrl = $"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={orderId}";

        var bodyBuilder = new BodyBuilder
        {
            HtmlBody = $"""
            <!DOCTYPE html>
            <html lang="vi">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>Đặt cọc thành công VinFast</title>
            </head>
            <body style="margin:0;padding:0;background-color:#f4f4f7;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f4f7;">
                <tr>
                  <td align="center" style="padding:40px 16px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">
                      <tr>
                        <td style="background:linear-gradient(135deg,#002E5D 0%,#0057B8 100%);padding:28px 40px;text-align:center;">
                          <h2 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">VinFast E-Commerce</h2>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:40px 48px 32px;">
                          <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#10b981;line-height:1.3;">✓ ĐẶT CỌC THÀNH CÔNG</h1>
                          <p style="margin:0 0 20px;font-size:15px;color:#555e6d;line-height:1.6;">
                            Kính chào <strong>{customerName}</strong>,<br/><br/>
                            VinFast chân thành cảm ơn Quý khách đã đặt cọc xe điện trực tuyến. Yêu cầu đặt cọc của Quý khách đã được xử lý thành công.
                          </p>
                          
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f8fafc;border-radius:8px;margin-bottom:28px;padding:16px;">
                            <tr>
                              <td style="font-size:14px;color:#475569;line-height:1.8;">
                                <strong>Mã đơn hàng:</strong> {orderId}<br/>
                                <strong>Mẫu xe điện:</strong> {vehicleModel}<br/>
                                <strong>Số tiền cọc:</strong> {amount:N0} VND<br/>
                                <strong>Trạng thái:</strong> <span style="color:#10b981;font-weight:bold;">Đã thanh toán (PAID)</span>
                              </td>
                            </tr>
                          </table>

                          <div style="text-align:center;margin-bottom:28px;">
                            <p style="font-size:14px;font-weight:bold;color:#1e293b;margin-bottom:12px;">MÃ QR NHẬN XE TẠI QUẦY</p>
                            <img src="{qrUrl}" width="200" height="200" style="border:1px solid #e2e8f0;border-radius:8px;padding:8px;" alt="Mã QR Nhận Xe" />
                            <p style="font-size:12px;color:#64748b;margin-top:8px;">Vui lòng trình mã QR này cho nhân viên showroom khi nhận xe.</p>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:20px 48px 32px;text-align:center;border-top:1px solid #e9ecef;">
                          <p style="margin:0;font-size:12px;color:#adb5bd;">© {DateTime.UtcNow.Year} VinFast Trading &amp; Investment Co., Ltd.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """,
            TextBody = $"""
            XÁC NHẬN ĐẶT CỌC THÀNH CÔNG
            
            Kính chào {customerName},
            Cảm ơn bạn đã đặt cọc xe điện VinFast.
            
            Chi tiết giao dịch:
            - Mã đơn hàng: {orderId}
            - Mẫu xe: {vehicleModel}
            - Số tiền cọc: {amount:N0} VND
            - Trạng thái: Đã thanh toán (PAID)
            
            Vui lòng xuất trình mã đơn hàng này tại Showroom khi nhận xe.
            """
        };

        message.Body = bodyBuilder.ToMessageBody();

        using var client = new SmtpClient();
        client.Timeout = _settings.TimeoutSeconds * 1_000;

        try
        {
            var socketOption = _settings.UseSsl
                ? SecureSocketOptions.SslOnConnect
                : SecureSocketOptions.StartTls;

            await client.ConnectAsync(_settings.Host, _settings.Port, socketOption, cancellationToken);
            await client.AuthenticateAsync(_settings.Username, _settings.Password, cancellationToken);
            await client.SendAsync(message, cancellationToken);
            await client.DisconnectAsync(quit: true, cancellationToken);

            _logger.LogInformation("[EmailService] Deposit confirmation email SENT — Recipient: {Email}", MaskEmail(toEmail));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[EmailService] Failed to send deposit confirmation email to: {Email}", MaskEmail(toEmail));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    private MimeMessage BuildOtpMessage(string toEmail, string otpCode)
    {
        var message = new MimeMessage();

        message.From.Add(new MailboxAddress(_settings.FromName, _settings.FromAddress));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = "Mã xác thực VinFast O2O của bạn";

        // Provide a plain-text fallback for email clients that don't render HTML.
        var bodyBuilder = new BodyBuilder
        {
            HtmlBody  = BuildHtmlBody(otpCode),
            TextBody  = BuildTextBody(otpCode)
        };

        message.Body = bodyBuilder.ToMessageBody();
        return message;
    }

    private static string BuildHtmlBody(string otpCode) => $"""
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Xác thực tài khoản VinFast O2O</title>
        </head>
        <body style="margin:0;padding:0;background-color:#f4f4f7;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">

          <!-- ── Outer wrapper ── -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                 style="background-color:#f4f4f7;">
            <tr>
              <td align="center" style="padding:40px 16px;">

                <!-- ── Email card ── -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                       style="max-width:560px;background:#ffffff;border-radius:12px;
                              box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">

                  <!-- ── Header / Brand bar ── -->
                  <tr>
                    <td style="background:linear-gradient(135deg,#002E5D 0%,#0057B8 100%);
                                padding:28px 40px;text-align:center;">
                      <!-- VinFast wordmark (SVG inline — no external image dependency) -->
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 52"
                           width="160" height="38" aria-label="VinFast">
                        <rect width="220" height="52" rx="6" fill="none"/>
                        <!-- Stylised "VF" monogram -->
                        <polygon points="12,8 30,8 22,32 14,32" fill="#FFFFFF" opacity="0.95"/>
                        <polygon points="22,8 40,8 32,32 24,32" fill="#00A651" opacity="0.95"/>
                        <!-- "VinFast" text -->
                        <text x="48" y="36" font-family="'Segoe UI',Arial,sans-serif"
                              font-size="26" font-weight="700" fill="#FFFFFF"
                              letter-spacing="1">VinFast</text>
                        <!-- "O2O" tag -->
                        <text x="166" y="36" font-family="'Segoe UI',Arial,sans-serif"
                              font-size="14" font-weight="600" fill="#00A651"
                              letter-spacing="2">O2O</text>
                      </svg>
                    </td>
                  </tr>

                  <!-- ── Body ── -->
                  <tr>
                    <td style="padding:40px 48px 32px;">
                      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;
                                  color:#1a1a2e;line-height:1.3;">
                        Xác thực địa chỉ email
                      </h1>
                      <p style="margin:0 0 28px;font-size:15px;color:#555e6d;line-height:1.6;">
                        Chào mừng bạn đến với <strong>VinFast O2O</strong>!<br/>
                        Vui lòng sử dụng mã xác thực bên dưới để hoàn tất đăng ký tài khoản.
                      </p>

                      <!-- ── OTP display box ── -->
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td align="center" style="padding-bottom:28px;">
                            <div style="display:inline-block;
                                        background:linear-gradient(135deg,#f0f7ff 0%,#e8f4fd 100%);
                                        border:2px solid #0057B8;
                                        border-radius:12px;
                                        padding:20px 40px;">
                              <p style="margin:0 0 4px;font-size:12px;font-weight:600;
                                         letter-spacing:2px;text-transform:uppercase;color:#0057B8;">
                                MÃ XÁC THỰC CỦA BẠN
                              </p>
                              <p style="margin:0;font-size:46px;font-weight:800;
                                         letter-spacing:12px;color:#002E5D;
                                         font-family:'Courier New',monospace;">
                                {otpCode}
                              </p>
                            </div>
                          </td>
                        </tr>
                      </table>

                      <!-- ── Warning / expiry notice ── -->
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                             style="background:#fff8e1;border-left:4px solid #f59e0b;
                                    border-radius:0 8px 8px 0;margin-bottom:28px;">
                        <tr>
                          <td style="padding:14px 18px;">
                            <p style="margin:0;font-size:13.5px;color:#92400e;line-height:1.5;">
                              ⚠️ <strong>Lưu ý bảo mật:</strong> Mã này chỉ có hiệu lực trong
                              <strong>5 phút</strong> kể từ thời điểm gửi.<br/>
                              Không chia sẻ mã này với bất kỳ ai — nhân viên VinFast
                              sẽ <strong>không bao giờ</strong> yêu cầu mã OTP của bạn.
                            </p>
                          </td>
                        </tr>
                      </table>

                      <p style="margin:0;font-size:14px;color:#8892a4;line-height:1.6;">
                        Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.
                        Tài khoản của bạn vẫn hoàn toàn an toàn.
                      </p>
                    </td>
                  </tr>

                  <!-- ── Divider ── -->
                  <tr>
                    <td style="padding:0 48px;">
                      <hr style="border:none;border-top:1px solid #e9ecef;margin:0;"/>
                    </td>
                  </tr>

                  <!-- ── Footer ── -->
                  <tr>
                    <td style="padding:20px 48px 32px;text-align:center;">
                      <p style="margin:0 0 4px;font-size:12px;color:#adb5bd;">
                        © {DateTime.UtcNow.Year} VinFast Trading &amp; Investment Co., Ltd.
                      </p>
                      <p style="margin:0;font-size:12px;color:#adb5bd;">
                        Đây là email tự động, vui lòng không trả lời trực tiếp.
                      </p>
                    </td>
                  </tr>

                </table>
                <!-- /Email card -->

              </td>
            </tr>
          </table>

        </body>
        </html>
        """;

    private static string BuildTextBody(string otpCode) =>
        $"""
        ═══════════════════════════════════════
          VinFast O2O — Xác thực địa chỉ email
        ═══════════════════════════════════════

        Mã xác thực (OTP) của bạn là:

            {otpCode}

        ⚠  Mã này chỉ có hiệu lực trong 5 phút.
           Không chia sẻ mã này với bất kỳ ai.

        Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.

        © {DateTime.UtcNow.Year} VinFast Trading & Investment Co., Ltd.
        """;

    /// <summary>Masks the local part of an email for safe log output.</summary>
    private static string MaskEmail(string email)
    {
        var atIndex = email.IndexOf('@');
        if (atIndex <= 1) return "***";
        return $"{email[0]}***{email[atIndex..]}";
    }
}
