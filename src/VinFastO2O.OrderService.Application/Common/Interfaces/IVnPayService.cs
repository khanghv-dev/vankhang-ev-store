using VinFastO2O.OrderService.Application.DTOs;

namespace VinFastO2O.OrderService.Application.Common.Interfaces;

public interface IVnPayService
{
    string CreatePaymentUrl(OrderDto order, string ipAddress, string baseServerUrl, string hashSecret, string tmnCode);
    bool VerifySignature(IDictionary<string, string> parameters, string secureHash, string hashSecret);
    string CalculateHash(IDictionary<string, string> parameters, string hashSecret);
    Task<RefundResultDto> RefundAsync(Guid orderId, decimal amount, string hashSecret, string tmnCode, CancellationToken cancellationToken = default);
}

public record RefundResultDto(bool IsSuccess, string TransactionNo, string Message);
