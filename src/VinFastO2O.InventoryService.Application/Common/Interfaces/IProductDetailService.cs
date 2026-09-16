using VinFastO2O.InventoryService.Application.DTOs;

namespace VinFastO2O.InventoryService.Application.Common.Interfaces;

public interface IProductDetailService
{
    Task<ProductDetailDto?> GetProductDetailByNameAsync(string modelName, CancellationToken cancellationToken = default);
}
