using VinFastO2O.InventoryService.Application.DTOs;

namespace VinFastO2O.InventoryService.Application.Common.Interfaces;

public interface IInventoryService
{
    Task<InventoryItemDto?> GetByIdAsync(Guid id);
    Task<InventoryItemDto?> GetBySkuAsync(string sku);
    Task<IEnumerable<InventoryItemDto>> GetAllAsync();
    Task<InventoryItemDto> CreateAsync(string sku, string name, int quantity, string location);
    Task UpdateQuantityAsync(Guid id, int newQuantity);
}
