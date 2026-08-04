using VinFastO2O.OrderService.Application;
using VinFastO2O.OrderService.Infrastructure;
using VinFastO2O.OrderService.Application.Common.Interfaces;
using VinFastO2O.OrderService.Application.DTOs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();
builder.Services.AddResponseCompression(options => { options.EnableForHttps = true; });

builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.AllowAnyHeader()
              .AllowAnyMethod()
              .SetIsOriginAllowed(_ => true)
              .AllowCredentials();
    });
});

// Register Clean Architecture layers
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);
builder.Services.AddControllers();
builder.Services.AddScoped<INotificationService, VinFastO2O.OrderService.API.Services.NotificationService>();

// Policy-Based Authorization services
builder.Services.AddAuthorization();
builder.Services.AddSingleton<Microsoft.AspNetCore.Authorization.IAuthorizationPolicyProvider, VinFastO2O.OrderService.API.Authentication.PermissionPolicyProvider>();
builder.Services.AddSingleton<Microsoft.AspNetCore.Authorization.IAuthorizationHandler, VinFastO2O.OrderService.API.Authentication.PermissionAuthorizationHandler>();

// Register Health Checks
builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("DefaultConnection")!, name: "PostgreSQL", tags: new[] { "ready" })
    .AddRedis(builder.Configuration.GetConnectionString("RedisConnection") ?? "localhost:6379", name: "Redis", tags: new[] { "ready" });

// Real-time IoT Telemetry Simulator
builder.Services.AddHostedService<VinFastO2O.OrderService.API.Services.TelemetrySimulatorService>();
builder.Services.AddHostedService<VinFastO2O.OrderService.API.Services.OutboxPublisherBackgroundService>();

var app = builder.Build();

// Security Headers Middleware
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["X-XSS-Protection"] = "1; mode=block";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    context.Response.Headers.Remove("X-Powered-By");
    await next();
});

app.UseResponseCompression();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseStaticFiles();           // serves wwwroot/auth.html → GET /auth.html
app.UseCors("CorsPolicy");

app.UseWebSockets();

app.UseMiddleware<VinFastO2O.OrderService.API.Authentication.PermissionAuthorizationMiddleware>();
app.UseAuthorization();
app.MapControllers();

// Seed Database with real showrooms, faqs, articles
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<VinFastO2O.OrderService.Infrastructure.Persistence.OrderDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    await VinFastO2O.OrderService.Infrastructure.Persistence.DbSeeder.SeedAsync(db, logger);
}

// Map Health Checks
app.MapHealthChecks("/health", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = _ => false
});
app.MapHealthChecks("/health/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready")
});

// Map SignalR Hubs (supporting both plural and singular endpoint routes)
app.MapHub<VinFastO2O.OrderService.API.Hubs.NotificationHub>("/hubs/notification");
app.MapHub<VinFastO2O.OrderService.API.Hubs.NotificationHub>("/hub/notifications");

// Orders API
var ordersApi = app.MapGroup("/api/orders");

ordersApi.MapPost("/", async (CreateOrderDto dto, IOrderService orderService) =>
{
    try
    {
        var result = await orderService.CreateBookingOrderAsync(dto);
        return Results.CreatedAtRoute("GetOrderById", new { id = result.Id }, result);
    }
    catch (ArgumentException ex)
    {
        return Results.BadRequest(new { message = ex.Message });
    }
})
.WithName("CreateOrder")
.WithOpenApi();

