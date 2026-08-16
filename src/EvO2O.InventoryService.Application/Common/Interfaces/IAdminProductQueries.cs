using System.Threading;
using System.Threading.Tasks;
using EvO2O.InventoryService.Application.DTOs;

namespace EvO2O.InventoryService.Application.Common.Interfaces;

/// <summary>
/// Data-access interface contract for administrative product queries.
/// </summary>
public interface IAdminProductQueries
{
    /// <summary>
    /// Searches and filters administrative products (vehicles + parts) from PostgreSQL.
    /// </summary>
    Task<AdminProductListResultDto> GetAdminProductsAsync(
        string? searchName,
        string? category,
        bool? isActive,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);
}
