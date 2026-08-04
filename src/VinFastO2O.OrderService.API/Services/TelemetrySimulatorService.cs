using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;
using VinFastO2O.OrderService.API.Hubs;

namespace VinFastO2O.OrderService.API.Services;

public class TelemetrySimulatorService : BackgroundService
{
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<TelemetrySimulatorService> _logger;

    // Center of HCMC / Landmark 81 route coordinates
    private static readonly (double lat, double lng)[] RoutePoints = new[]
    {
        (10.795400, 106.721900), // Landmark 81
        (10.794100, 106.723500),
        (10.792500, 106.724800),
        (10.790500, 106.724000),
        (10.788500, 106.722500),
        (10.787500, 106.720500),
        (10.788800, 106.718500),
        (10.791000, 106.719800),
        (10.793500, 106.721000),
    };

    public TelemetrySimulatorService(IHubContext<NotificationHub> hubContext, ILogger<TelemetrySimulatorService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Telemetry Simulator Service has started.");

        int routeIndex = 0;
        double batteryPercentage = 45.0; // Start at 45%
        bool isCharging = false;
        double speed = 40.0;
        double batteryTemp = 32.5;

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Move position along the path
                var currentPoint = RoutePoints[routeIndex];
                routeIndex = (routeIndex + 1) % RoutePoints.Length;

                // Simulate battery behavior
                if (isCharging)
                {
                    batteryPercentage += 1.5; // Charges by 1.5% every 2 seconds
                    speed = 0.0; // Stationary while plugged in
                    batteryTemp += 0.15; // Heats up slightly during charge
                    if (batteryPercentage >= 100.0)
                    {
                        batteryPercentage = 100.0;
                        isCharging = false; // Finished charging, start driving (discharging)
                    }
                }
                else
                {
                    batteryPercentage -= 0.8; // Consumes 0.8% every 2 seconds
                    speed = 35.0 + new Random().NextDouble() * 15.0; // Random driving speed between 35-50 km/h
                    batteryTemp = Math.Max(28.0, batteryTemp - 0.05); // Cools down slightly while driving (air cooling)
                    if (batteryPercentage <= 15.0)
                    {
                        batteryPercentage = 15.0;
                        isCharging = true; // Auto-trigger charging when battery hits 15%
                    }
                }

                // Broadcast telemetry message to all connected SignalR clients
                await _hubContext.Clients.All.SendAsync("ReceiveVehicleTelemetry", new
                {
                    Vin = "VF8-MOCK-9999",
                    Latitude = currentPoint.lat,
                    Longitude = currentPoint.lng,
                    BatteryPercentage = Math.Round(batteryPercentage, 1),
                    IsCharging = isCharging,
                    Speed = Math.Round(speed, 1),
                    BatteryTemperature = Math.Round(batteryTemp, 1),
                    TimestampUnix = DateTimeOffset.UtcNow.ToUnixTimeSeconds()
                }, cancellationToken: stoppingToken);

                _logger.LogDebug("Broadcasting vehicle telemetry: Battery {Battery}%, Charging: {Charging}", batteryPercentage, isCharging);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during telemetry simulation loop.");
            }

            // Push data every 2 seconds
            await Task.Delay(2000, stoppingToken);
        }
    }
}