ordersApi.MapPost("/deposit", async (
    VinFastO2O.OrderService.Application.Orders.Commands.CreateDepositOrderCommand command, 
    MediatR.IMediator mediator) =>
{
    try
    {
        var result = await mediator.Send(command);
        return Results.CreatedAtRoute("GetOrderById", new { id = result.Id }, result);
    }
    catch (InvalidOperationException ex)
    {
        return Results.Conflict(new { message = ex.Message });
    }
    catch (ArgumentException ex)
    {
        return Results.BadRequest(new { message = ex.Message });
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
})
.WithName("CreateDepositOrder")
.WithOpenApi();

ordersApi.MapGet("/my-orders", async (
    [Microsoft.AspNetCore.Mvc.FromQuery] string? phone,
    [Microsoft.AspNetCore.Mvc.FromQuery] string? email,
    VinFastO2O.OrderService.Infrastructure.Persistence.OrderDbContext db) =>
{
    var queryable = db.Orders.AsNoTracking().Include(o => o.Items).AsQueryable();
    if (!string.IsNullOrWhiteSpace(phone))
    {
        queryable = queryable.Where(o => o.CustomerPhone == phone.Trim());
    }
    else if (!string.IsNullOrWhiteSpace(email))
    {
        queryable = queryable.Where(o => o.CustomerEmail.ToLower() == email.Trim().ToLower());
    }
    else
    {
        // Mặc định lấy danh sách đơn cọc mới nhất để hiển thị
        queryable = queryable.Take(20);
    }

    var list = await queryable.OrderByDescending(o => o.CreatedAt).ToListAsync();
    return Results.Ok(list);
})
.WithName("GetMyOrders")
.WithOpenApi();

ordersApi.MapGet("/lookup", async (
    [Microsoft.AspNetCore.Mvc.FromQuery] string query,
    VinFastO2O.OrderService.Infrastructure.Persistence.OrderDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(query))
    {
        return Results.BadRequest(new { message = "Query parameter is required." });
    }

    var cleanQuery = query.Trim().ToLower();
    VinFastO2O.OrderService.Domain.ValueObjects.OrderId? queryOrderId = null;
    if (Guid.TryParse(cleanQuery, out var parsedGuid))
    {
        queryOrderId = new VinFastO2O.OrderService.Domain.ValueObjects.OrderId(parsedGuid);
    }

    var order = await db.Orders.AsNoTracking()
        .Include(o => o.Items)
        .Where(o => o.CustomerPhone.ToLower() == cleanQuery || (queryOrderId != null && o.Id == queryOrderId))
        .OrderByDescending(o => o.CreatedAt)
        .FirstOrDefaultAsync();

    if (order is null)
    {
        return Results.NotFound(new { message = "Không tìm thấy đơn hàng đặt cọc." });
    }

    int milestone = 0;
    var statusStr = order.Status.ToString();
    if (statusStr == "Paid")
    {
        milestone = 0;
        var firstItem = order.Items.FirstOrDefault();
        if (firstItem != null && !string.IsNullOrEmpty(firstItem.AssignedVin))
        {
            milestone = 1;
        }
    }
    else if (statusStr == "Preparing")
    {
        milestone = 2;
    }
    else if (statusStr == "Ready" || statusStr == "Delivered")
    {
        milestone = 3;
    }

    var showroom = await db.Showrooms.FindAsync(order.StoreId);
    var showroomName = showroom != null ? $"{showroom.Name}, {showroom.Address}" : "VinFast Showroom Việt Nam";

    var result = new
    {
        orderId = order.Id.Value.ToString(),
        phone = order.CustomerPhone,
        vehicleName = order.Items.FirstOrDefault()?.ProductName ?? "Xe máy điện VinFast",
        color = "Tiêu chuẩn",
        vin = order.Items.FirstOrDefault()?.AssignedVin ?? "",
        showroom = showroomName,
        depositDate = order.PaidAt?.ToString("dd/MM/yyyy") ?? order.CreatedAt.ToString("dd/MM/yyyy"),
        depositAmount = order.DepositAmount,
        depositType = order.DepositType.ToString() == "LinhHoat" ? "Linh hoạt" : "Cam kết",
        currentMilestone = milestone,
        status = statusStr
    };

    return Results.Ok(result);
})
.WithName("LookupOrder")
.WithOpenApi();

