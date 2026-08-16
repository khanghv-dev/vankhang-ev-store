using System;

namespace EvO2O.OrderService.Domain.Entities;

/// <summary>
/// Domain entity representing a customer subscribed to the newsletter.
/// </summary>
public sealed class NewsletterSubscriber
{
    // ── Primary Key ───────────────────────────────────────────────────────────
    public Guid Id { get; private set; }

    // ── Subscription Details ──────────────────────────────────────────────────
    public string Email { get; private set; }
    public DateTime SubscribedAt { get; private set; }
    public bool IsActive { get; private set; }

    // ── EF Core Constructor ───────────────────────────────────────────────────
    private NewsletterSubscriber()
    {
        Email = string.Empty;
    }

    // ── Factory Constructor ───────────────────────────────────────────────────
    public NewsletterSubscriber(Guid id, string email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new ArgumentException("Email không được để trống.", nameof(email));
        }

        Id = id;
        Email = email.Trim().ToLowerInvariant();
        SubscribedAt = DateTime.UtcNow;
        IsActive = true;
    }

    // ── Domain Behaviours ─────────────────────────────────────────────────────
    public void Unsubscribe()
    {
        IsActive = false;
    }

    public void Resubscribe()
    {
        IsActive = true;
        SubscribedAt = DateTime.UtcNow;
    }
}
