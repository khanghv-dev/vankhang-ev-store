using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace VinFastO2O.InventoryService.Application.Common.Interfaces;

public interface IImageStorageService
{
    /// <summary>
    /// Validates, compresses, renames, and uploads an image to cloud storage.
    /// </summary>
    /// <param name="imageStream">The stream of the image file.</param>
    /// <param name="fileName">The original name of the file.</param>
    /// <param name="contentType">The MIME type of the file.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The public absolute URL of the uploaded image.</returns>
    Task<string> UploadImageAsync(Stream imageStream, string fileName, string contentType, CancellationToken cancellationToken = default);
}
