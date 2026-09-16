using MassTransit;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using VinFastO2O.InventoryService.Application.Common.Messaging;
using VinFastO2O.Shared.Events;

namespace VinFastO2O.InventoryService.Infrastructure.Messaging;

public static class KafkaConfiguration
{
    public static IServiceCollection AddKafkaMessaging(this IServiceCollection services, IConfiguration configuration)
    {
        var kafkaHost = configuration["Kafka:Host"] ?? "localhost:9092";

        services.AddMassTransit(x =>
        {
            x.UsingInMemory((context, cfg) =>
            {
                cfg.ConfigureEndpoints(context);
            });

            x.AddRider(rider =>
            {
                rider.AddConsumer<OrderPaidConsumer>();
                rider.AddConsumer<VehicleReadyForDeliveryConsumer>();

                rider.UsingKafka((context, k) =>
                {
                    k.Host(kafkaHost);

                    k.TopicEndpoint<string, OrderPaidEvent>("order-paid-topic", "inventory-service-group", e =>
                    {
                        e.ConfigureConsumer<OrderPaidConsumer>(context);
                    });

                    k.TopicEndpoint<string, VehicleReadyForDeliveryEvent>("vehicle-ready-delivery-topic", "inventory-service-group", e =>
                    {
                        e.ConfigureConsumer<VehicleReadyForDeliveryConsumer>(context);
                    });
                });
            });
        });

        return services;
    }
}
