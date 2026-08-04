using Microsoft.Extensions.DependencyInjection;
using VinFastO2O.OrderService.Application.Common.Interfaces;
using VinFastO2O.OrderService.Application.Services;

namespace VinFastO2O.OrderService.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IOrderService, Services.OrderService>();
        
        // Register MediatR handlers from the current assembly
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly));
        
        return services;
    }
}
