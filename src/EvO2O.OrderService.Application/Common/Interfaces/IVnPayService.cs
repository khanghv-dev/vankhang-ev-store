using EvO2O.OrderService.Application.DTOs;

namespace EvO2O.OrderService.Application.Common.Interfaces;

public interface IVnPayService
{
    string CreatePaymentUrl(OrderDto order, string ipAddress, string baseServerUrl, string hashSecret, string tmnCode, string? vnpayBaseUrl = null);
    bool VerifySignature(IDictionary<string, string> parameters, string secureHash, string hashSecret);
    string CalculateHash(IDictionary<string, string> parameters, string hashSecret);
    Task<RefundResultDto> RefundAsync(Guid orderId, decimal amount, string hashSecret, string tmnCode, CancellationToken cancellationToken = default);
}

public record RefundResultDto(bool IsSuccess, string TransactionNo, string Message);
