using MediatR;

namespace EvO2O.InventoryService.Application.Products.Commands;

public record SoftDeleteProductCommand(string Sku) : IRequest;
