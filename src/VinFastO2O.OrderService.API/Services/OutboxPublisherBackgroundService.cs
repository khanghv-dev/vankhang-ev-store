using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MassTransit;
using VinFastO2O.Shared.Events;
using VinFastO2O.OrderService.Domain.Entities;
using VinFastO2O.OrderService.Infrastructure.Persistence;

namespace VinFastO2O.OrderService.API.Services;

public class OutboxPublisherBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<OutboxPublisherBackgroundService> _logger;

    public OutboxPublisherBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<OutboxPublisherBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("OutboxPublisherBackgroundService is starting...");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await PublishPendingEventsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while publishing outbox events.");
            }

            // Poll every 5 seconds
            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
        }
    }

    private async Task PublishPendingEventsAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OrderDbContext>();
        var topicProducer = scope.ServiceProvider.GetRequiredService<ITopicProducer<string, VehicleDepositedEvent>>();

        // Fetch unprocessed outbox events
        var pendingEvents = await db.OutboxEvents
            .Where(o => o.ProcessedAt == null)
            .OrderBy(o => o.CreatedAt)
            .Take(20)
            .ToListAsync(cancellationToken);

        if (pendingEvents.Count == 0)
        {
            return;
        }

        _logger.LogInformation("Found {Count} pending outbox events to publish.", pendingEvents.Count);

        foreach (var outboxEvent in pendingEvents)
        {
            try
            {
                if (outboxEvent.EventType == nameof(VehicleDepositedEvent))
                {
                    var eventMessage = System.Text.Json.JsonSerializer.Deserialize<VehicleDepositedEvent>(outboxEvent.Payload);
                    if (eventMessage != null)
                    {
                        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
                        await topicProducer.Produce(
                            eventMessage.OrderId.ToString(),
                            eventMessage,
                            cts.Token
                        );

                        outboxEvent.ProcessedAt = DateTime.UtcNow;
                        outboxEvent.Error = null;
                        _logger.LogInformation("Successfully published outbox event: {Id} to Kafka.", outboxEvent.Id);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to publish outbox event: {Id}.", outboxEvent.Id);
                outboxEvent.Error = ex.Message;
            }
        }

        await db.SaveChangesAsync(cancellationToken);
    }
}
