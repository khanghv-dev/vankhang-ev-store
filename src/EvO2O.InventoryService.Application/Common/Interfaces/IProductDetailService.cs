using EvO2O.InventoryService.Application.DTOs;

namespace EvO2O.InventoryService.Application.Common.Interfaces;

public interface IProductDetailService
{
    Task<ProductDetailDto?> GetProductDetailByNameAsync(string modelName, CancellationToken cancellationToken = default);
}