ordersApi.MapGet("/{id:guid}", async (Guid id, IOrderService orderService) =>
{
    var result = await orderService.GetOrderByIdAsync(id);
    return result is not null ? Results.Ok(result) : Results.NotFound();
})
.WithName("GetOrderById")
.WithOpenApi();

ordersApi.MapPost("/{id:guid}/payment", async (Guid id, IOrderService orderService, IVnPayService vnPayService, IConfiguration configuration, HttpContext httpContext) =>
{
    var order = await orderService.GetOrderByIdAsync(id);
    if (order is null)
    {
        return Results.NotFound(new { message = "Order not found." });
    }

    if (order.Status != "Pending")
    {
        return Results.BadRequest(new { message = $"Cannot pay order in current status: {order.Status}" });
    }

    var baseServerUrl = $"{httpContext.Request.Scheme}://{httpContext.Request.Host}";
    var tmnCode = configuration["VnPay:TmnCode"] ?? "VF_O2O_DEV";
    var hashSecret = configuration["VnPay:HashSecret"] ?? "SUPER_SECRET_VNPAY_HASH_KEY_998877665544332211";

    var ipAddress = httpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
    var paymentUrl = vnPayService.CreatePaymentUrl(order, ipAddress, baseServerUrl, hashSecret, tmnCode);

    return Results.Ok(new { paymentUrl });
})
.WithName("CreatePaymentUrl")
.WithOpenApi();

ordersApi.MapPost("/{id:guid}/prepare", async (Guid id, IOrderRepository orderRepository) =>
{
    var order = await orderRepository.GetByIdAsync(new VinFastO2O.OrderService.Domain.ValueObjects.OrderId(id));
    if (order is null) return Results.NotFound(new { message = "Order not found." });

    try
    {
        order.Prepare();
        await orderRepository.UpdateAsync(order);
        return Results.Ok(new { message = "Order is now in PREPARING status.", status = order.Status.ToString() });
    }
    catch (InvalidOperationException ex)
    {
        return Results.BadRequest(new { message = ex.Message });
    }
})
.WithName("PrepareOrder")
.WithOpenApi();

ordersApi.MapPost("/{id:guid}/deliver", async (Guid id, IOrderRepository orderRepository) =>
{
    var order = await orderRepository.GetByIdAsync(new VinFastO2O.OrderService.Domain.ValueObjects.OrderId(id));
    if (order is null) return Results.NotFound(new { message = "Order not found." });

    try
    {
        order.Deliver();
        await orderRepository.UpdateAsync(order);
        return Results.Ok(new { message = "Order is now in DELIVERED status.", status = order.Status.ToString() });
    }
    catch (InvalidOperationException ex)
    {
        return Results.BadRequest(new { message = ex.Message });
    }
})
.WithName("DeliverOrder")
.WithOpenApi();

