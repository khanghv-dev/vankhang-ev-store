using Serilog;
using VinFastO2O.InventoryService.API.Middleware;
using VinFastO2O.InventoryService.Application;
using VinFastO2O.InventoryService.Infrastructure;
using VinFastO2O.InventoryService.Application.Common.Interfaces;
using VinFastO2O.InventoryService.Application.DTOs;
using MediatR;
using VinFastO2O.InventoryService.Application.Products.Commands;
using VinFastO2O.InventoryService.Domain.Entities;
using VinFastO2O.InventoryService.Infrastructure.Persistence;
using MongoDB.Driver;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.EntityFrameworkCore;

var configuration = new ConfigurationBuilder()
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
    .AddJsonFile($"appsettings.{Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"}.json", optional: true)
    .AddEnvironmentVariables()
    .Build();

Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(configuration)
    .CreateLogger();

try
{
    Log.Information("Starting VinFastO2O.InventoryService Web Host...");
    
    var builder = WebApplication.CreateBuilder(args);

    // Integrate Serilog
    builder.Host.UseSerilog();

    // Add services to the container.
    builder.Services.AddCors(options =>
    {
        options.AddDefaultPolicy(policy =>
        {
            policy.WithOrigins("http://localhost:3000")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
    });
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();
    builder.Services.AddGrpc();
    builder.Services.AddResponseCompression(options => { options.EnableForHttps = true; });

    // Register Clean Architecture Layers
    builder.Services.AddApplicationServices();
    builder.Services.AddInfrastructureServices(builder.Configuration);

    // Register MediatR scan for both Application and Infrastructure assemblies
    builder.Services.AddMediatR(cfg => {
        cfg.RegisterServicesFromAssembly(typeof(VinFastO2O.InventoryService.Application.DependencyInjection).Assembly);
        cfg.RegisterServicesFromAssembly(typeof(VinFastO2O.InventoryService.Infrastructure.DependencyInjection).Assembly);
    });

    // Register Global Exception Handling Middleware
    builder.Services.AddTransient<GlobalExceptionHandlingMiddleware>();

    // Register Health Checks
    builder.Services.AddHealthChecks()
        .AddNpgSql(builder.Configuration.GetConnectionString("DefaultConnection")!, name: "PostgreSQL", tags: new[] { "ready" })
        .AddRedis(builder.Configuration.GetConnectionString("RedisConnection") ?? "localhost:6379", name: "Redis", tags: new[] { "ready" })
        .AddMongoDb(builder.Configuration.GetConnectionString("MongoConnection") ?? "mongodb://localhost:27017", name: "MongoDB", tags: new[] { "ready" });

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

    // Register Custom Global Exception Handling Middleware
    app.UseMiddleware<GlobalExceptionHandlingMiddleware>();

    app.UseCors();

    // Configure the HTTP request pipeline.
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    app.UseHttpsRedirection();

    // Map Health Checks
    app.MapHealthChecks("/health", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
    {
        Predicate = _ => false
    });
    app.MapHealthChecks("/health/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
    {
        Predicate = check => check.Tags.Contains("ready")
    });

    // Map gRPC service for IoT telemetry
    app.MapGrpcService<VinFastO2O.InventoryService.API.Grpc.TelemetryIngestionGrpcService>();

    // Battery Monitoring Endpoints (Real-time MongoDB Telemetry Logs)
    var batteryApi = app.MapGroup("/api/battery");

    batteryApi.MapGet("/stations/monitoring", async (
        IBatteryStationService batteryService,
        CancellationToken cancellationToken) =>
    {
        var stations = await batteryService.GetRealtimeStationStatusAsync(cancellationToken);
        return Results.Ok(stations);
    })
    .WithName("GetRealtimeBatteryStationMonitoring")
    .WithOpenApi();

    // Inventory Endpoints
    var inventoryApi = app.MapGroup("/api/inventory");

    inventoryApi.MapGet("/showrooms/available-stock", async (
        [Microsoft.AspNetCore.Mvc.FromQuery] Guid? showroomId,
        [Microsoft.AspNetCore.Mvc.FromQuery] string? modelName,
        IVehicleInventoryQueries queries,
        CancellationToken cancellationToken) =>
    {
        var stock = await queries.GetShowroomAvailableStockAsync(showroomId, modelName, cancellationToken);
        return Results.Ok(stock);
    })
    .WithName("GetShowroomAvailableStock")
    .WithOpenApi();

    inventoryApi.MapGet("/", async (IInventoryService inventoryService) =>
    {
        var items = await inventoryService.GetAllAsync();
        return Results.Ok(items);
    })
    .WithName("GetAllInventoryItems")
    .WithOpenApi();

    inventoryApi.MapGet("/{id:guid}", async (Guid id, IInventoryService inventoryService) =>
    {
        var item = await inventoryService.GetByIdAsync(id);
        return item is not null ? Results.Ok(item) : Results.NotFound();
    })
    .WithName("GetInventoryItemById")
    .WithOpenApi();

    inventoryApi.MapGet("/sku/{sku}", async (string sku, IInventoryService inventoryService) =>
    {
        var item = await inventoryService.GetBySkuAsync(sku);
        return item is not null ? Results.Ok(item) : Results.NotFound();
    })
    .WithName("GetInventoryItemBySku")
    .WithOpenApi();

    inventoryApi.MapPost("/", async (CreateInventoryRequest request, IInventoryService inventoryService) =>
    {
        try
        {
            var item = await inventoryService.CreateAsync(request.Sku, request.Name, request.Quantity, request.Location);
            return Results.CreatedAtRoute("GetInventoryItemById", new { id = item.Id }, item);
        }
        catch (InvalidOperationException ex)
        {
            return Results.Conflict(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return Results.BadRequest(new { message = ex.Message });
        }
    })
    .WithName("CreateInventoryItem")
    .WithOpenApi();

    inventoryApi.MapPut("/{id:guid}/quantity", async (Guid id, UpdateQuantityRequest request, IInventoryService inventoryService) =>
    {
        try
        {
            await inventoryService.UpdateQuantityAsync(id, request.Quantity);
            return Results.NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return Results.NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return Results.BadRequest(new { message = ex.Message });
        }
    })
    .WithName("UpdateInventoryItemQuantity")
    .WithOpenApi();

    // Vehicle Inventory Dapper Queries Endpoints
    var vehicleInventoryApi = app.MapGroup("/api/inventory/vehicles");

    vehicleInventoryApi.MapGet("/reports/count-by-store", async (IVehicleInventoryQueries queries) =>
    {
        var counts = await queries.GetInventoryCountByStoreAsync();
        return Results.Ok(counts);
    })
    .WithName("GetInventoryCountByStore")
    .WithOpenApi();

    vehicleInventoryApi.MapGet("/reports/details", async (IVehicleInventoryQueries queries) =>
    {
        var details = await queries.GetVehicleInventoryDetailsAsync();
        return Results.Ok(details);
    })
    .WithName("GetVehicleInventoryDetails")
    .WithOpenApi();

    vehicleInventoryApi.MapPost("/reserve", async (
        ReserveVehicleRequest request, 
        IVehicleAllocationService allocationService) =>
    {
        try
        {
            var result = await allocationService.ReserveVehicleAsync(request.ProductId, request.StoreId, "System");
            return Results.Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return Results.NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Results.Conflict(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return Results.BadRequest(new { message = ex.Message });
        }
    })
    .WithName("ReserveVehicle")
    .WithOpenApi();

    // Catalog API (Mongo + Redis Cache-Aside)
    var catalogApi = app.MapGroup("/api/catalog");

    catalogApi.MapGet("/homepage-vehicle-models", async (ICatalogService catalogService) =>
    {
        var models = await catalogService.GetHomepageVehicleModelsAsync();
        return Results.Ok(models);
    })
    .WithName("GetHomepageVehicleModels")
    .WithOpenApi();

    catalogApi.MapGet("/detail/{modelName}", async (string modelName, IProductDetailService productDetailService) =>
    {
        var detail = await productDetailService.GetProductDetailByNameAsync(modelName);
        return detail is not null ? Results.Ok(detail) : Results.NotFound(new { message = $"Product '{modelName}' not found." });
    })
    .WithName("GetProductDetail")
    .WithOpenApi();

    app.MapGet("/api/products", async (string? category, IProductService productService, CancellationToken cancellationToken) =>
    {
        var products = await productService.GetProductsByCategoryAsync(category, cancellationToken);
        return Results.Ok(products);
    })
    .WithName("GetProducts")
    .WithOpenApi();

    app.MapGet("/api/admin/products", async (
        string? name, 
        string? category, 
        bool? isActive, 
        int? pageNumber, 
        int? pageSize, 
        IAdminProductQueries queries, 
        CancellationToken cancellationToken) =>
    {
        var page = pageNumber ?? 1;
        var size = pageSize ?? 10;
        var result = await queries.GetAdminProductsAsync(name, category, isActive, page, size, cancellationToken);
        return Results.Ok(result);
    })
    .WithName("GetAdminProducts")
    .WithOpenApi();

    app.MapPost("/api/admin/products/electric", async (
        CreateElectricMotorcycleCommand command,
        IMediator mediator,
        CancellationToken cancellationToken) =>
    {
        try
        {
            var sku = await mediator.Send(command, cancellationToken);
            return Results.Created($"/api/catalog/detail/{sku}", sku);
        }
        catch (ArgumentException ex)
        {
            return Results.BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Results.Conflict(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Error creating electric motorcycle.");
            return Results.StatusCode(500);
        }
    })
    .WithName("CreateElectricMotorcycle")
    .WithOpenApi();

    app.MapPost("/api/admin/products/upload-image", async (
        IFormFile file,
        IImageStorageService storageService,
        CancellationToken cancellationToken) =>
    {
        if (file == null || file.Length == 0)
        {
            return Results.BadRequest(new { message = "Không tìm thấy file ảnh tải lên." });
        }

        // Limit size to 5MB (5 * 1024 * 1024 bytes)
        var maxSizeBytes = 5 * 1024 * 1024;
        if (file.Length > maxSizeBytes)
        {
            return Results.BadRequest(new { message = "Kích thước file ảnh vượt quá giới hạn cho phép (tối đa 5MB)." });
        }

        try
        {
            using var stream = file.OpenReadStream();
            var publicUrl = await storageService.UploadImageAsync(stream, file.FileName, file.ContentType, cancellationToken);
            return Results.Ok(new { url = publicUrl });
        }
        catch (ArgumentException ex)
        {
            return Results.BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Lỗi khi tải ảnh sản phẩm lên S3/MinIO.");
            return Results.StatusCode(500);
        }
    })
    .WithName("UploadProductImage")
    .WithOpenApi()
    .DisableAntiforgery();

    app.MapPost("/api/admin/products/import-excel", async (
        IFormFile file,
        IMediator mediator,
        CancellationToken cancellationToken) =>
    {
        if (file == null || file.Length == 0)
        {
            return Results.BadRequest(new { message = "Không tìm thấy file Excel tải lên." });
        }

        var extension = Path.GetExtension(file.FileName)?.ToLowerInvariant();
        if (extension != ".xlsx" && extension != ".xls")
        {
            return Results.BadRequest(new { message = "Định dạng file không hỗ trợ. Vui lòng tải lên file Excel (.xlsx hoặc .xls)." });
        }

        try
        {
            using var stream = new MemoryStream();
            await file.CopyToAsync(stream, cancellationToken);
            stream.Position = 0;

            var command = new ImportProductsFromExcelCommand(stream);
            var result = await mediator.Send(command, cancellationToken);

            return Results.Ok(result);
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Lỗi xảy ra trong quá trình nhập Excel hàng loạt.");
            return Results.StatusCode(500);
        }
    })
    .WithName("ImportProductsFromExcel")
    .WithOpenApi()
    .DisableAntiforgery();

    app.MapPut("/api/admin/products/{sku}/price-discount", async (
        string sku,
        UpdatePriceDiscountRequest request,
        InventoryDbContext dbContext,
        IMongoClient mongoClient,
        IConfiguration configuration,
        IDistributedCache cache,
        CancellationToken cancellationToken) =>
    {
        var cleanSku = sku.Trim().ToLowerInvariant();

        // 1. Validation
        if (request.Price < 0)
        {
            return Results.BadRequest(new { message = "Giá không được nhỏ hơn 0." });
        }
        if (request.OriginalPrice.HasValue && request.OriginalPrice.Value < request.Price)
        {
            return Results.BadRequest(new { message = "Giá gốc không được nhỏ hơn giá bán." });
        }

        // 2. Update PostgreSQL Product
        var product = await dbContext.Products.FirstOrDefaultAsync(p => p.Id == cleanSku, cancellationToken);
        if (product == null)
        {
            return Results.NotFound(new { message = $"Không tìm thấy sản phẩm với SKU '{cleanSku}'." });
        }

        try
        {
            product.UpdatePriceAndDiscount(request.Price, request.OriginalPrice, request.DiscountText);
        }
        catch (ArgumentException ex)
        {
            return Results.BadRequest(new { message = ex.Message });
        }

        // 3. Update MongoDB VehicleModel (if exists)
        var dbName = configuration["MongoSettings:DatabaseName"] ?? "VinFastO2O_Catalog";
        var database = mongoClient.GetDatabase(dbName);
        var vehicleModels = database.GetCollection<VehicleModel>("vehicle_models");

        await vehicleModels.UpdateOneAsync(
            vm => vm.Id == cleanSku,
            Builders<VehicleModel>.Update.Set(vm => vm.BasePrice, request.Price),
            cancellationToken: cancellationToken);

        // Save PostgreSQL changes
        await dbContext.SaveChangesAsync(cancellationToken);

        // 4. Invalidate Redis Cache
        const string homepageCacheKey = "catalog:homepage_vehicle_models";
        await cache.RemoveAsync(homepageCacheKey, cancellationToken);
        Log.Information("Invalidated Redis cache key '{CacheKey}' after updating price for SKU: {Sku}", homepageCacheKey, cleanSku);

        return Results.Ok(new { 
            sku = cleanSku, 
            price = request.Price, 
            originalPrice = product.OriginalPrice,
            discountText = product.DiscountText,
            message = "Cập nhật giá xe và ưu đãi thành công. Cache đã được làm mới." 
        });
    })
    .WithName("UpdatePriceDiscount")
    .WithOpenApi();

    app.MapPut("/api/admin/products/{sku}", async (
        string sku,
        UpdateProductRequest request,
        InventoryDbContext dbContext,
        IMongoClient mongoClient,
        IConfiguration configuration,
        IDistributedCache cache,
        CancellationToken cancellationToken) =>
    {
        var cleanSku = sku.Trim().ToLowerInvariant();

        var product = await dbContext.Products.FirstOrDefaultAsync(p => p.Id == cleanSku, cancellationToken);
        if (product == null)
        {
            return Results.NotFound(new { message = $"Không tìm thấy sản phẩm với SKU '{cleanSku}'." });
        }

        // Update PostgreSQL Product fields
        try
        {
            product.UpdateDetails(request.Name, request.Price, request.OriginalPrice, request.Image, request.DiscountText);
        }
        catch (ArgumentException ex)
        {
            return Results.BadRequest(new { message = ex.Message });
        }

        // Update MongoDB VehicleModel if it exists
        var dbName = configuration["MongoSettings:DatabaseName"] ?? "VinFastO2O_Catalog";
        var database = mongoClient.GetDatabase(dbName);
        var vehicleModels = database.GetCollection<VehicleModel>("vehicle_models");

        await vehicleModels.UpdateOneAsync(
            vm => vm.Id == cleanSku,
            Builders<VehicleModel>.Update
                .Set(vm => vm.Name, request.Name ?? product.Name)
                .Set(vm => vm.BasePrice, request.Price)
                .Set(vm => vm.ImageUrl, request.Image ?? product.Image),
            cancellationToken: cancellationToken);

        // Save PostgreSQL changes
        await dbContext.SaveChangesAsync(cancellationToken);

        // Invalidate Redis Cache
        const string homepageCacheKey = "catalog:homepage_vehicle_models";
        await cache.RemoveAsync(homepageCacheKey, cancellationToken);

        return Results.Ok(new { 
            sku = cleanSku, 
            name = product.Name,
            price = product.Price, 
            image = product.Image,
            message = "Cập nhật sản phẩm thành công." 
        });
    })
    .WithName("UpdateProductDetails")
    .WithOpenApi();

    app.MapDelete("/api/admin/products/{sku}", async (
        string sku,
        IMediator mediator,
        CancellationToken cancellationToken) =>
    {
        try
        {
            var command = new SoftDeleteProductCommand(sku);
            await mediator.Send(command, cancellationToken);
            return Results.Ok(new { message = "Xóa mềm sản phẩm thành công." });
        }
        catch (ArgumentException ex)
        {
            return Results.BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Results.Conflict(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return Results.NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Lỗi xảy ra trong quá trình xóa mềm sản phẩm.");
            return Results.StatusCode(500);
        }
    })
    .WithName("SoftDeleteProduct")
    .WithOpenApi();

    // Smart Filter API (PostgreSQL + Dapper Dynamic SQL)
    var filterApi = app.MapGroup("/api/search");

    filterApi.MapGet("/vehicles", async (
        string? brand,
        decimal? priceMin,
        decimal? priceMax,
        string? batteryType,
        IVehicleFilterQueries filterQueries) =>
    {
        var result = await filterQueries.FilterVehiclesAsync(brand, priceMin, priceMax, batteryType);
        return Results.Ok(result);
    })
    .WithName("FilterVehicles")
    .WithOpenApi();

    // POS Showroom API
    var posApi = app.MapGroup("/api/pos");

    posApi.MapPost("/release", async (
        PosReleaseRequestDto request,
        IPosShowroomService showroomService) =>
    {
        var result = await showroomService.ReleaseVehicleAndActivateWarrantyAsync(request);
        if (result.Success)
        {
            return Results.Ok(result);
        }
        else
        {
            return Results.BadRequest(new { message = result.Message });
        }
    })
    .WithName("PosBarcodeRelease")
    .WithOpenApi();

    // Warranty Certificate Web View Endpoint
    app.MapGet("/api/warranty/certificate", (
        string vin,
        string customerName,
        string customerPhone,
        string modelName,
        string engineNumber,
        string storeName,
        string warrantyId,
        string activationDate,
        string expiryDate) =>
    {
        var html = GetWarrantyCertificateHtml(vin, customerName, customerPhone, modelName, engineNumber, storeName, warrantyId, activationDate, expiryDate);
        return Results.Content(html, "text/html", System.Text.Encoding.UTF8);
    })
    .WithName("GetWarrantyCertificate");

    app.Run();
}
catch (Exception ex) when (ex.GetType().Name != "HostAbortedException")
{
    Log.Fatal(ex, "Host terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

// HTML template for the electronic warranty certificate
static string GetWarrantyCertificateHtml(string vin, string customerName, string customerPhone, string modelName, string engineNumber, string storeName, string warrantyId, string activationDate, string expiryDate)
{
    return $$"""
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CHỨNG NHẬN BẢO HÀNH ĐIỆN TỬ - VINFAST</title>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }
            body {
                background: #090d16;
                color: #f1f5f9;
                font-family: 'Outfit', sans-serif;
                min-height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 40px 20px;
            }
            .certificate {
                background: radial-gradient(circle at 10% 20%, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.9) 90%);
                border: 4px double #d97706;
                border-radius: 16px;
                padding: 60px 50px;
                width: 100%;
                max-width: 800px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
                position: relative;
                overflow: hidden;
            }
            .certificate::before {
                content: '';
                position: absolute;
                top: 10px; left: 10px; right: 10px; bottom: 10px;
                border: 1px solid rgba(217, 119, 6, 0.3);
                pointer-events: none;
                border-radius: 8px;
            }
            .header {
                text-align: center;
                margin-bottom: 45px;
                position: relative;
            }
            .header h1 {
                font-family: 'Cinzel', serif;
                font-size: 30px;
                color: #f59e0b;
                letter-spacing: 3px;
                text-shadow: 0 2px 4px rgba(0,0,0,0.5);
                margin-bottom: 5px;
            }
            .header p {
                font-size: 13px;
                color: #94a3b8;
                letter-spacing: 5px;
                text-transform: uppercase;
            }
            .badge-logo {
                font-size: 48px;
                color: #d97706;
                margin-bottom: 15px;
                font-weight: bold;
                font-family: 'Cinzel', serif;
            }
            .subtitle {
                text-align: center;
                font-size: 18px;
                color: #e2e8f0;
                margin-bottom: 40px;
                font-weight: 400;
                line-height: 1.6;
            }
            .details-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 30px;
                margin-bottom: 50px;
            }
            .section {
                background: rgba(15, 23, 42, 0.4);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                padding: 24px;
            }
            .section-title {
                font-size: 13px;
                color: #f59e0b;
                text-transform: uppercase;
                letter-spacing: 2px;
                margin-bottom: 16px;
                font-weight: 600;
                border-bottom: 1px solid rgba(245, 158, 11, 0.2);
                padding-bottom: 8px;
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
                color: #f8fafc;
                font-weight: 500;
            }
            .value.highlight {
                font-family: monospace;
                color: #60a5fa;
                letter-spacing: 0.5px;
                font-size: 15px;
            }
            .footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-top: 1px solid rgba(255,255,255,0.08);
                padding-top: 35px;
                margin-top: 20px;
            }
            .signature-block {
                text-align: center;
                width: 200px;
            }
            .signature-title {
                font-size: 12px;
                color: #94a3b8;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 40px;
            }
            .signature-line {
                border-top: 1px solid rgba(255,255,255,0.2);
                padding-top: 8px;
                font-size: 14px;
                color: #e2e8f0;
                font-weight: 600;
            }
            .hologram-seal {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%);
                box-shadow: 0 0 15px rgba(245, 158, 11, 0.4);
                display: flex;
                justify-content: center;
                align-items: center;
                color: #0f172a;
                font-size: 10px;
                font-weight: 800;
                text-align: center;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                line-height: 1.2;
                border: 2px dashed rgba(255,255,255,0.4);
            }
            .btn-print {
                display: block;
                width: fit-content;
                margin: 30px auto 0;
                background: linear-gradient(135deg, #f59e0b, #d97706);
                color: #020617;
                padding: 12px 30px;
                border-radius: 8px;
                font-size: 15px;
                font-weight: 700;
                text-decoration: none;
                cursor: pointer;
                border: none;
                box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
                transition: all 0.3s;
            }
            .btn-print:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(245, 158, 11, 0.5);
            }
            @media print {
                body {
                    background: white;
                    color: black;
                    padding: 0;
                }
                .certificate {
                    box-shadow: none;
                    background: white;
                    color: black;
                    border-color: #d97706;
                    width: 100%;
                    max-width: 100%;
                }
                .certificate::before {
                    border-color: #d97706;
                }
                .section {
                    background: #f8fafc;
                    border-color: #e2e8f0;
                }
                .info-row {
                    border-bottom: 1px dotted #e2e8f0;
                    padding-bottom: 4px;
                }
                .label, .header p, .signature-title {
                    color: #475569;
                }
                .value, .subtitle, .header h1 {
                    color: black;
                }
                .btn-print {
                    display: none;
                }
            }
        </style>
    </head>
    <body>
        <div>
            <div class="certificate">
                <div class="header">
                    <div class="badge-logo">V</div>
                    <h1>CHỨNG NHẬN BẢO HÀNH</h1>
                    <p>Electronic Warranty Certificate</p>
                </div>

                <div class="subtitle">
                    VinFast trân trọng xác nhận chiếc xe điện thông minh của Quý khách dưới đây đã được kích hoạt bảo hành điện tử chính hãng tại hệ thống showroom.
                </div>

                <div class="details-grid">
                    <div class="section">
                        <div class="section-title">Thông tin chủ sở hữu</div>
                        <div class="info-row">
                            <span class="label">Khách hàng</span>
                            <span class="value">{{customerName}}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Số điện thoại</span>
                            <span class="value">{{customerPhone}}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Hình thức mua</span>
                            <span class="value">Mua trực tiếp (POS)</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Showroom xuất</span>
                            <span class="value">{{storeName}}</span>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">Thông tin phương tiện</div>
                        <div class="info-row">
                            <span class="label">Dòng xe (Model)</span>
                            <span class="value" style="font-weight: 600;">{{modelName}}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Số khung (VIN)</span>
                            <span class="value highlight">{{vin}}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Số máy (Engine)</span>
                            <span class="value highlight">{{engineNumber}}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Thời hạn bảo hành</span>
                            <span class="value" style="color: #10b981; font-weight: 600;">10 Năm / 200,000 km</span>
                        </div>
                    </div>
                </div>

                <div class="details-grid" style="margin-top: -20px; grid-template-columns: 1fr;">
                    <div class="section" style="background: rgba(217, 119, 6, 0.05); border-color: rgba(217, 119, 6, 0.2);">
                        <div class="section-title" style="border-color: rgba(217, 119, 6, 0.3);">Chi tiết e-Warranty</div>
                        <div class="info-row">
                            <span class="label">Mã số bảo hành</span>
                            <span class="value" style="font-family: monospace; letter-spacing: 0.5px; font-weight: 600;">{{warrantyId}}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Ngày kích hoạt</span>
                            <span class="value">{{activationDate}}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Ngày hết hạn</span>
                            <span class="value">{{expiryDate}}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Trạng thái</span>
                            <span class="value" style="color: #10b981; font-weight: bold; text-transform: uppercase;">✔ Đang hoạt động</span>
                        </div>
                    </div>
                </div>

                <div class="footer">
                    <div class="hologram-seal">
                        VinFast<br>Official<br>Warranty
                    </div>
                    <div class="signature-block">
                        <div class="signature-title">Đại diện showroom</div>
                        <div style="height: 40px;"></div>
                        <div class="signature-line">Đã xác thực hệ thống</div>
                    </div>
                </div>
            </div>
            <button onclick="window.print()" class="btn-print">In Chứng Nhận</button>
        </div>
    </body>
    </html>
    """;
}

// Request DTOs
public record CreateInventoryRequest(string Sku, string Name, int Quantity, string Location);
public record UpdateQuantityRequest(int Quantity);
public record ReserveVehicleRequest(string ProductId, Guid StoreId);
public record UpdatePriceDiscountRequest(decimal Price, decimal? OriginalPrice, string? DiscountText);
public record UpdateProductRequest(string Name, decimal Price, decimal? OriginalPrice, string? Image, string? DiscountText);
