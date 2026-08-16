using EvO2O.InventoryService.Application.Common.Interfaces;
using EvO2O.InventoryService.Application.DTOs;
using EvO2O.InventoryService.Domain.Entities;

namespace EvO2O.InventoryService.Application.Services;

public class InventoryService : IInventoryService
{
    private readonly IInventoryRepository _repository;

    public InventoryService(IInventoryRepository repository)
    {
        _repository = repository;
    }

    public async Task<InventoryItemDto?> GetByIdAsync(Guid id)
    {
        var item = await _repository.GetByIdAsync(id);
        return item == null ? null : MapToDto(item);
    }

    public async Task<InventoryItemDto?> GetBySkuAsync(string sku)
    {
        var item = await _repository.GetBySkuAsync(sku);
        return item == null ? null : MapToDto(item);
    }

    public async Task<IEnumerable<InventoryItemDto>> GetAllAsync()
    {
        var items = await _repository.GetAllAsync();
        return items.Select(MapToDto);
    }

    public async Task<InventoryItemDto> CreateAsync(string sku, string name, int quantity, string location)
    {
        var existing = await _repository.GetBySkuAsync(sku);
        if (existing != null)
        {
            throw new InvalidOperationException($"Inventory item with SKU {sku} already exists.");
        }

        var item = new InventoryItem(sku, name, quantity, location);
        await _repository.AddAsync(item);
        
        return MapToDto(item);
    }

    public async Task UpdateQuantityAsync(Guid id, int newQuantity)
    {
        var item = await _repository.GetByIdAsync(id);
        if (item == null)
        {
            throw new KeyNotFoundException($"Inventory item with ID {id} was not found.");
        }

        item.UpdateQuantity(newQuantity);
        await _repository.UpdateAsync(item);
    }

    private static InventoryItemDto MapToDto(InventoryItem item)
    {
        return new InventoryItemDto
        {
            Id = item.Id,
            Sku = item.Sku,
            Name = item.Name,
            Quantity = item.Quantity,
            Location = item.Location
        };
    }
}