// Mock Payment Gateway Endpoint
app.MapGet("/api/payments/mock-gate", async (HttpContext httpContext, IVnPayService vnPayService, IOrderService orderService, IConfiguration configuration) =>
{
    var query = httpContext.Request.Query;
    var parameters = query.ToDictionary(q => q.Key, q => q.Value.ToString());

    if (!parameters.TryGetValue("vnp_SecureHash", out var secureHash))
    {
        return Results.BadRequest("Missing vnp_SecureHash parameter.");
    }

    var hashSecret = configuration["VnPay:HashSecret"] ?? "SUPER_SECRET_VNPAY_HASH_KEY_998877665544332211";
    var isValid = vnPayService.VerifySignature(parameters, secureHash, hashSecret);
    if (!isValid)
    {
        return Results.BadRequest("Chữ ký thanh toán không hợp lệ (Invalid SecureHash).");
    }

    if (!parameters.TryGetValue("vnp_TxnRef", out var vnp_TxnRef) || !Guid.TryParse(vnp_TxnRef, out var orderId))
    {
        return Results.BadRequest("Invalid vnp_TxnRef parameter.");
    }

    var order = await orderService.GetOrderByIdAsync(orderId);
    if (order is null)
    {
        return Results.NotFound($"Order with ID {orderId} not found.");
    }

    var amountStr = parameters["vnp_Amount"];
    var tmnCode = parameters["vnp_TmnCode"];

    // Pre-calculate Webhook Callbacks (IPN) with computed valid secure hashes
    var successParams = new Dictionary<string, string>
    {
        { "vnp_TxnRef", orderId.ToString() },
        { "vnp_Amount", amountStr },
        { "vnp_ResponseCode", "00" },
        { "vnp_TmnCode", tmnCode },
        { "vnp_TransactionNo", "12345678" },
        { "vnp_OrderInfo", $"Thanh toan dat coc cho don hang {orderId}" }
    };
    var successHash = vnPayService.CalculateHash(successParams, hashSecret);
    var successWebhookUrl = $"/api/PaymentWebhook/vnpay-ipn?vnp_TxnRef={orderId}&vnp_Amount={amountStr}&vnp_ResponseCode=00&vnp_TmnCode={tmnCode}&vnp_TransactionNo=12345678&vnp_OrderInfo={Uri.EscapeDataString($"Thanh toan dat coc cho don hang {orderId}")}&vnp_SecureHash={successHash}";

    var cancelParams = new Dictionary<string, string>
    {
        { "vnp_TxnRef", orderId.ToString() },
        { "vnp_Amount", amountStr },
        { "vnp_ResponseCode", "24" },
        { "vnp_TmnCode", tmnCode },
        { "vnp_TransactionNo", "00000000" },
        { "vnp_OrderInfo", $"Thanh toan dat coc cho don hang {orderId}" }
    };
    var cancelHash = vnPayService.CalculateHash(cancelParams, hashSecret);
    var cancelWebhookUrl = $"/api/PaymentWebhook/vnpay-ipn?vnp_TxnRef={orderId}&vnp_Amount={amountStr}&vnp_ResponseCode=24&vnp_TmnCode={tmnCode}&vnp_TransactionNo=00000000&vnp_OrderInfo={Uri.EscapeDataString($"Thanh toan dat coc cho don hang {orderId}")}&vnp_SecureHash={cancelHash}";

    var baseServerUrl = $"{httpContext.Request.Scheme}://{httpContext.Request.Host}";
    var returnUrl = configuration["VnPay:ReturnUrl"] ?? $"{baseServerUrl}/api/payments/vnpay-return";

    var depositAmountStr = order.DepositAmount.ToString("N0", new System.Globalization.CultureInfo("vi-VN"));

    var vinOrModel = order.Items.FirstOrDefault()?.AssignedVin ?? order.Items.FirstOrDefault()?.ProductName ?? "N/A";
    var html = GetMockGateHtml(order.Id.ToString(), order.CustomerName, order.CustomerPhone, vinOrModel, depositAmountStr, successWebhookUrl, cancelWebhookUrl, returnUrl);

    return Results.Content(html, "text/html", System.Text.Encoding.UTF8);
});

