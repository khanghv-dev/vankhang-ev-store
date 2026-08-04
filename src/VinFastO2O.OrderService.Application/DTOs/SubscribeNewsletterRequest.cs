namespace VinFastO2O.OrderService.Application.DTOs;

/// <summary>
/// Data transfer object for the newsletter subscription request.
/// </summary>
public class SubscribeNewsletterRequest
{
    public string Email { get; set; } = string.Empty;
}
