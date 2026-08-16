using System.Threading;
using System.Threading.Tasks;
using EvO2O.InventoryService.Application.DTOs;

namespace EvO2O.InventoryService.Application.Common.Interfaces;

public interface ITelemetryIngestionService
{
    Task IngestTelemetryAsync(TelemetryIngestionRequestDto request, CancellationToken cancellationToken = default);
}
