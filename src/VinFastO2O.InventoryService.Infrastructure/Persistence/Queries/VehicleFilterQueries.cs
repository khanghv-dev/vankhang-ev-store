using Dapper;
using System.Data;
using System.Text;
using VinFastO2O.InventoryService.Application.Common.Interfaces;
using VinFastO2O.InventoryService.Application.DTOs;

namespace VinFastO2O.InventoryService.Infrastructure.Persistence.Queries;

public class VehicleFilterQueries : IVehicleFilterQueries
{
    private readonly ISqlConnectionFactory _connectionFactory;

    public VehicleFilterQueries(ISqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IEnumerable<VehicleFilterDto>> FilterVehiclesAsync(
        string? brand,
        decimal? priceMin,
        decimal? priceMax,
        string? batteryType,
        CancellationToken cancellationToken = default)
    {
        var sql = new StringBuilder(@"
            SELECT 
                v.""Vin"" AS Vin,
                v.""EngineNumber"" AS EngineNumber,
                v.""ModelName"" AS ModelName,
                v.""Color"" AS Color,
                v.""Brand"" AS Brand,
                v.""Price"" AS Price,
                v.""BatteryType"" AS BatteryType,
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
            WHERE 1=1");

        var parameters = new DynamicParameters();

        if (!string.IsNullOrWhiteSpace(brand))
        {
            sql.Append(@" AND v.""Brand"" ILIKE @Brand");
            parameters.Add("Brand", $"%{brand.Trim()}%");
        }

        if (priceMin.HasValue)
        {
            sql.Append(@" AND v.""Price"" >= @PriceMin");
            parameters.Add("PriceMin", priceMin.Value);
        }

        if (priceMax.HasValue)
        {
            sql.Append(@" AND v.""Price"" <= @PriceMax");
            parameters.Add("PriceMax", priceMax.Value);
        }

        if (!string.IsNullOrWhiteSpace(batteryType))
        {
            sql.Append(@" AND v.""BatteryType"" ILIKE @BatteryType");
            parameters.Add("BatteryType", $"%{batteryType.Trim()}%");
        }

        sql.Append(@" ORDER BY v.""CreatedAt"" DESC;");

        using var connection = _connectionFactory.CreateConnection();
        var result = await connection.QueryAsync<VehicleFilterDto>(
            new CommandDefinition(sql.ToString(), parameters, cancellationToken: cancellationToken));

        return result;
    }
}
