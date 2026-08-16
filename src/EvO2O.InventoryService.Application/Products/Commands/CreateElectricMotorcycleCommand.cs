using MediatR;

namespace EvO2O.InventoryService.Application.Products.Commands;

public record CreateElectricMotorcycleCommand(
    string Sku,
    string Name,
    decimal Price,
    string ImageUrl,
    string Description,
    string Dimensions,
    string BatteryType,
    string EnginePower,
    string MaxSpeed,
    string RangePerCharge
) : IRequest<string>;
