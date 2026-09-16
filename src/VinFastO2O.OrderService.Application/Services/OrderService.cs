using MassTransit;
using VinFastO2O.OrderService.Application.Common.Interfaces;
using VinFastO2O.OrderService.Application.DTOs;
using VinFastO2O.OrderService.Domain.Entities;
using VinFastO2O.OrderService.Domain.ValueObjects;
using VinFastO2O.Shared.Events;

namespace VinFastO2O.OrderService.Application.Services;

public class OrderService : IOrderService
{
    private readonly IOrderRepository _repository;
    private readonly ITopicProducer<string, OrderPaidEvent> _topicProducer;

    public OrderService(IOrderRepository repository, ITopicProducer<string, OrderPaidEvent> topicProducer)
    {
        _repository    = repository;
        _topicProducer = topicProducer;
    }

    public async Task<OrderDto> CreateBookingOrderAsync(CreateOrderDto dto, CancellationToken cancellationToken = default)
    {
        var orderId = OrderId.New();

        var order = new Order(
            orderId,
            dto.CustomerId,
            dto.CustomerName,
            dto.CustomerEmail,
            dto.CustomerPhone,
            dto.CustomerIdCard,
            dto.StoreId,
            dto.TotalAmount,
            dto.DepositAmount,
            dto.DepositType,
            dto.BatteryOption
        );

        foreach (var itemDto in dto.Items)
        {
            var item = new OrderItem(
                OrderItemId.New(),
                orderId,
                itemDto.ProductId,
                itemDto.ProductName,
                itemDto.UnitPrice,
                itemDto.Quantity
            );
            order.AddItem(item);
        }

        // Transition Draft → Pending (awaiting payment)
        order.Submit();

        await _repository.AddAsync(order, cancellationToken);

        return MapToDto(order);
    }

    public async Task<OrderDto?> GetOrderByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var order = await _repository.GetByIdAsync(new OrderId(id), cancellationToken);
        return order == null ? null : MapToDto(order);
    }

    public async Task<bool> ProcessPaymentWebhookAsync(
        Guid   orderId,
        decimal amount,
        string  transactionNo,
        string  responseCode,
        string? gatewayResponse    = null,
        CancellationToken cancellationToken = default)
    {
        var order = await _repository.GetByIdAsync(new OrderId(orderId), cancellationToken)
            ?? throw new KeyNotFoundException($"Order with ID {orderId} was not found.");

        if (order.DepositAmount != amount)
            throw new InvalidOperationException(
                $"Incorrect payment amount. Expected {order.DepositAmount}, but received {amount}.");

        if (order.Status == Domain.Enums.OrderStatus.Paid)
            return true;    // Already processed — idempotent

        var payment = new Payment(
            PaymentId.New(),
            order.Id,
            transactionNo,
            amount,
            Domain.Enums.PaymentMethod.VNPay   // resolved from gateway in production
        );

        if (responseCode == "00")
        {
            payment.MarkAsSuccess(gatewayResponse);
            order.AddPayment(payment);
            order.MarkAsPaid();
            await _repository.UpdateAsync(order, cancellationToken);

            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(TimeSpan.FromSeconds(2));
            try
            {
                await _topicProducer.Produce(
                    order.Id.Value.ToString(),
                    new OrderPaidEvent(
                        order.Id.Value,
                        order.Items.FirstOrDefault()?.AssignedVin ?? string.Empty,
                        order.DepositAmount,
                        order.PaidAt ?? DateTime.UtcNow
                    ),
                    cts.Token);
            }
            catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
            {
                Console.WriteLine("[Warning] Kafka broker connection timed out. Event order-paid was not published.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Warning] Failed to produce Kafka event: {ex.Message}");
            }

            return true;
        }

        payment.MarkAsFailed(gatewayResponse);
        order.AddPayment(payment);
        await _repository.UpdateAsync(order, cancellationToken);
        return false;
    }

    // ── Mapping ──────────────────────────────────────────────────────────────

    private static OrderDto MapToDto(Order order) => new()
    {
        Id             = order.Id.Value,
        CustomerId     = order.CustomerId,
        CustomerName   = order.CustomerName,
        CustomerEmail  = order.CustomerEmail,
        CustomerPhone  = order.CustomerPhone,
        CustomerIdCard = order.CustomerIdCard,
        StoreId        = order.StoreId,
        TotalAmount    = order.TotalAmount,
        DepositAmount  = order.DepositAmount,
        DepositType    = order.DepositType.ToString(),
        BatteryOption  = order.BatteryOption.ToString(),
        Status         = order.Status.ToString(),
        CancellationReason = order.CancellationReason,
        CreatedAt      = order.CreatedAt,
        PaidAt         = order.PaidAt,
        CancelledAt    = order.CancelledAt,
        Items = order.Items.Select(i => new OrderItemDto
        {
            Id          = i.Id.Value,
            ProductId   = i.ProductId,
            ProductName = i.ProductName,
            UnitPrice   = i.UnitPrice,
            Quantity    = i.Quantity,
            LineTotal   = i.LineTotal,
            AssignedVin = i.AssignedVin,
        }).ToList(),
        Payments = order.Payments.Select(p => new PaymentDto
        {
            Id            = p.Id.Value,
            TransactionNo = p.TransactionNo,
            Amount        = p.Amount,
            PaymentMethod = p.PaymentMethod.ToString(),
            Status        = p.Status.ToString(),
            PaidAt        = p.PaidAt,
        }).ToList(),
    };
}
