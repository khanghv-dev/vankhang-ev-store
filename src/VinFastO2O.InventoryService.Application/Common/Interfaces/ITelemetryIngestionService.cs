using System.Threading;
using System.Threading.Tasks;
using VinFastO2O.InventoryService.Application.DTOs;

namespace VinFastO2O.InventoryService.Application.Common.Interfaces;

public interface ITelemetryIngestionService
{
    Task IngestTelemetryAsync(TelemetryIngestionRequestDto request, CancellationToken cancellationToken = default);
}
