using System.Threading.Tasks;
using Grpc.Core;
using Microsoft.Extensions.Logging;
using EvO2O.InventoryService.API.Protos;
using EvO2O.InventoryService.Application.Common.Interfaces;
using EvO2O.InventoryService.Application.DTOs;

namespace EvO2O.InventoryService.API.Grpc;

public class TelemetryIngestionGrpcService : TelemetryIngestion.TelemetryIngestionBase
{
    private readonly ITelemetryIngestionService _telemetryService;
    private readonly ILogger<TelemetryIngestionGrpcService> _logger;

    public TelemetryIngestionGrpcService(
        ITelemetryIngestionService telemetryService,
        ILogger<TelemetryIngestionGrpcService> logger)
    {
        _telemetryService = telemetryService;
        _logger = logger;
    }

    public override async Task<TelemetryResponse> SubmitTelemetry(
        TelemetryRequest request,
        ServerCallContext context)
    {
        _logger.LogInformation(">>> [gRPC Ingestion] Received telemetry from VIN: {Vin}", request.Vin);

        if (string.IsNullOrWhiteSpace(request.Vin))
        {
            return new TelemetryResponse
            {
                Success = false,
                Message = "VIN cannot be empty."
            };
        }

        try
        {
            var dto = new TelemetryIngestionRequestDto(
                request.Vin,
                request.Latitude,
                request.Longitude,
                request.Speed,
                request.BatteryPercentage,
                request.BatteryTemperature,
                request.TimestampUnix
            );

            await _telemetryService.IngestTelemetryAsync(dto, context.CancellationToken);

            return new TelemetryResponse
            {
                Success = true,
                Message = "Telemetry ingested successfully."
            };
        }
        catch (System.Exception ex)
        {
            _logger.LogError(ex, "Error occurred during gRPC telemetry ingestion for VIN: {Vin}", request.Vin);
            
            return new TelemetryResponse
            {
                Success = false,
                Message = $"Ingestion failed: {ex.Message}"
            };
        }
    }
}
