using EvO2O.OrderService.Application.DTOs;

namespace EvO2O.OrderService.Application.Common.Interfaces;

public interface IOrderService
{
    Task<OrderDto> CreateBookingOrderAsync(CreateOrderDto dto, CancellationToken cancellationToken = default);
    Task<OrderDto?> GetOrderByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> ProcessPaymentWebhookAsync(Guid orderId, decimal amount, string transactionNo, string responseCode, string? gatewayResponse = null, CancellationToken cancellationToken = default);
}
