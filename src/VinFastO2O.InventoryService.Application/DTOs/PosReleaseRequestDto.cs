namespace VinFastO2O.InventoryService.Application.DTOs;

public record PosReleaseRequestDto(
    string Vin,
    string CustomerName,
    string CustomerPhone,
    string CustomerEmail,
    string CustomerIdCard,
    string StaffName
);
