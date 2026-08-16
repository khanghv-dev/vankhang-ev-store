using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Caching.Distributed;
using MongoDB.Driver;
using Npgsql;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using EvO2O.InventoryService.Application.Products.Commands;
using EvO2O.InventoryService.Domain.Entities;

namespace EvO2O.InventoryService.Infrastructure.Persistence.Handlers;

public class SoftDeleteProductCommandHandler : IRequestHandler<SoftDeleteProductCommand>
{
    private readonly InventoryDbContext _dbContext;
    private readonly IMongoCollection<VehicleModel> _vehicleModels;
    private readonly IConfiguration _configuration;
    private readonly IDistributedCache _cache;
    private readonly ILogger<SoftDeleteProductCommandHandler> _logger;

    private static readonly Dictionary<string, Guid> SkuToGuidMap = new(StringComparer.OrdinalIgnoreCase)
    {
        { "vinfast-klara-s-2026", Guid.Parse("e0000000-0000-0000-0000-000000000001") },
        { "vinfast-impes", Guid.Parse("e0000000-0000-0000-0000-000000000002") },
        { "vinfast-klara-s-premium", Guid.Parse("e0000000-0000-0000-0000-000000000003") }
    };

    public SoftDeleteProductCommandHandler(
        InventoryDbContext dbContext,
        IMongoClient mongoClient,
        IConfiguration configuration,
        IDistributedCache cache,
        ILogger<SoftDeleteProductCommandHandler> logger)
    {
        _dbContext = dbContext;
        _configuration = configuration;
        _cache = cache;
        _logger = logger;

        var dbName = configuration["MongoSettings:DatabaseName"] ?? "EvO2O_Catalog";
        var database = mongoClient.GetDatabase(dbName);
        _vehicleModels = database.GetCollection<VehicleModel>("vehicle_models");
    }

    public async Task Handle(SoftDeleteProductCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Sku))
        {
            throw new ArgumentException("SKU/Id của sản phẩm không được để trống.", nameof(request.Sku));
        }

        var sku = request.Sku.Trim().ToLowerInvariant();
        _logger.LogInformation("Processing soft delete for product SKU: {Sku}", sku);

        // 1. Tìm sản phẩm trong PostgreSQL
        var product = await _dbContext.Products
            .FirstOrDefaultAsync(p => p.Id == sku && !p.IsDeleted, cancellationToken);
        if (product == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy sản phẩm với SKU '{sku}' hoặc sản phẩm đã bị xóa trước đó.");
        }

        // 2. Lấy Guid ProductId tương ứng
        SkuToGuidMap.TryGetValue(sku, out var productGuid);

        // 3. Kết nối động đến cơ sở dữ liệu Order Service để kiểm tra đơn hàng đang xử lý
        var defaultConn = _configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrEmpty(defaultConn))
        {
            throw new InvalidOperationException("Không tìm thấy chuỗi kết nối DefaultConnection.");
        }

        var connBuilder = new NpgsqlConnectionStringBuilder(defaultConn);
        connBuilder.Database = (connBuilder.Database?.Contains("_Dev") ?? false) ? "EvO2O_OrderDb_Dev" : "EvO2O_OrderDb";
        var orderConnectionString = connBuilder.ConnectionString;

        bool hasPendingOrders = false;
        try
        {
            using var orderConnection = new NpgsqlConnection(orderConnectionString);
            await orderConnection.OpenAsync(cancellationToken);

            const string checkOrderSql = @"
                SELECT EXISTS (
                    SELECT 1 
                    FROM order_items oi
                    JOIN orders o ON oi.""OrderId"" = o.""Id""
                    WHERE (oi.""ProductId"" = @ProductId OR oi.""ProductName"" = @ProductName)
                      AND o.""Status"" NOT IN ('Delivered', 'Cancelled')
                );";

            using var cmd = new NpgsqlCommand(checkOrderSql, orderConnection);
            cmd.Parameters.AddWithValue("ProductId", productGuid != Guid.Empty ? (object)productGuid : DBNull.Value);
            cmd.Parameters.AddWithValue("ProductName", product.Name);

            hasPendingOrders = (bool)(await cmd.ExecuteScalarAsync(cancellationToken) ?? false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi xảy ra khi truy vấn dữ liệu từ Order Service DB để kiểm tra cản trở xóa sản phẩm '{Sku}'.", sku);
            throw new InvalidOperationException("Không thể kiểm tra đơn hàng hiện tại do lỗi kết nối cơ sở dữ liệu Order Service.", ex);
        }

        // 4. Nếu sản phẩm đang nằm trong đơn đặt hàng chờ xử lý, chặn không cho xóa
        if (hasPendingOrders)
        {
            throw new InvalidOperationException($"Không thể xóa sản phẩm '{product.Name}' vì đang có đơn đặt cọc hoặc đơn hàng liên quan đang chờ xử lý.");
        }

        // 5. Xóa mềm trong PostgreSQL
        product.SoftDelete();

        // 6. Xóa tương ứng trong MongoDB
        try
        {
            var filter = Builders<VehicleModel>.Filter.Eq(vm => vm.Id, sku);
            var deleteResult = await _vehicleModels.DeleteOneAsync(filter, cancellationToken);
            if (deleteResult.DeletedCount > 0)
            {
                _logger.LogInformation("Đã đồng bộ xóa VehicleModel '{Sku}' khỏi MongoDB.", sku);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi xảy ra khi đồng bộ xóa VehicleModel '{Sku}' khỏi MongoDB.", sku);
            // Không rethrow để tránh rollback PostgreSQL nếu việc cập nhật Mongo chỉ là đồng bộ catalog hiển thị
        }

        // Lưu thay đổi vào PostgreSQL
        await _dbContext.SaveChangesAsync(cancellationToken);

        // 7. Làm mới Redis Cache cho trang chủ
        try
        {
            const string homepageCacheKey = "catalog:homepage_vehicle_models";
            await _cache.RemoveAsync(homepageCacheKey, cancellationToken);
            _logger.LogInformation("Đã làm mới cache trang chủ sau khi xóa mềm SKU: {Sku}", sku);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Không thể xóa cache Redis key 'catalog:homepage_vehicle_models'.");
        }

        _logger.LogInformation("Xóa mềm sản phẩm SKU: {Sku} hoàn tất thành công.", sku);
    }
}
