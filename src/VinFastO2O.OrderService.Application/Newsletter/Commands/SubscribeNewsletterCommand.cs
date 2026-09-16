using System;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using VinFastO2O.OrderService.Application.Common.Interfaces;
using VinFastO2O.OrderService.Domain.Entities;

namespace VinFastO2O.OrderService.Application.Newsletter.Commands;

// ── Request DTO / Command ───────────────────────────────────────────────────
public record SubscribeNewsletterCommand(string Email) : IRequest<SubscribeNewsletterResult>;

public record SubscribeNewsletterResult(bool Success, string Message);

// ── Command Handler ──────────────────────────────────────────────────────────
public sealed class SubscribeNewsletterCommandHandler 
    : IRequestHandler<SubscribeNewsletterCommand, SubscribeNewsletterResult>
{
    private readonly INewsletterRepository _newsletterRepository;
    
    // Regular expression for basic email validation
    private static readonly Regex EmailRegex = new(
        @"^[^@\s]+@[^@\s]+\.[^@\s]+$", 
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    public SubscribeNewsletterCommandHandler(INewsletterRepository newsletterRepository)
    {
        _newsletterRepository = newsletterRepository;
    }

    public async Task<SubscribeNewsletterResult> Handle(
        SubscribeNewsletterCommand request, 
        CancellationToken cancellationToken)
    {
        // 1. Validate Null or Empty
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return new SubscribeNewsletterResult(false, "Email không được để trống.");
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        // 2. Validate Regex Email format
        if (!EmailRegex.IsMatch(normalizedEmail))
        {
            return new SubscribeNewsletterResult(false, "Định dạng email không hợp lệ.");
        }

        // 3. Check if email already exists in the database
        var isDuplicate = await _newsletterRepository.ExistsByEmailAsync(normalizedEmail, cancellationToken);
        if (isDuplicate)
        {
            return new SubscribeNewsletterResult(false, "Email này đã đăng ký nhận tin trước đó.");
        }

        // 4. Save to Database
        var newSubscriber = new NewsletterSubscriber(Guid.NewGuid(), normalizedEmail);
        await _newsletterRepository.AddAsync(newSubscriber, cancellationToken);

        return new SubscribeNewsletterResult(true, "Đăng ký nhận thông tin ưu đãi thành công!");
    }
}
