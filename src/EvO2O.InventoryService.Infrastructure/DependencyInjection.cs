using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using MongoDB.Driver;
using StackExchange.Redis;
using EvO2O.InventoryService.Application.Common.Interfaces;
using EvO2O.InventoryService.Infrastructure.Persistence;
using EvO2O.InventoryService.Infrastructure.Persistence.Queries;
using EvO2O.InventoryService.Infrastructure.Repositories;
using EvO2O.InventoryService.Infrastructure.Services;
using EvO2O.InventoryService.Infrastructure.Messaging;

namespace EvO2O.InventoryService.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        
        // Register DbContext with PostgreSQL connection (EF Core)
        services.AddDbContext<InventoryDbContext>(options =>
            options.UseNpgsql(connectionString,
                npgsqlOptions => npgsqlOptions.MigrationsAssembly(typeof(InventoryDbContext).Assembly.FullName)));

        // Register SqlConnectionFactory for Dapper
        services.AddTransient<ISqlConnectionFactory>(_ => new SqlConnectionFactory(connectionString!));

        // Register Dapper Queries Repository
        services.AddScoped<IVehicleInventoryQueries, VehicleInventoryQueries>();
        services.AddScoped<IVehicleFilterQueries, VehicleFilterQueries>();
        services.AddScoped<IAdminProductQueries, AdminProductQueries>();

        // Register MongoDB Client
        var mongoConnectionString = configuration.GetConnectionString("MongoConnection") ?? "mongodb://localhost:27017";
        services.AddSingleton<IMongoClient>(_ => new MongoClient(mongoConnectionString));

        // Register Redis Distributed Cache (IDistributedCache — dùng cho caching thông thường)
        var redisConnectionString = configuration.GetConnectionString("RedisConnection") ?? "localhost:6379";
        services.AddStackExchangeRedisCache(options =>
        {
            options.Configuration = redisConnectionString;
            options.InstanceName = "EvO2O_";
        });

        // Register IConnectionMultiplexer — Singleton, dùng bởi RedisLockService.
        // Phải là Singleton vì ConnectionMultiplexer tự quản lý connection pool.
        services.AddSingleton<IConnectionMultiplexer>(_ =>
            ConnectionMultiplexer.Connect(redisConnectionString));

        // Register Vehicle Lock Service (distributed lock cho quy trình đặt cọc)
        services.AddSingleton<IVehicleLockService, RedisLockService>();

        // Register Catalog Service
        services.AddScoped<ICatalogService, CatalogService>();
        services.AddScoped<IProductDetailService, ProductDetailService>();
        services.AddScoped<ITelemetryIngestionService, TelemetryIngestionService>();
        services.AddScoped<IBatteryStationService, BatteryStationService>();
        services.AddScoped<IProductService, ProductService>();

        // Register S3 Storage Service
        services.Configure<S3Settings>(options =>
        {
            var section = configuration.GetSection("S3Settings");
            options.ServiceUrl = section["ServiceUrl"] ?? string.Empty;
            options.AccessKey = section["AccessKey"] ?? string.Empty;
            options.SecretKey = section["SecretKey"] ?? string.Empty;
            options.BucketName = section["BucketName"] ?? "evo2o-product-images";
            options.Region = section["Region"] ?? "ap-southeast-1";
            options.PublicUrlPrefix = section["PublicUrlPrefix"] ?? string.Empty;
        });
        services.AddScoped<IImageStorageService, S3ImageStorageService>();

        // Register Repositories
        services.AddScoped<IVehicleRepository, VehicleRepository>();
        services.AddScoped<IStoreRepository, StoreRepository>();
        services.AddScoped<IInventoryLogRepository, InventoryLogRepository>();

        services.AddSingleton<IInventoryRepository, InMemoryInventoryRepository>();

        services.AddKafkaMessaging(configuration);

        return services;
    }
}
