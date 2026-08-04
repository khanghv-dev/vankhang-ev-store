using Dapper;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using VinFastO2O.InventoryService.Application.Common.Interfaces;
using VinFastO2O.InventoryService.Application.DTOs;

namespace VinFastO2O.InventoryService.Infrastructure.Persistence.Queries;

public class AdminProductQueries : IAdminProductQueries
{
    private readonly ISqlConnectionFactory _connectionFactory;

    public AdminProductQueries(ISqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<AdminProductListResultDto> GetAdminProductsAsync(
        string? searchName,
        string? category,
        bool? isActive,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var parameters = new DynamicParameters();
        var whereConditions = new List<string> { @" ""IsDeleted"" = false " };

        if (!string.IsNullOrWhiteSpace(searchName))
        {
            whereConditions.Add(@" ""Name"" ILIKE @SearchName ");
            parameters.Add("SearchName", $"%{searchName.Trim()}%");
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            whereConditions.Add(@" ""Category"" = @Category ");
            parameters.Add("Category", category.Trim());
        }

        if (isActive.HasValue)
        {
            whereConditions.Add(@" ""IsActive"" = @IsActive ");
            parameters.Add("IsActive", isActive.Value);
        }

        var whereClause = whereConditions.Any() 
            ? " WHERE " + string.Join(" AND ", whereConditions) 
            : "";

        var countSql = $@"SELECT COUNT(*)::int FROM products {whereClause};";
        
        var limit = pageSize > 0 ? pageSize : 10;
        var offset = (pageNumber - 1) * limit;
        if (offset < 0) offset = 0;

        parameters.Add("Limit", limit);
        parameters.Add("Offset", offset);

        var dataSql = $@"
            SELECT 
                ""Id"", 
                ""Name"", 
                ""Category"", 
                ""Image"", 
                ""Price"", 
                ""OriginalPrice"", 
                ""DiscountText"", 
                ""IsNew"", 
                ""InStock"", 
                ""IsActive"", 
                ""BatteryType"", 
                ""BatteryOption"", 
                ""SpecsJson""
            FROM products 
            {whereClause} 
            ORDER BY ""Name"" ASC 
            LIMIT @Limit OFFSET @Offset;";

        using var connection = _connectionFactory.CreateConnection();
        
        using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(countSql + dataSql, parameters, cancellationToken: cancellationToken));

        var totalCount = await multi.ReadFirstAsync<int>();
        var rows = await multi.ReadAsync<dynamic>();

        var items = new List<AdminProductDto>();
        foreach (var row in rows)
        {
            string specsJson = row.SpecsJson;
            var specs = string.IsNullOrWhiteSpace(specsJson) 
                ? new List<string>() 
                : JsonSerializer.Deserialize<List<string>>(specsJson) ?? new List<string>();

            items.Add(new AdminProductDto
            {
                Id = row.Id,
                Name = row.Name,
                Category = row.Category,
                Image = row.Image,
                Price = row.Price,
                OriginalPrice = row.OriginalPrice,
                DiscountText = row.DiscountText,
                IsNew = row.IsNew,
                InStock = row.InStock,
                IsActive = row.IsActive,
                BatteryType = row.BatteryType,
                BatteryOption = row.BatteryOption,
                Specs = specs
            });
        }

        return new AdminProductListResultDto
        {
            Items = items,
            TotalCount = totalCount
        };
    }
}
