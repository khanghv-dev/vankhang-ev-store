using Microsoft.EntityFrameworkCore;
using System.Reflection;
using VinFastO2O.InventoryService.Domain.Entities;

namespace VinFastO2O.InventoryService.Infrastructure.Persistence;

public class InventoryDbContext : DbContext
{
    public InventoryDbContext(DbContextOptions<InventoryDbContext> options) : base(options)
    {
    }

    public DbSet<Store> Stores => Set<Store>();
    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<InventoryLog> InventoryLogs => Set<InventoryLog>();
    public DbSet<InventoryItem> InventoryItems => Set<InventoryItem>();
    public DbSet<Product> Products => Set<Product>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        base.OnModelCreating(modelBuilder);
    }
}
