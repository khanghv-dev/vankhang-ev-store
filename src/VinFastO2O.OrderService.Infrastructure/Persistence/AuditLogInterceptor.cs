using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using VinFastO2O.OrderService.Domain.Entities;

namespace VinFastO2O.OrderService.Infrastructure.Persistence;

public sealed class AuditLogInterceptor : SaveChangesInterceptor
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuditLogInterceptor(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        if (eventData.Context is null)
        {
            return await base.SavingChangesAsync(eventData, result, cancellationToken);
        }

        var auditLogs = GetAuditLogs(eventData.Context);
        if (auditLogs.Count > 0)
        {
            await eventData.Context.Set<AuditLog>().AddRangeAsync(auditLogs, cancellationToken);
        }

        return await base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData,
        InterceptionResult<int> result)
    {
        if (eventData.Context is null)
        {
            return base.SavingChanges(eventData, result);
        }

        var auditLogs = GetAuditLogs(eventData.Context);
        if (auditLogs.Count > 0)
        {
            eventData.Context.Set<AuditLog>().AddRange(auditLogs);
        }

        return base.SavingChanges(eventData, result);
    }

    private List<AuditLog> GetAuditLogs(DbContext context)
    {
        var entries = context.ChangeTracker.Entries()
            .Where(e => e.State is EntityState.Added or EntityState.Modified or EntityState.Deleted)
            .ToList();

        if (entries.Count == 0)
        {
            return [];
        }

        var httpContext = _httpContextAccessor.HttpContext;
        var username = httpContext?.User?.FindFirst(ClaimTypes.Name)?.Value 
                       ?? httpContext?.User?.FindFirst("unique_name")?.Value 
                       ?? "System";
                       
        var ipAddress = httpContext?.Connection?.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        var userAgent = httpContext?.Request?.Headers["User-Agent"].ToString();

        var auditLogs = new List<AuditLog>();

        foreach (var entry in entries)
        {
            var entityType = entry.Entity.GetType();
            var entityName = entityType.Name;

            // Handle EF dynamic proxy types naming (e.g., CastToSomethingProxy)
            if (entityName.Contains("Proxy"))
            {
                entityName = entityType.BaseType?.Name ?? entityName;
            }

            // Exclude logs and outbox events to prevent infinite logging loop
            if (entry.Entity is AuditLog || entry.Entity is OutboxEvent || entityName == nameof(AuditLog) || entityName == nameof(OutboxEvent))
            {
                continue;
            }

            var action = entry.State switch
            {
                EntityState.Added => $"CREATE_{entityName.ToUpperInvariant()}",
                EntityState.Modified => $"UPDATE_{entityName.ToUpperInvariant()}",
                EntityState.Deleted => $"DELETE_{entityName.ToUpperInvariant()}",
                _ => "UNKNOWN"
            };

            var descriptionBuilder = new StringBuilder();
            descriptionBuilder.Append($"Admin performed {action} on {entityName}. ");

            // Fetch primary keys
            var keyValues = entry.Properties
                .Where(p => p.Metadata.IsPrimaryKey())
                .Select(p => $"{p.Metadata.Name}: {p.CurrentValue}")
                .ToList();
            descriptionBuilder.Append($"[Keys: {string.Join(", ", keyValues)}] ");

            if (entry.State == EntityState.Modified)
            {
                var modifiedProps = entry.Properties
                    .Where(p => p.IsModified)
                    .Select(p => $"{p.Metadata.Name} ({p.OriginalValue} -> {p.CurrentValue})")
                    .ToList();
                if (modifiedProps.Count > 0)
                {
                    descriptionBuilder.Append($"Modified: {string.Join(", ", modifiedProps)}");
                }
            }
            else if (entry.State == EntityState.Added)
            {
                var properties = entry.Properties
                    .Where(p => p.CurrentValue != null)
                    .Select(p => $"{p.Metadata.Name}: {p.CurrentValue}")
                    .ToList();
                descriptionBuilder.Append($"Initial State: {string.Join(", ", properties)}");
            }

            var auditLog = new AuditLog(username, action, descriptionBuilder.ToString(), ipAddress, userAgent);
            auditLogs.Add(auditLog);
        }

        return auditLogs;
    }
}
