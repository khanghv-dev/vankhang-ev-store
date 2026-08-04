using VinFastO2O.InventoryService.Application.Common.Interfaces;
using VinFastO2O.InventoryService.Application.DTOs;
using VinFastO2O.InventoryService.Domain.Entities;
using VinFastO2O.InventoryService.Domain.Enums;
using VinFastO2O.InventoryService.Domain.ValueObjects;

namespace VinFastO2O.InventoryService.Application.Services;

public class PosShowroomService : IPosShowroomService
{
    private readonly IVehicleRepository _vehicleRepository;
    private readonly IInventoryLogRepository _inventoryLogRepository;
    private readonly IStoreRepository _storeRepository;

    public PosShowroomService(
        IVehicleRepository vehicleRepository,
        IInventoryLogRepository inventoryLogRepository,
        IStoreRepository storeRepository)
    {
        _vehicleRepository = vehicleRepository;
        _inventoryLogRepository = inventoryLogRepository;
        _storeRepository = storeRepository;
    }

    public async Task<PosReleaseResultDto> ReleaseVehicleAndActivateWarrantyAsync(
        PosReleaseRequestDto request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Vin))
        {
            return new PosReleaseResultDto(false, "Mã VIN không được để trống.", string.Empty, string.Empty, string.Empty, string.Empty, string.Empty, string.Empty, string.Empty, string.Empty, string.Empty, DateTime.MinValue, DateTime.MinValue, string.Empty);
        }

        Vin vinObj;
        try
        {
            vinObj = new Vin(request.Vin);
        }
        catch (ArgumentException ex)
        {
            return new PosReleaseResultDto(false, $"Mã VIN không hợp lệ: {ex.Message}", string.Empty, string.Empty, string.Empty, string.Empty, string.Empty, string.Empty, string.Empty, string.Empty, string.Empty, DateTime.MinValue, DateTime.MinValue, string.Empty);
        }

        var vehicle = await _vehicleRepository.GetByVinAsync(vinObj, cancellationToken);
        if (vehicle == null)
        {
            return new PosReleaseResultDto(false, $"Không tìm thấy xe với số VIN: {vinObj.Value} trong hệ thống.", string.Empty, string.Empty, string.Empty, string.Empty, string.Empty, string.Empty, string.Empty, string.Empty, string.Empty, DateTime.MinValue, DateTime.MinValue, string.Empty);
        }

        if (vehicle.Status == VehicleStatus.Sold)
        {
            return new PosReleaseResultDto(false, $"Xe với số VIN {vinObj.Value} đã được bàn giao (SOLD) trước đó.", string.Empty, string.Empty, string.Empty, string.Empty, string.Empty, string.Empty, string.Empty, string.Empty, string.Empty, DateTime.MinValue, DateTime.MinValue, string.Empty);
        }

        if (vehicle.Status == VehicleStatus.Maintenance || vehicle.Status == VehicleStatus.Damaged)
        {
            return new PosReleaseResultDto(false, $"Xe hiện đang ở trạng thái {vehicle.Status.ToString().ToUpper()}, không thể thực hiện xuất kho.", string.Empty, string.Empty, string.Empty, string.Empty, string.Empty, string.Empty, string.Empty, string.Empty, string.Empty, DateTime.MinValue, DateTime.MinValue, string.Empty);
        }

        // Change status to Sold
        vehicle.UpdateStatus(VehicleStatus.Sold);
        await _vehicleRepository.UpdateAsync(vehicle, cancellationToken);

        // Save Inventory Log
        var log = new InventoryLog(
            InventoryLogId.New(),
            vehicle.Id,
            vehicle.StoreId,
            null,
            InventoryAction.Export,
            request.StaffName,
            $"Xuất kho bàn giao trực tiếp tại showroom cho KH {request.CustomerName} (SĐT: {request.CustomerPhone}). Kích hoạt bảo hành điện tử."
        );
        await _inventoryLogRepository.AddAsync(log, cancellationToken);

        // Fetch Store Name
        string storeName = "Showroom VinFast";
        if (vehicle.StoreId != null)
        {
            var store = await _storeRepository.GetByIdAsync(vehicle.StoreId, cancellationToken);
            if (store != null)
            {
                storeName = store.Name;
            }
        }

        // Warranty Details
        var warrantyId = Guid.NewGuid().ToString("D").ToUpperInvariant();
        var activationDate = DateTime.UtcNow;
        var expiryDate = activationDate.AddYears(10); // Standard 10-year warranty for VinFast EV
        var warrantyDuration = "10 Years or 200,000 km";

        // Build warranty certificate view URL
        var certificateUrl = $"/api/warranty/certificate?vin={Uri.EscapeDataString(vehicle.Vin.Value)}&customerName={Uri.EscapeDataString(request.CustomerName)}&customerPhone={Uri.EscapeDataString(request.CustomerPhone)}&modelName={Uri.EscapeDataString(vehicle.ModelName)}&engineNumber={Uri.EscapeDataString(vehicle.EngineNumber.Value)}&storeName={Uri.EscapeDataString(storeName)}&warrantyId={Uri.EscapeDataString(warrantyId)}&activationDate={Uri.EscapeDataString(activationDate.ToString("yyyy-MM-dd HH:mm:ss"))}&expiryDate={Uri.EscapeDataString(expiryDate.ToString("yyyy-MM-dd HH:mm:ss"))}";

        return new PosReleaseResultDto(
            Success: true,
            Message: "Xuất kho xe thành công và kích hoạt bảo hành điện tử e-Warranty.",
            Vin: vehicle.Vin.Value,
            ModelName: vehicle.ModelName,
            Color: vehicle.Color,
            EngineNumber: vehicle.EngineNumber.Value,
            StoreName: storeName,
            CustomerName: request.CustomerName,
            CustomerPhone: request.CustomerPhone,
            WarrantyId: warrantyId,
            WarrantyDuration: warrantyDuration,
            ActivationDate: activationDate,
            ExpiryDate: expiryDate,
            CertificateUrl: certificateUrl
        );
    }
}
