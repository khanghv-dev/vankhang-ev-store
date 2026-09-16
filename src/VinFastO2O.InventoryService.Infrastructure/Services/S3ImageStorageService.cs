using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using System;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using VinFastO2O.InventoryService.Application.Common.Interfaces;

namespace VinFastO2O.InventoryService.Infrastructure.Services;

public class S3ImageStorageService : IImageStorageService
{
    private readonly S3Settings _settings;
    private readonly ILogger<S3ImageStorageService> _logger;

    public S3ImageStorageService(IOptions<S3Settings> settings, ILogger<S3ImageStorageService> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task<string> UploadImageAsync(Stream imageStream, string fileName, string contentType, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Processing image upload: {FileName}, ContentType: {ContentType}", fileName, contentType);

        // 1. Validate extension
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(extension))
        {
            throw new ArgumentException($"Unsupported file format: {extension}. Allowed formats are: JPG, JPEG, PNG, WEBP, GIF.");
        }

        // 2. Transcode / compress
        using var outputStream = new MemoryStream();
        string targetExtension;
        string targetContentType;

        if (extension == ".gif")
        {
            // Do not deconstruct animated gifs, copy as-is
            await imageStream.CopyToAsync(outputStream, cancellationToken);
            targetExtension = ".gif";
            targetContentType = "image/gif";
        }
        else
        {
            // Load and compress other standard image formats to high-quality JPEG
            using (var image = await Image.LoadAsync(imageStream, cancellationToken))
            {
                var encoder = new JpegEncoder
                {
                    Quality = 75 // Standard e-commerce size-quality compromise
                };
                await image.SaveAsJpegAsync(outputStream, encoder, cancellationToken);
            }
            targetExtension = ".jpg";
            targetContentType = "image/jpeg";
        }

        outputStream.Position = 0;
        var newFileName = $"{Guid.NewGuid()}{targetExtension}";

        // 3. Upload to S3/MinIO
        _logger.LogInformation("Uploading file {NewFileName} to S3/MinIO bucket {Bucket}", newFileName, _settings.BucketName);
        
        using (var s3Client = CreateS3Client())
        {
            var putRequest = new PutObjectRequest
            {
                BucketName = _settings.BucketName,
                Key = newFileName,
                InputStream = outputStream,
                ContentType = targetContentType,
                CannedACL = S3CannedACL.PublicRead
            };

            await s3Client.PutObjectAsync(putRequest, cancellationToken);
        }

        // 4. Construct absolute public URL
        string publicUrl;
        if (!string.IsNullOrWhiteSpace(_settings.PublicUrlPrefix))
        {
            publicUrl = $"{_settings.PublicUrlPrefix.TrimEnd('/')}/{newFileName}";
        }
        else
        {
            publicUrl = $"{_settings.ServiceUrl.TrimEnd('/')}/{_settings.BucketName}/{newFileName}";
        }

        _logger.LogInformation("Successfully uploaded and generated public absolute URL: {Url}", publicUrl);
        return publicUrl;
    }

    private AmazonS3Client CreateS3Client()
    {
        var config = new AmazonS3Config();
        
        if (!string.IsNullOrWhiteSpace(_settings.ServiceUrl))
        {
            config.ServiceURL = _settings.ServiceUrl;
            config.ForcePathStyle = true; // Required for MinIO path style
        }
        else
        {
            config.RegionEndpoint = Amazon.RegionEndpoint.GetBySystemName(_settings.Region);
        }

        return new AmazonS3Client(_settings.AccessKey, _settings.SecretKey, config);
    }
}
