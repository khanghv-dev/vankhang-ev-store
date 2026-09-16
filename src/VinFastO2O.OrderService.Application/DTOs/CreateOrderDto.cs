using VinFastO2O.OrderService.Domain.Enums;

namespace VinFastO2O.OrderService.Application.DTOs;

public class CreateOrderDto
{
    public Guid   CustomerId    { get; set; }
    public string CustomerName  { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string CustomerIdCard { get; set; } = string.Empty;

    public Guid StoreId { get; set; }

    public decimal       TotalAmount   { get; set; }
    public decimal       DepositAmount { get; set; }
    public DepositType   DepositType   { get; set; } = DepositType.LinhHoat;
    public BatteryOption BatteryOption { get; set; } = BatteryOption.MuaPin;

    public List<CreateOrderItemDto> Items { get; set; } = [];
}

public class CreateOrderItemDto
{
    public Guid    ProductId   { get; set; }
    public string  ProductName { get; set; } = string.Empty;
    public decimal UnitPrice   { get; set; }
    public int     Quantity    { get; set; } = 1;
}
