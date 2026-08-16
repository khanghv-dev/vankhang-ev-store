using Microsoft.Extensions.DependencyInjection;
using EvO2O.InventoryService.Application.Common.Interfaces;
using EvO2O.InventoryService.Application.Services;

namespace EvO2O.InventoryService.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IInventoryService, Services.InventoryService>();
        services.AddScoped<IVehicleAllocationService, Services.VehicleAllocationService>();
        services.AddScoped<IPosShowroomService, Services.PosShowroomService>();
        return services;
    }
}
