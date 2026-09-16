using VinFastO2O.InventoryService.Application.Common.Interfaces;
using VinFastO2O.InventoryService.Application.DTOs;
using VinFastO2O.InventoryService.Domain.Entities;
using VinFastO2O.InventoryService.Domain.Enums;
using VinFastO2O.InventoryService.Domain.ValueObjects;

namespace VinFastO2O.InventoryService.Application.Services;

public class VehicleAllocationService : IVehicleAllocationService
{
    private readonly ICatalogService _catalogService;
    private readonly IVehicleRepository _vehicleRepository;
    private readonly IStoreRepository _storeRepository;
    private readonly IInventoryLogRepository _inventoryLogRepository;

    public VehicleAllocationService(
        ICatalogService catalogService,
        IVehicleRepository vehicleRepository,
        IStoreRepository storeRepository,
        IInventoryLogRepository inventoryLogRepository)
    {
        _catalogService = catalogService;
        _vehicleRepository = vehicleRepository;
        _storeRepository = storeRepository;
        _inventoryLogRepository = inventoryLogRepository;
    }

    public async Task<AllocationResultDto> ReserveVehicleAsync(
        string productId,
        Guid storeId,
        string performedBy,
        CancellationToken cancellationToken = default)
    {
        // 1. Fetch Product details from MongoDB (via CatalogService)
        var product = await _catalogService.GetByIdAsync(productId, cancellationToken);
        if (product == null)
        {
            throw new KeyNotFoundException($"Product with ID '{productId}' was not found in catalog.");
        }

        // 2. Verify Store exists in PostgreSQL
        var typedStoreId = new StoreId(storeId);
        var store = await _storeRepository.GetByIdAsync(typedStoreId, cancellationToken);
        if (store == null)
        {
            throw new KeyNotFoundException($"Store with ID '{storeId}' was not found.");
        }

        // 3. Reserve the first available vehicle with pessimistic lock (atomic database transaction)
        var logId = InventoryLogId.New();
        var vehicle = await _vehicleRepository.ReserveFirstAvailableAsync(
            product.Name, 
            typedStoreId, 
            performedBy, 
            logId, 
            cancellationToken);

        if (vehicle == null)
        {
            throw new InvalidOperationException($"No available vehicles of model '{product.Name}' found at store '{store.Name}'.");
        }

        // 4. Return mapped result
        return new AllocationResultDto
        {
            VehicleId = vehicle.Id.Value,
            Vin = vehicle.Vin.Value,
            EngineNumber = vehicle.EngineNumber.Value,
            ModelName = vehicle.ModelName,
            Color = vehicle.Color,
            Status = vehicle.Status.ToString(),
            StoreId = store.Id.Value,
            LogId = logId.Value
        };
    }

    public async Task<AllocationResultDto> ReserveVinAsync(
        string vin,
        Guid storeId,
        string performedBy,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(vin))
        {
            throw new ArgumentException("Mã VIN không được để trống.", nameof(vin));
        }

        var vinObj = new Vin(vin);
        var vehicle = await _vehicleRepository.GetByVinAsync(vinObj, cancellationToken);
        if (vehicle == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy xe với số VIN: {vin} trong hệ thống.");
        }

        if (vehicle.Status == VehicleStatus.Sold)
        {
            throw new InvalidOperationException($"Không thể giữ kho xe với số VIN {vin} vì xe đã được bán (SOLD).");
        }

        if (vehicle.Status == VehicleStatus.Reserved)
        {
            throw new InvalidOperationException($"Không thể giữ kho xe với số VIN {vin} vì xe đã được giữ (RESERVED) trước đó.");
        }

        if (vehicle.Status == VehicleStatus.Maintenance || vehicle.Status == VehicleStatus.Damaged)
        {
            throw new InvalidOperationException($"Không thể giữ kho xe với số VIN {vin} vì xe đang ở trạng thái {vehicle.Status}.");
        }

        var storeIdObj = new StoreId(storeId);
        var store = await _storeRepository.GetByIdAsync(storeIdObj, cancellationToken);
        if (store == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy showroom/cửa hàng với ID {storeId}.");
        }

        // Update status to Reserved and assign to store
        vehicle.UpdateStatus(VehicleStatus.Reserved);
        vehicle.AssignToStore(storeIdObj);
        await _vehicleRepository.UpdateAsync(vehicle, cancellationToken);

        // Add Audit Inventory Log
        var logId = InventoryLogId.New();
        var log = new InventoryLog(
            logId,
            vehicle.Id,
            storeIdObj,
            null,
            InventoryAction.StatusChange,
            performedBy,
            $"Giữ kho số VIN {vin} trực tiếp. Chuyển trạng thái sang RESERVED."
        );
        await _inventoryLogRepository.AddAsync(log, cancellationToken);

        return new AllocationResultDto
        {
            VehicleId = vehicle.Id.Value,
            Vin = vehicle.Vin.Value,
            EngineNumber = vehicle.EngineNumber.Value,
            ModelName = vehicle.ModelName,
            Color = vehicle.Color,
            Status = vehicle.Status.ToString(),
            StoreId = store.Id.Value,
            LogId = logId.Value
        };
    }
}
