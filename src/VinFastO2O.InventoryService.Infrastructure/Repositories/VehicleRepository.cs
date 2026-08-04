using Microsoft.EntityFrameworkCore;
using VinFastO2O.InventoryService.Application.Common.Interfaces;
using VinFastO2O.InventoryService.Domain.Entities;
using VinFastO2O.InventoryService.Domain.Enums;
using VinFastO2O.InventoryService.Domain.ValueObjects;
using VinFastO2O.InventoryService.Infrastructure.Persistence;

namespace VinFastO2O.InventoryService.Infrastructure.Repositories;

public class VehicleRepository : IVehicleRepository
{
    private readonly InventoryDbContext _context;

    public VehicleRepository(InventoryDbContext context)
    {
        _context = context;
    }

    public async Task<Vehicle?> GetByIdAsync(VehicleId id, CancellationToken cancellationToken = default)
    {
        return await _context.Vehicles.FirstOrDefaultAsync(v => v.Id == id, cancellationToken);
    }

    public async Task<Vehicle?> GetFirstAvailableAsync(string modelName, StoreId storeId, CancellationToken cancellationToken = default)
    {
        return await _context.Vehicles
            .Where(v => v.StoreId == storeId && 
                        v.Status == VehicleStatus.Available && 
                        EF.Functions.ILike(v.ModelName, modelName))
            .OrderBy(v => v.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task UpdateAsync(Vehicle vehicle, CancellationToken cancellationToken = default)
    {
        _context.Vehicles.Update(vehicle);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<Vehicle?> GetByVinAsync(Vin vin, CancellationToken cancellationToken = default)
    {
        return await _context.Vehicles.FirstOrDefaultAsync(v => v.Vin == vin, cancellationToken);
    }

    public async Task<Vehicle?> ReserveFirstAvailableAsync(
        string modelName,
        StoreId storeId,
        string performedBy,
        InventoryLogId logId,
        CancellationToken cancellationToken = default)
    {
        // Start a database transaction to encapsulate the SELECT FOR UPDATE and status modification
        using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            // Query with FOR UPDATE acquires a row-level pessimistic lock in PostgreSQL.
            // Other concurrent requests trying to lock the same row will be blocked until this transaction completes.
            var vehicle = await _context.Vehicles
                .FromSqlRaw(@"
                    SELECT * 
                    FROM vehicles v 
                    WHERE v.""StoreId"" = {0} 
                      AND v.""Status"" = {1} 
                      AND v.""ModelName"" ILIKE {2} 
                    ORDER BY v.""CreatedAt"" 
                    LIMIT 1 
                    FOR UPDATE",
                    storeId.Value, (int)VehicleStatus.Available, modelName)
                .FirstOrDefaultAsync(cancellationToken);

            if (vehicle == null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return null;
            }

            // Update state
            vehicle.UpdateStatus(VehicleStatus.Reserved);
            _context.Vehicles.Update(vehicle);

            // Add Audit Log
            var log = new InventoryLog(
                logId,
                vehicle.Id,
                storeId,
                null,
                InventoryAction.StatusChange,
                performedBy,
                $"Allocated vehicle VIN {vehicle.Vin} with Pessimistic Lock (FOR UPDATE). Status changed to RESERVED."
            );
            await _context.InventoryLogs.AddAsync(log, cancellationToken);

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return vehicle;
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
