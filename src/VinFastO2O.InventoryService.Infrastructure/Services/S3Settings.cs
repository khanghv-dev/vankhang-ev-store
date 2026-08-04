namespace VinFastO2O.InventoryService.Infrastructure.Services;

public class S3Settings
{
    public string ServiceUrl { get; set; } = string.Empty;
    public string AccessKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public string BucketName { get; set; } = "vinfast-product-images";
    public string Region { get; set; } = "ap-southeast-1";
    public string PublicUrlPrefix { get; set; } = string.Empty;
}
