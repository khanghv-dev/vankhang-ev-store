using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using VinFastO2O.OrderService.Application.Common.Interfaces;
using VinFastO2O.OrderService.Infrastructure.Messaging;
using VinFastO2O.OrderService.Infrastructure.Persistence;
using VinFastO2O.OrderService.Infrastructure.Repositories;
using VinFastO2O.OrderService.Infrastructure.Settings;
using StackExchange.Redis;

namespace VinFastO2O.OrderService.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<AuditLogInterceptor>();

        var connectionString = configuration.GetConnectionString("DefaultConnection");
        services.AddDbContext<OrderDbContext>((sp, options) =>
        {
            options.UseNpgsql(connectionString,
                npgsqlOptions => npgsqlOptions.MigrationsAssembly(typeof(OrderDbContext).Assembly.FullName));
            
            var interceptor = sp.GetRequiredService<AuditLogInterceptor>();
            options.AddInterceptors(interceptor);
        });

        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<IUserRepository, Repositories.UserRepository>();
        services.AddScoped<INewsletterRepository, NewsletterRepository>();
        services.AddScoped<IAdminUserRepository, Repositories.AdminUserRepository>();
        services.AddScoped<IVnPayService, Services.VnPayService>();

        // Register Redis Distributed Cache (IDistributedCache — dùng cho caching showroom, dữ liệu ít thay đổi)
        var redisConnectionString = configuration.GetConnectionString("RedisConnection") ?? "localhost:6379";
        services.AddStackExchangeRedisCache(options =>
        {
            options.Configuration = redisConnectionString;
            options.InstanceName = "VinFastO2O_";
        });

        // Register Redis ConnectionMultiplexer for distributed locks
        services.AddSingleton<IConnectionMultiplexer>(_ => ConnectionMultiplexer.Connect(redisConnectionString));

        // Register Redis-based distributed lock service for vehicles
        services.AddSingleton<IVehicleLockService, Services.RedisLockService>();

        // Register Inventory Query Service
        services.AddScoped<IInventoryQueryService, Services.InventoryQueryService>();

        // ── JWT Token Service ─────────────────────────────────────────────────
        services.Configure<JwtSettings>(
            configuration.GetSection(JwtSettings.SectionName));
        services.AddSingleton<IJwtTokenService, Services.JwtTokenService>();

        // ── Email Service (MailKit / SMTP) ────────────────────────────────────
        // Bind strongly-typed settings from appsettings.json → "EmailSettings"
        services.Configure<EmailSettings>(
            configuration.GetSection(EmailSettings.SectionName));

        // Transient: SmtpClient is created per-send inside EmailService,
        // so EmailService itself can be Transient safely.
        services.AddTransient<IEmailService, Services.EmailService>();

        services.AddKafkaMessaging(configuration);

        return services;
    }
}
