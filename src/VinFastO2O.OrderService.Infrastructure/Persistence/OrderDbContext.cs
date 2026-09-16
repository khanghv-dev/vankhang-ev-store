using Microsoft.EntityFrameworkCore;
using System.Reflection;
using VinFastO2O.OrderService.Domain.Entities;

namespace VinFastO2O.OrderService.Infrastructure.Persistence;

public class OrderDbContext : DbContext
{
    public OrderDbContext(DbContextOptions<OrderDbContext> options) : base(options)
    {
    }

    public DbSet<Order>     Orders     => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Payment>   Payments   => Set<Payment>();
    public DbSet<User>      Users      => Set<User>();
    public DbSet<NewsletterSubscriber> NewsletterSubscribers => Set<NewsletterSubscriber>();
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();
    public DbSet<Role>      Roles      => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<AdminRefreshToken> AdminRefreshTokens => Set<AdminRefreshToken>();
    public DbSet<Article>   Articles   => Set<Article>();
    public DbSet<Faq>       Faqs       => Set<Faq>();
    public DbSet<Showroom>  Showrooms  => Set<Showroom>();
    public DbSet<AuditLog>  AuditLogs  => Set<AuditLog>();
    public DbSet<BatteryHealthReport> BatteryHealthReports => Set<BatteryHealthReport>();
    public DbSet<OutboxEvent> OutboxEvents => Set<OutboxEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        base.OnModelCreating(modelBuilder);
    }
}
