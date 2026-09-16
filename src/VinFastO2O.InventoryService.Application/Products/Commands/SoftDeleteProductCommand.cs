using MediatR;

namespace VinFastO2O.InventoryService.Application.Products.Commands;

public record SoftDeleteProductCommand(string Sku) : IRequest;