// VNPAY Webhook (IPN) Endpoint
app.MapGet("/api/payments/vnpay-webhook", async (HttpContext httpContext, IVnPayService vnPayService, IOrderService orderService, IConfiguration configuration) =>
{
    var query = httpContext.Request.Query;
    var parameters = query.ToDictionary(q => q.Key, q => q.Value.ToString());

    if (!parameters.TryGetValue("vnp_SecureHash", out var secureHash))
    {
        return Results.Json(new { RspCode = "97", Message = "Missing signature" });
    }

    var hashSecret = configuration["VnPay:HashSecret"] ?? "SUPER_SECRET_VNPAY_HASH_KEY_998877665544332211";
    var isValid = vnPayService.VerifySignature(parameters, secureHash, hashSecret);
    if (!isValid)
    {
        return Results.Json(new { RspCode = "97", Message = "Invalid signature" });
    }

    if (!parameters.TryGetValue("vnp_TxnRef", out var vnp_TxnRef) || !Guid.TryParse(vnp_TxnRef, out var orderId))
    {
        return Results.Json(new { RspCode = "99", Message = "Invalid order reference" });
    }

    if (!parameters.TryGetValue("vnp_Amount", out var vnp_Amount) || !long.TryParse(vnp_Amount, out var amountRaw))
    {
        return Results.Json(new { RspCode = "99", Message = "Invalid amount" });
    }

    var responseCode = parameters.GetValueOrDefault("vnp_ResponseCode", "99");
    var amount = (decimal)amountRaw / 100;

    try
    {
        var transactionNo = parameters.GetValueOrDefault("vnp_TransactionNo", Guid.NewGuid().ToString());
        var isProcessed = await orderService.ProcessPaymentWebhookAsync(orderId, amount, transactionNo, responseCode, gatewayResponse: null);
        if (isProcessed)
        {
            var order = await orderService.GetOrderByIdAsync(orderId);
            if (order != null)
            {
                var hubContext = httpContext.RequestServices.GetRequiredService<IHubContext<VinFastO2O.OrderService.API.Hubs.NotificationHub>>();
                await hubContext.Clients.All.SendAsync("ReceiveOrderPaidNotification", new
                {
                    OrderId = order.Id,
                    CustomerName = order.CustomerName,
                    AssignedVin = order.Items.FirstOrDefault()?.AssignedVin,
                    DepositAmount = order.DepositAmount,
                    PaidAt = order.PaidAt ?? DateTime.UtcNow
                });
            }

            return Results.Json(new { RspCode = "00", Message = "Confirm success" });
        }
        else
        {
            return Results.Json(new { RspCode = "02", Message = "Order already confirmed or failed response code" });
        }
    }
    catch (KeyNotFoundException)
    {
        return Results.Json(new { RspCode = "01", Message = "Order not found" });
    }
    catch (InvalidOperationException ex)
    {
        if (ex.Message.Contains("Incorrect payment amount"))
        {
            return Results.Json(new { RspCode = "04", Message = "Invalid amount" });
        }
        return Results.Json(new { RspCode = "02", Message = "Order already confirmed" });
    }
    catch (Exception ex)
    {
        return Results.Json(new { RspCode = "99", Message = "System error: " + ex.Message });
    }
});

app.MapGet("/api/payments/vnpay-return", (HttpContext httpContext) =>
{
    var query = httpContext.Request.Query;
    var orderId = query.TryGetValue("vnp_TxnRef", out var txnRefVal) ? txnRefVal.ToString() : "Unknown";
    var responseCode = query.TryGetValue("vnp_ResponseCode", out var codeVal) ? codeVal.ToString() : "99";

    var isSuccess = responseCode == "00";
    var statusIcon = isSuccess 
        ? "<div class=\"icon-circle icon-success\">✓</div>" 
        : "<div class=\"icon-circle icon-fail\">✗</div>";
    var statusTitle = isSuccess ? "Thanh toán thành công" : "Thanh toán thất bại";
    var statusDesc = isSuccess 
        ? "Giao dịch đặt cọc trực tuyến của bạn đã hoàn tất.<br>Đơn hàng hiện đã được cập nhật trạng thái đã thanh toán."
        : "Giao dịch thanh toán đã bị hủy hoặc không thành công.<br>Vui lòng thử lại hoặc liên hệ hỗ trợ.";
    var statusText = isSuccess ? "ĐÃ THANH TOÁN (PAID)" : "THẤT BẠI / ĐÃ HỦY";
    var statusColor = isSuccess ? "#10b981" : "#f43f5e";

    var html = GetReturnHtml(orderId, statusIcon, statusTitle, statusDesc, statusText, statusColor);

    return Results.Content(html, "text/html", System.Text.Encoding.UTF8);
});

