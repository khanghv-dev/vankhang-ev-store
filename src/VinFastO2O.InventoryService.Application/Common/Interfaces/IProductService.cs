using VinFastO2O.InventoryService.Application.DTOs;

namespace VinFastO2O.InventoryService.Application.Common.Interfaces;

public interface IProductService
{
    Task<IEnumerable<ProductDto>> GetProductsByCategoryAsync(string? category, CancellationToken cancellationToken = default);
}
