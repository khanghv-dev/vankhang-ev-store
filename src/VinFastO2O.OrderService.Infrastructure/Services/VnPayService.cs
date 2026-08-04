using System.Security.Cryptography;
using System.Text;
using VinFastO2O.OrderService.Application.Common.Interfaces;
using VinFastO2O.OrderService.Application.DTOs;

namespace VinFastO2O.OrderService.Infrastructure.Services;

public class VnPayService : IVnPayService
{
    public string CreatePaymentUrl(OrderDto order, string ipAddress, string baseServerUrl, string hashSecret, string tmnCode)
    {
        var vnp_Params = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            { "vnp_Version", "2.1.0" },
            { "vnp_Command", "pay" },
            { "vnp_TmnCode", tmnCode },
            { "vnp_Amount", ((long)(order.DepositAmount * 100)).ToString() },
            { "vnp_CreateDate", DateTime.UtcNow.AddHours(7).ToString("yyyyMMddHHmmss") },
            { "vnp_CurrCode", "VND" },
            { "vnp_IpAddr", ipAddress },
            { "vnp_Locale", "vn" },
            { "vnp_OrderInfo", $"Thanh toan dat coc cho don hang {order.Id}" },
            { "vnp_OrderType", "other" },
            { "vnp_ReturnUrl", $"{baseServerUrl}/api/payments/vnpay-return" },
            { "vnp_TxnRef", order.Id.ToString() }
        };

        var secureHash = CalculateHash(vnp_Params, hashSecret);
        var rawData = string.Join("&", vnp_Params.Select(p => $"{p.Key}={Uri.EscapeDataString(p.Value)}"));

        var paymentUrl = $"{baseServerUrl}/api/payments/mock-gate?{rawData}&vnp_SecureHash={secureHash}";
        return paymentUrl;
    }

    public string CalculateHash(IDictionary<string, string> parameters, string hashSecret)
    {
        var sortedParams = new SortedDictionary<string, string>(parameters
            .Where(p => p.Key.StartsWith("vnp_") && p.Key != "vnp_SecureHash" && p.Key != "vnp_SecureHashType")
            .ToDictionary(p => p.Key, p => p.Value), StringComparer.Ordinal);

        var rawData = string.Join("&", sortedParams.Select(p => $"{p.Key}={Uri.EscapeDataString(p.Value)}"));
        return HmacSha512(hashSecret, rawData);
    }

    public bool VerifySignature(IDictionary<string, string> parameters, string secureHash, string hashSecret)
    {
        var calculatedHash = CalculateHash(parameters, hashSecret);
        return string.Equals(calculatedHash, secureHash, StringComparison.OrdinalIgnoreCase);
    }

    public Task<RefundResultDto> RefundAsync(Guid orderId, decimal amount, string hashSecret, string tmnCode, CancellationToken cancellationToken = default)
    {
        // Simulating VNPAY Refund API call (vnp_Command = refund)
        var refundTxnNo = $"RF-VNP-{Guid.NewGuid().ToString("N")[..12].ToUpper()}";
        var result = new RefundResultDto(
            IsSuccess: true,
            TransactionNo: refundTxnNo,
            Message: $"Giao dịch hoàn tiền cọc thành công qua cổng VNPAY. Mã GD hoàn: {refundTxnNo}"
        );

        return Task.FromResult(result);
    }

    private static string HmacSha512(string key, string inputData)
    {
        var hash = new StringBuilder();
        var keyBytes = Encoding.UTF8.GetBytes(key);
        var inputBytes = Encoding.UTF8.GetBytes(inputData);
        using (var hmac = new HMACSHA512(keyBytes))
        {
            var hashValue = hmac.ComputeHash(inputBytes);
            foreach (var theByte in hashValue)
            {
                hash.Append(theByte.ToString("x2"));
            }
        }
        return hash.ToString();
    }
}
