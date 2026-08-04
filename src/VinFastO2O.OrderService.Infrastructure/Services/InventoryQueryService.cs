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
            // Fallback or custom logging. If product id is not mapped, we can default to "VinFast VF 8" or log warning.
            _logger.LogWarning("[InventoryQueryService] Product ID {ProductId} not found in static mapping. Defaulting to 'VinFast VF 8'.", productId);
            modelName = "VinFast VF 8";
        }

        _logger.LogInformation("[InventoryQueryService] Finding first AVAILABLE vehicle of model '{ModelName}' at store {StoreId}...", modelName, storeId);

        // 2. Query Postgres Inventory DB using Npgsql ADO.NET
        const string sql = @"
            SELECT ""Vin"", ""EngineNumber"", ""ModelName"", ""Color"", ""Price""
            FROM vehicles
            WHERE ""StoreId"" = @StoreId
              AND ""Status"" = 3 -- Available (VehicleStatus.Available)
              AND ""ModelName"" ILIKE @ModelName
            ORDER BY ""CreatedAt""
            LIMIT 1;";

        try
        {
            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync(cancellationToken);

            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("StoreId", storeId);
            command.Parameters.AddWithValue("ModelName", modelName);

            using var reader = await command.ExecuteReaderAsync(cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
            {
                var vehicle = new AvailableVehicleDto
                {
                    Vin = reader.GetString(0),
                    EngineNumber = reader.GetString(1),
                    ModelName = reader.GetString(2),
                    Color = reader.GetString(3),
                    Price = reader.GetDecimal(4)
                };

                _logger.LogInformation("[InventoryQueryService] Found vehicle: VIN {Vin}, Model {ModelName}, Price {Price}", vehicle.Vin, vehicle.ModelName, vehicle.Price);
                return vehicle;
            }

            _logger.LogWarning("[InventoryQueryService] No available vehicles of model '{ModelName}' found at store {StoreId}.", modelName, storeId);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[InventoryQueryService] Error querying inventory database for model '{ModelName}' at store {StoreId}.", modelName, storeId);
            throw;
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