// Newsletter API
var newsletterApi = app.MapGroup("/api/newsletter");

newsletterApi.MapPost("/subscribe", async (
    [Microsoft.AspNetCore.Mvc.FromBody] VinFastO2O.OrderService.Application.DTOs.SubscribeNewsletterRequest request,
    MediatR.IMediator mediator) =>
{
    var command = new VinFastO2O.OrderService.Application.Newsletter.Commands.SubscribeNewsletterCommand(request.Email);
    var result = await mediator.Send(command);
    if (!result.Success)
    {
        return Results.BadRequest(new { message = result.Message });
    }
    return Results.Ok(new { message = result.Message });
})
.WithName("SubscribeNewsletter")
.WithOpenApi();

app.MapControllers();

app.Run();

// HTML templates for the payment mockup
static string GetMockGateHtml(string orderId, string customerName, string customerPhone, string vin, string depositAmountStr, string successWebhookUrl, string cancelWebhookUrl, string returnUrl)
{
    return $$"""
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>VNPAY Gateway - VinFast Mockup</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
                font-family: 'Outfit', sans-serif;
            }
            body {
                background: radial-gradient(circle at center, #0f172a, #020617);
                color: #f8fafc;
                min-height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
                overflow-x: hidden;
            }
            .container {
                width: 100%;
                max-width: 580px;
                background: rgba(30, 41, 59, 0.45);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 24px;
                padding: 40px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
                position: relative;
            }
            .logo-section {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo-text {
                font-size: 28px;
                font-weight: 700;
                letter-spacing: 2px;
                background: linear-gradient(to right, #3b82f6, #60a5fa);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            .logo-sub {
                font-size: 12px;
                color: #94a3b8;
                letter-spacing: 4px;
                text-transform: uppercase;
                margin-top: 4px;
            }
            .card {
                background: rgba(15, 23, 42, 0.6);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 16px;
                padding: 24px;
                margin-bottom: 30px;
            }
            .card-title {
                font-size: 14px;
                color: #3b82f6;
                font-weight: 600;
                margin-bottom: 16px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 12px;
                font-size: 15px;
            }
            .info-row:last-child {
                margin-bottom: 0;
            }
            .label {
                color: #94a3b8;
            }
            .value {
                font-weight: 500;
                color: #f1f5f9;
            }
            .value.vin {
                font-family: monospace;
                font-size: 16px;
                color: #60a5fa;
                letter-spacing: 0.5px;
            }
            .amount-highlight {
                font-size: 24px;
                font-weight: 700;
                color: #10b981;
            }
            .form-group {
                margin-bottom: 24px;
            }
            .form-label {
                display: block;
                font-size: 14px;
                color: #94a3b8;
                margin-bottom: 8px;
                font-weight: 500;
            }
            .select-input {
                width: 100%;
                background: rgba(15, 23, 42, 0.8);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: #f1f5f9;
                padding: 14px;
                border-radius: 10px;
                font-size: 15px;
                outline: none;
                cursor: pointer;
                transition: all 0.3s;
            }
            .select-input:focus {
                border-color: #3b82f6;
                box-shadow: 0 0 10px rgba(59, 130, 246, 0.25);
            }
            .btn {
                display: block;
                width: 100%;
                padding: 16px;
                border-radius: 12px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                text-align: center;
                border: none;
                margin-bottom: 12px;
                text-decoration: none;
            }
            .btn-success {
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
            }
            .btn-success:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(16, 185, 129, 0.45);
                background: linear-gradient(135deg, #34d399, #059669);
            }
            .btn-cancel {
                background: transparent;
                border: 1px solid rgba(244, 63, 94, 0.4);
                color: #f43f5e;
            }
            .btn-cancel:hover {
                background: rgba(244, 63, 94, 0.08);
                border-color: #f43f5e;
                transform: translateY(-2px);
            }
            .spinner-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(15, 23, 42, 0.9);
                border-radius: 24px;
                display: none;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 10;
            }
            .spinner {
                width: 50px;
                height: 50px;
                border: 4px solid rgba(59, 130, 246, 0.1);
                border-left-color: #3b82f6;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 20px;
            }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            .success-card {
                display: none;
                text-align: center;
            }
            .success-icon {
                width: 72px;
                height: 72px;
                background: rgba(16, 185, 129, 0.15);
                border: 2px solid #10b981;
                border-radius: 50%;
                display: flex;
                justify-content: center;
                align-items: center;
                margin: 0 auto 24px;
                color: #10b981;
                font-size: 36px;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Spinner Overlay -->
            <div id="spinner-overlay" class="spinner-overlay">
                <div class="spinner"></div>
                <div style="font-size: 16px; color: #94a3b8; font-weight: 500;">Đang xử lý giao dịch...</div>
            </div>

            <!-- Normal Card Payment Gate -->
            <div id="payment-card">
                <div class="logo-section">
                    <div class="logo-text">VNPAY GATEWAY</div>
                    <div class="logo-sub">VinFast Mockup System</div>
                </div>

                <div class="card">
                    <div class="card-title">Thông tin giao dịch</div>
                    <div class="info-row">
                        <span class="label">Mã đơn hàng</span>
                        <span class="value" id="order-id-label">{{orderId}}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Khách hàng</span>
                        <span class="value">{{customerName}}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Số điện thoại</span>
                        <span class="value">{{customerPhone}}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Số VIN đặt cọc</span>
                        <span class="value vin">{{vin}}</span>
                    </div>
                    <div class="info-row" style="margin-top: 16px; padding-top: 16px; border-top: 1px dashed rgba(255,255,255,0.1);">
                        <span class="label" style="align-self: center;">Số tiền thanh toán</span>
                        <span class="value amount-highlight">{{depositAmountStr}} VND</span>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label" for="bank">Chọn ngân hàng thanh toán</label>
                    <select class="select-input" id="bank">
                        <option value="NCB">NCB - Ngân hàng Quốc dân (Mặc định test)</option>
                        <option value="VIETCOMBANK">VIETCOMBANK - Ngân hàng Ngoại thương</option>
                        <option value="TECHCOMBANK">TECHCOMBANK - Ngân hàng Kỹ thương</option>
                        <option value="VIETINBANK">VIETINBANK - Ngân hàng Công thương</option>
                        <option value="BIDV">BIDV - Ngân hàng Đầu tư và Phát triển</option>
                    </select>
                </div>

                <button onclick="processPayment('{{successWebhookUrl}}', true)" class="btn btn-success" id="btn-confirm">
                    Xác nhận thanh toán (Success)
                </button>
                <button onclick="processPayment('{{cancelWebhookUrl}}', false)" class="btn btn-cancel" id="btn-cancel">
                    Hủy giao dịch (Cancel)
                </button>
            </div>

            <!-- Success Screen -->
            <div id="success-card" class="success-card">
                <div class="success-icon">✓</div>
                <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 12px; color: #f8fafc;">Giao dịch thành công</h2>
                <p style="color: #94a3b8; font-size: 15px; margin-bottom: 30px; line-height: 1.6;">
                    Hệ thống đã xác thực thông tin và cập nhật trạng thái đơn hàng.<br>
                    Đang chuyển hướng về website VinFast...
                </p>
            </div>
        </div>

        <script>
            const returnUrl = "{{returnUrl}}";

            async function processPayment(webhookUrl, isSuccess) {
                const spinner = document.getElementById('spinner-overlay');
                spinner.style.display = 'flex';

                try {
                    // Simulate processing delay
                    await new Promise(resolve => setTimeout(resolve, 1500));

                    const response = await fetch(webhookUrl);
                    const data = await response.json();

                    spinner.style.display = 'none';

                    if (data.RspCode === '00' || data.RspCode === '02') {
                        if (isSuccess) {
                            document.getElementById('payment-card').style.display = 'none';
                            document.getElementById('success-card').style.display = 'block';

                            setTimeout(() => {
                                window.location.href = returnUrl + "?vnp_TxnRef={{orderId}}&vnp_ResponseCode=00";
                            }, 2500);
                        } else {
                            window.location.href = returnUrl + "?vnp_TxnRef={{orderId}}&vnp_ResponseCode=24";
                        }
                    } else {
                        alert('Lỗi từ webhook IPN: ' + data.Message);
                    }
                } catch (err) {
                    spinner.style.display = 'none';
                    alert('Lỗi kết nối tới webhook: ' + err.message);
                }
            }
        </script>
    </body>
    </html>
    """;
}

