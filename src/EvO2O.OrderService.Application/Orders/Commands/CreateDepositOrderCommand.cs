using MediatR;
using EvO2O.OrderService.Application.Common.Interfaces;
using EvO2O.OrderService.Application.DTOs;
using EvO2O.OrderService.Domain.Entities;
using EvO2O.OrderService.Domain.Enums;
using EvO2O.OrderService.Domain.ValueObjects;

namespace EvO2O.OrderService.Application.Orders.Commands;

public record CreateDepositOrderCommand(
    Guid CustomerId,
    string CustomerName,
    string CustomerEmail,
    string CustomerPhone,
    string CustomerIdCard,
    Guid ProductId,
    Guid StoreId,
    decimal DepositAmount,
    DepositType DepositType = DepositType.LinhHoat,
    BatteryOption BatteryOption = BatteryOption.MuaPin
) : IRequest<OrderDto>;

public class CreateDepositOrderCommandHandler : IRequestHandler<CreateDepositOrderCommand, OrderDto>
{
    private readonly IOrderRepository _orderRepository;
    private readonly IInventoryQueryService _inventoryQueryService;
    private readonly IVehicleLockService _vehicleLockService;

    public CreateDepositOrderCommandHandler(
        IOrderRepository orderRepository,
        IInventoryQueryService inventoryQueryService,
        IVehicleLockService vehicleLockService)
    {
        _orderRepository = orderRepository;
        _inventoryQueryService = inventoryQueryService;
        _vehicleLockService = vehicleLockService;
    }

    public async Task<OrderDto> Handle(CreateDepositOrderCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // 1. Tìm chiếc xe đầu tiên thuộc ProductId tại StoreId đang có trạng thái AVAILABLE
            var vehicle = await _inventoryQueryService.GetFirstAvailableVehicleAsync(request.ProductId, request.StoreId, cancellationToken);
            if (vehicle == null)
            {
                throw new InvalidOperationException("Hết hàng tại Showroom này");
            }

            // 2. Lấy số VIN và gọi RedisLockService để khóa chiếc xe đó trong 15 phút (900 giây)
            var lockTtl = TimeSpan.FromMinutes(15);
            var isLocked = await _vehicleLockService.AcquireVehicleLockAsync(vehicle.Vin, lockTtl);
            if (!isLocked)
            {
                throw new InvalidOperationException("Xe đang có giao dịch khác, vui lòng thử lại");
            }

            // 3. Tạo bản ghi Order và OrderItem trong cơ sở dữ liệu với trạng thái PENDING và gán tạm thời số VIN
            var orderId = OrderId.New();
            var order = new Order(
                orderId,
                request.CustomerId,
                request.CustomerName,
                request.CustomerEmail,
                request.CustomerPhone,
                request.CustomerIdCard,
                request.StoreId,
                vehicle.Price,        // Tổng số tiền bằng giá xe
                request.DepositAmount,
                request.DepositType,
                request.BatteryOption
            );

            var orderItem = new OrderItem(
                OrderItemId.New(),
                orderId,
                request.ProductId,
                vehicle.ModelName,
                vehicle.Price,
                1                      // Đặt cọc 1 chiếc xe
            );

            // Gán số VIN cho item
            orderItem.AssignVin(vehicle.Vin);
            order.AddItem(orderItem);

            // Chuyển trạng thái Draft -> Pending (Chờ thanh toán)
            order.Submit();

            // Lưu đơn hàng vào cơ sở dữ liệu
            await _orderRepository.AddAsync(order, cancellationToken);

            return MapToDto(order);
        }
        catch (Exception ex) when (ex is not InvalidOperationException)
        {
            // Logging can be added here
            throw new Exception($"Lỗi hệ thống khi tạo đơn đặt cọc: {ex.Message}", ex);
        }
    }

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
