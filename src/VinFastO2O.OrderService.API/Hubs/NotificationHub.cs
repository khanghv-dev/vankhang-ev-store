using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace VinFastO2O.OrderService.API.Hubs;

public class NotificationHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
    }

    /// <summary>
    /// Cho phép Client đăng ký nhận thông báo cá nhân theo CustomerId.
    /// Client sẽ tham gia vào một SignalR Group riêng biệt.
    /// </summary>
    public async Task RegisterCustomer(string customerId)
    {
        if (Guid.TryParse(customerId, out var _))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"customer_{customerId.ToLowerInvariant()}");
        }
    }
}