static string GetReturnHtml(string orderId, string statusIcon, string statusTitle, string statusDesc, string statusText, string statusColor)
{
    return $$"""
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Kết quả thanh toán - VinFast O2O</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
                font-family: 'Outfit', sans-serif;
            }
            body {
                background: radial-gradient(circle at center, #0f172a, #020617);
                color: #f8fafc;
                min-height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
            }
            .container {
                width: 100%;
                max-width: 500px;
                background: rgba(30, 41, 59, 0.45);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 24px;
                padding: 40px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
                text-align: center;
            }
            .icon-circle {
                width: 72px;
                height: 72px;
                border-radius: 50%;
                display: flex;
                justify-content: center;
                align-items: center;
                margin: 0 auto 24px;
                font-size: 32px;
            }
            .icon-success {
                background: rgba(16, 185, 129, 0.15);
                border: 2px solid #10b981;
                color: #10b981;
            }
            .icon-fail {
                background: rgba(244, 63, 94, 0.15);
                border: 2px solid #f43f5e;
                color: #f43f5e;
            }
            h2 {
                font-size: 24px;
                font-weight: 700;
                margin-bottom: 12px;
            }
            .desc {
                color: #94a3b8;
                font-size: 15px;
                margin-bottom: 30px;
                line-height: 1.6;
            }
            .card {
                background: rgba(15, 23, 42, 0.6);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 16px;
                padding: 20px;
                margin-bottom: 30px;
                text-align: left;
            }
            .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                font-size: 14px;
            }
            .info-row:last-child {
                margin-bottom: 0;
            }
            .label {
                color: #94a3b8;
            }
            .value {
                font-weight: 500;
                color: #f1f5f9;
            }
            .btn {
                display: inline-block;
                background: linear-gradient(135deg, #3b82f6, #2563eb);
                color: white;
                padding: 14px 28px;
                border-radius: 12px;
                font-size: 15px;
                font-weight: 600;
                text-decoration: none;
                transition: all 0.3s;
                box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
            }
            .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(59, 130, 246, 0.45);
                background: linear-gradient(135deg, #60a5fa, #2563eb);
            }
        </style>
    </head>
    <body>
        <div class="container">
            {{statusIcon}}
            <h2>{{statusTitle}}</h2>
            <p class="desc">{{statusDesc}}</p>
            
            <div class="card">
                <div class="info-row">
                    <span class="label">Mã giao dịch (TxnRef)</span>
                    <span class="value">{{orderId}}</span>
                </div>
                <div class="info-row">
                    <span class="label">Trạng thái thanh toán</span>
                    <span class="value" style="color: {{statusColor}}; font-weight: 600;">{{statusText}}</span>
                </div>
            </div>
            
            <a href="http://localhost:3000/tra-cuu-coc?id={{orderId}}" class="btn">Quay lại Hệ thống Tra Cứu</a>
        </div>
    </body>
    </html>
    """;
}
