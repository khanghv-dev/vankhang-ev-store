using MassTransit;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using EvO2O.Shared.Events;

namespace EvO2O.OrderService.Infrastructure.Messaging;

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
                rider.AddConsumer<VehicleDepositedConsumer>();

                rider.AddProducer<string, OrderPaidEvent>("order-paid-topic");
                rider.AddProducer<string, VehicleDepositedEvent>("vehicle-deposited-topic");
                rider.AddProducer<string, VehicleReadyForDeliveryEvent>("vehicle-ready-delivery-topic");

                rider.UsingKafka((context, k) =>
                {
                    k.Host(kafkaHost);

                    k.TopicEndpoint<string, VehicleDepositedEvent>("vehicle-deposited-topic", "order-service-group", e =>
                    {
                        e.ConfigureConsumer<VehicleDepositedConsumer>(context);
                    });
                });
            });
        });

        return services;
    }
}
