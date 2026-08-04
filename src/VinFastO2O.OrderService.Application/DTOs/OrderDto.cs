namespace VinFastO2O.OrderService.Application.DTOs;

public class OrderDto
{
    public Guid   Id            { get; set; }
    public Guid   CustomerId    { get; set; }
    public string CustomerName  { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string CustomerIdCard { get; set; } = string.Empty;

    public Guid   StoreId       { get; set; }

    public decimal TotalAmount   { get; set; }
    public decimal DepositAmount { get; set; }
    public string  DepositType   { get; set; } = string.Empty;
    public string  BatteryOption { get; set; } = string.Empty;

    public string  Status        { get; set; } = string.Empty;

    public List<OrderItemDto> Items    { get; set; } = [];
    public List<PaymentDto>   Payments { get; set; } = [];

    public DateTime  CreatedAt   { get; set; }
    public DateTime? PaidAt      { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string?   CancellationReason { get; set; }
}

public class OrderItemDto
{
    public Guid    Id          { get; set; }
    public Guid    ProductId   { get; set; }
    public string  ProductName { get; set; } = string.Empty;
    public decimal UnitPrice   { get; set; }
    public int     Quantity    { get; set; }
    public decimal LineTotal   { get; set; }
    public string? AssignedVin { get; set; }
}

public class PaymentDto
{
    public Guid      Id            { get; set; }
    public string    TransactionNo { get; set; } = string.Empty;
    public decimal   Amount        { get; set; }
    public string    PaymentMethod { get; set; } = string.Empty;
    public string    Status        { get; set; } = string.Empty;
    public DateTime? PaidAt        { get; set; }
}
