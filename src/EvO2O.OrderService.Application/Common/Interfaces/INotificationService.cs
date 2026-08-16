namespace EvO2O.OrderService.Application.Common.Interfaces;

public interface INotificationService
{
    Task SendPersonalNotificationAsync(Guid customerId, string message);
    Task BroadcastNotificationAsync(string message);
}
