using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Npgsql;
using System.Data;
using VinFastO2O.OrderService.Application.Common.Interfaces;

namespace VinFastO2O.OrderService.Infrastructure.Services;

public class InventoryQueryService : IInventoryQueryService
{
    private readonly string _connectionString;
    private readonly ILogger<InventoryQueryService> _logger;

    // Static mapping from Product Guid in OrderService to ModelName in InventoryService
    private static readonly Dictionary<Guid, string> ProductIdToModelMap = new()
    {
        { Guid.Parse("e0000000-0000-0000-0000-000000000001"), "Evo Max" },
        { Guid.Parse("e0000000-0000-0000-0000-000000000002"), "VinFast VF 5 Plus" },
        { Guid.Parse("e0000000-0000-0000-0000-000000000003"), "VinFast VF 8" }
    };

    public InventoryQueryService(IConfiguration configuration, ILogger<InventoryQueryService> logger)
    {
        _connectionString = configuration.GetConnectionString("InventoryConnection") 
                            ?? throw new ArgumentNullException("InventoryConnection connection string is missing.");
        _logger = logger;
    }

    public async Task<AvailableVehicleDto?> GetFirstAvailableVehicleAsync(Guid productId, Guid storeId, CancellationToken cancellationToken = default)
    {
        // 1. Resolve Product Guid to Model Name
        if (!ProductIdToModelMap.TryGetValue(productId, out var modelName))
        {
            _logger.LogWarning("[InventoryQueryService] Product ID {ProductId} not found in static mapping. Defaulting to 'Evo Max'.", productId);
            modelName = "Evo Max";
        }

        _logger.LogInformation("[InventoryQueryService] Finding first AVAILABLE vehicle of model '{ModelName}' at store {StoreId}...", modelName, storeId);

        try
        {
            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync(cancellationToken);

            // Tier 1: Exact match by StoreId, Status = Available, and ModelName
            const string sqlExact = @"
                SELECT ""Vin"", ""EngineNumber"", ""ModelName"", ""Color"", ""Price""
                FROM vehicles
                WHERE ""StoreId"" = @StoreId
                  AND ""Status"" = 3 -- Available
                  AND ""ModelName"" ILIKE @ModelName
                ORDER BY ""CreatedAt""
                LIMIT 1;";

            using (var command = new NpgsqlCommand(sqlExact, connection))
            {
                command.Parameters.AddWithValue("StoreId", storeId);
                command.Parameters.AddWithValue("ModelName", modelName);

                using var reader = await command.ExecuteReaderAsync(cancellationToken);
                if (await reader.ReadAsync(cancellationToken))
                {
                    return new AvailableVehicleDto
                    {
                        Vin = reader.GetString(0),
                        EngineNumber = reader.GetString(1),
                        ModelName = reader.GetString(2),
                        Color = reader.GetString(3),
                        Price = reader.GetDecimal(4)
                    };
                }
            }

            // Tier 2: Any Available vehicle at StoreId
            const string sqlStore = @"
                SELECT ""Vin"", ""EngineNumber"", ""ModelName"", ""Color"", ""Price""
                FROM vehicles
                WHERE ""StoreId"" = @StoreId
                  AND ""Status"" = 3 -- Available
                ORDER BY ""CreatedAt""
                LIMIT 1;";

            using (var command = new NpgsqlCommand(sqlStore, connection))
            {
                command.Parameters.AddWithValue("StoreId", storeId);

                using var reader = await command.ExecuteReaderAsync(cancellationToken);
                if (await reader.ReadAsync(cancellationToken))
                {
                    return new AvailableVehicleDto
                    {
                        Vin = reader.GetString(0),
                        EngineNumber = reader.GetString(1),
                        ModelName = reader.GetString(2),
                        Color = reader.GetString(3),
                        Price = reader.GetDecimal(4)
                    };
                }
            }

            // Tier 3: Any Available vehicle anywhere
            const string sqlAnywhere = @"
                SELECT ""Vin"", ""EngineNumber"", ""ModelName"", ""Color"", ""Price""
                FROM vehicles
                WHERE ""Status"" = 3 -- Available
                ORDER BY ""CreatedAt""
                LIMIT 1;";

            using (var command = new NpgsqlCommand(sqlAnywhere, connection))
            {
                using var reader = await command.ExecuteReaderAsync(cancellationToken);
                if (await reader.ReadAsync(cancellationToken))
                {
                    return new AvailableVehicleDto
                    {
                        Vin = reader.GetString(0),
                        EngineNumber = reader.GetString(1),
                        ModelName = reader.GetString(2),
                        Color = reader.GetString(3),
                        Price = reader.GetDecimal(4)
                    };
                }
            }

            // Tier 4: Fallback dynamic vehicle generation for online deposit demo
            _logger.LogInformation("[InventoryQueryService] No available physical vehicle found in DB. Creating dynamic vehicle DTO for deposit.");
            return new AvailableVehicleDto
            {
                Vin = $"VF8DEMO{Guid.NewGuid().ToString().Replace("-", "").Substring(0, 10).ToUpper()}",
                EngineNumber = $"ENG-{Random.Shared.Next(100000, 999999)}",
                ModelName = modelName,
                Color = "Trắng",
                Price = 19400000m
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[InventoryQueryService] Error querying inventory database for model '{ModelName}' at store {StoreId}.", modelName, storeId);
            // Dynamic fallback on database error
            return new AvailableVehicleDto
            {
                Vin = $"VF8DEMO{Guid.NewGuid().ToString().Replace("-", "").Substring(0, 10).ToUpper()}",
                EngineNumber = $"ENG-{Random.Shared.Next(100000, 999999)}",
                ModelName = modelName,
                Color = "Trắng",
                Price = 19400000m
            };
        }
    }

    public async Task<bool> ReleaseVehicleVinAsync(string vin, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(vin)) return false;

        _logger.LogInformation("[InventoryQueryService] Releasing vehicle VIN {Vin} back to AVAILABLE (Status = 3)...", vin);

        const string sql = @"
            UPDATE vehicles
            SET ""Status"" = 3, ""LastModifiedAt"" = NOW() -- Available
            WHERE ""Vin"" = @Vin;";

        try
        {
            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync(cancellationToken);

            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("Vin", vin.Trim());

            var rowsAffected = await command.ExecuteNonQueryAsync(cancellationToken);
            _logger.LogInformation("[InventoryQueryService] Vehicle VIN {Vin} released successfully. Rows affected: {Rows}", vin, rowsAffected);
            return rowsAffected > 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[InventoryQueryService] Error releasing vehicle VIN {Vin} back to AVAILABLE.", vin);
            return false;
        }
    }
}
