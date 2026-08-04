using Microsoft.AspNetCore.SignalR;
using VinFastO2O.OrderService.API.Hubs;
using VinFastO2O.OrderService.Application.Common.Interfaces;

namespace VinFastO2O.OrderService.API.Services;

public class NotificationService : INotificationService
{
    private readonly IHubContext<NotificationHub> _hubContext;

    public NotificationService(IHubContext<NotificationHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task SendPersonalNotificationAsync(Guid customerId, string message)
    {
        // Gửi qua Group riêng của CustomerId
        await _hubContext.Clients.Group($"customer_{customerId.ToString().ToLowerInvariant()}").SendAsync("ReceiveNotification", message);
        
        // Gửi qua UserIdentifier mặc định của SignalR
        await _hubContext.Clients.User(customerId.ToString()).SendAsync("ReceiveNotification", message);
    }

    public async Task BroadcastNotificationAsync(string message)
    {
        // Phát thông báo tới toàn bộ Client đang kết nối
        await _hubContext.Clients.All.SendAsync("ReceiveBroadcast", message);
    }
}
