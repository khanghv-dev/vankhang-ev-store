using MediatR;
using System.IO;
using VinFastO2O.InventoryService.Application.DTOs;

namespace VinFastO2O.InventoryService.Application.Products.Commands;

public record ImportProductsFromExcelCommand(Stream FileStream) : IRequest<ImportResultDto>;
