using VinFastO2O.OrderService.Domain.Entities;
using VinFastO2O.OrderService.Domain.ValueObjects;

namespace VinFastO2O.OrderService.Application.Common.Interfaces;

public interface IOrderRepository
{
    Task<Order?> GetByIdAsync(OrderId id, CancellationToken cancellationToken = default);
    Task AddAsync(Order order, CancellationToken cancellationToken = default);
    Task UpdateAsync(Order order, CancellationToken cancellationToken = default);
}
