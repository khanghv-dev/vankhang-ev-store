using MediatR;
using System.IO;
using EvO2O.InventoryService.Application.DTOs;

namespace EvO2O.InventoryService.Application.Products.Commands;

public record ImportProductsFromExcelCommand(Stream FileStream) : IRequest<ImportResultDto>;
