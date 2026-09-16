using System.Security.Cryptography;
using System.Text;
using VinFastO2O.OrderService.Application.Common.Interfaces;
using VinFastO2O.OrderService.Application.DTOs;

namespace VinFastO2O.OrderService.Infrastructure.Services;

public class VnPayService : IVnPayService
{
    public string CreatePaymentUrl(OrderDto order, string ipAddress, string baseServerUrl, string hashSecret, string tmnCode, string? vnpayBaseUrl = null)
    {
        var cleanTmnCode = (tmnCode ?? "").Trim();
        var cleanHashSecret = (hashSecret ?? "").Trim();

        if (string.IsNullOrEmpty(cleanTmnCode))
        {
            throw new ArgumentException("VNPay TmnCode (vnp_TmnCode) không được để trống.");
        }

        var clientIp = string.IsNullOrWhiteSpace(ipAddress) || ipAddress == "::1" ? "127.0.0.1" : ipAddress;

        var vnp_Params = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            { "vnp_Version", "2.1.0" },
            { "vnp_Command", "pay" },
            { "vnp_TmnCode", cleanTmnCode },
            { "vnp_Amount", ((long)(order.DepositAmount * 100)).ToString() },
            { "vnp_CreateDate", DateTime.UtcNow.AddHours(7).ToString("yyyyMMddHHmmss") },
            { "vnp_CurrCode", "VND" },
            { "vnp_IpAddr", clientIp },
            { "vnp_Locale", "vn" },
            { "vnp_OrderInfo", $"Thanh toan dat coc don hang {order.Id}" },
            { "vnp_OrderType", "other" },
            { "vnp_ReturnUrl", $"{baseServerUrl}/api/payments/vnpay-return" },
            { "vnp_TxnRef", order.Id.ToString() }
        };

        var secureHash = CalculateHash(vnp_Params, cleanHashSecret);
        var rawData = string.Join("&", vnp_Params.Select(p => $"{p.Key}={Uri.EscapeDataString(p.Value)}"));

        var gatewayUrl = !string.IsNullOrWhiteSpace(vnpayBaseUrl) 
            ? vnpayBaseUrl 
            : "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

        var paymentUrl = $"{gatewayUrl}?{rawData}&vnp_SecureHash={secureHash}";
        return paymentUrl;
    }

    public string CalculateHash(IDictionary<string, string> parameters, string hashSecret)
    {
        var cleanHashSecret = (hashSecret ?? "").Trim();
        var sortedParams = new SortedDictionary<string, string>(parameters
            .Where(p => p.Key.StartsWith("vnp_") && p.Key != "vnp_SecureHash" && p.Key != "vnp_SecureHashType")
            .ToDictionary(p => p.Key, p => p.Value), StringComparer.Ordinal);

        var rawData = string.Join("&", sortedParams.Select(p => $"{p.Key}={Uri.EscapeDataString(p.Value)}"));
        return HmacSha512(cleanHashSecret, rawData);
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
