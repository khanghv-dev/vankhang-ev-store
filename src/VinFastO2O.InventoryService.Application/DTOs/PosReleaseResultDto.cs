namespace VinFastO2O.InventoryService.Application.DTOs;

public record PosReleaseResultDto(
    bool Success,
    string Message,
    string Vin,
    string ModelName,
    string Color,
    string EngineNumber,
    string StoreName,
    string CustomerName,
    string CustomerPhone,
    string WarrantyId,
    string WarrantyDuration,
    DateTime ActivationDate,
    DateTime ExpiryDate,
    string CertificateUrl
);
