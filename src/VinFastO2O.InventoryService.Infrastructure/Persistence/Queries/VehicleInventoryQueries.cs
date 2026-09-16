using Dapper;
using System.Data;
using VinFastO2O.InventoryService.Application.Common.Interfaces;
using VinFastO2O.InventoryService.Application.DTOs;

namespace VinFastO2O.InventoryService.Infrastructure.Persistence.Queries;

public class VehicleInventoryQueries : IVehicleInventoryQueries
{
    private readonly ISqlConnectionFactory _connectionFactory;

    public VehicleInventoryQueries(ISqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IEnumerable<VehicleInventoryCountDto>> GetInventoryCountByStoreAsync(CancellationToken cancellationToken = default)
    {
        using var connection = _connectionFactory.CreateConnection();
        
        const string sql = @"
            SELECT 
                s.""Code"" AS StoreCode,
                s.""Name"" AS StoreName,
                COUNT(v.""Id"")::int AS TotalVehicles
            FROM stores s
            LEFT JOIN vehicles v ON s.""Id"" = v.""StoreId""
            GROUP BY s.""Id"", s.""Code"", s.""Name""
            ORDER BY TotalVehicles DESC;";

        var result = await connection.QueryAsync<VehicleInventoryCountDto>(
            new CommandDefinition(sql, cancellationToken: cancellationToken));

        return result;
    }

    public async Task<IEnumerable<VehicleInventoryDetailDto>> GetVehicleInventoryDetailsAsync(CancellationToken cancellationToken = default)
    {
        using var connection = _connectionFactory.CreateConnection();
        
        const string sql = @"
            SELECT 
                v.""Vin"" AS Vin,
                v.""EngineNumber"" AS EngineNumber,
                v.""ModelName"" AS ModelName,
                v.""Color"" AS Color,
                CASE v.""Status""
                    WHEN 1 THEN 'InProduction'
                    WHEN 2 THEN 'InTransit'
                    WHEN 3 THEN 'Available'
                    WHEN 4 THEN 'Reserved'
                    WHEN 5 THEN 'Sold'
                    WHEN 6 THEN 'Maintenance'
                    WHEN 7 THEN 'Damaged'
                    ELSE 'Unknown'
                END AS Status,
                s.""Name"" AS StoreName,
                s.""Code"" AS StoreCode
            FROM vehicles v
            LEFT JOIN stores s ON v.""StoreId"" = s.""Id""
            ORDER BY v.""CreatedAt"" DESC;";

        var result = await connection.QueryAsync<VehicleInventoryDetailDto>(
            new CommandDefinition(sql, cancellationToken: cancellationToken));

        return result;
    }

    public async Task<IEnumerable<ShowroomAvailableStockDto>> GetShowroomAvailableStockAsync(Guid? showroomId = null, string? modelName = null, CancellationToken cancellationToken = default)
    {
        using var connection = _connectionFactory.CreateConnection();

        const string sql = @"
            SELECT 
                s.""Id"" AS ShowroomId,
                s.""Code"" AS ShowroomCode,
                s.""Name"" AS ShowroomName,
                COALESCE(v.""ModelName"", 'Tất cả dòng xe') AS ModelName,
                COUNT(v.""Id"")::int AS AvailableVinCount,
                CASE 
                    WHEN COUNT(v.""Id"") = 0 THEN 'OUT_OF_STOCK'
                    WHEN COUNT(v.""Id"") <= 3 THEN 'LOW_STOCK'
                    ELSE 'IN_STOCK'
                END AS StockStatus
            FROM stores s
            LEFT JOIN vehicles v ON s.""Id"" = v.""StoreId"" AND v.""Status"" = 3
            WHERE (@ShowroomId IS NULL OR s.""Id"" = @ShowroomId)
              AND (@ModelName IS NULL OR LOWER(v.""ModelName"") LIKE LOWER('%' || @ModelName || '%'))
            GROUP BY s.""Id"", s.""Code"", s.""Name"", v.""ModelName""
            ORDER BY s.""Code"", AvailableVinCount DESC;";

        var result = await connection.QueryAsync<ShowroomAvailableStockDto>(
            new CommandDefinition(sql, new { ShowroomId = showroomId, ModelName = modelName }, cancellationToken: cancellationToken));

        return result;
    }
}
