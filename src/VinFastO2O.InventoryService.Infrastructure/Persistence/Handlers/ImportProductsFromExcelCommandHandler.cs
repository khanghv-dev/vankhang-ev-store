using ExcelDataReader;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using VinFastO2O.InventoryService.Application.DTOs;
using VinFastO2O.InventoryService.Application.Products.Commands;
using VinFastO2O.InventoryService.Domain.Entities;

namespace VinFastO2O.InventoryService.Infrastructure.Persistence.Handlers;

public class ImportProductsFromExcelCommandHandler : IRequestHandler<ImportProductsFromExcelCommand, ImportResultDto>
{
    private readonly InventoryDbContext _dbContext;
    private readonly ILogger<ImportProductsFromExcelCommandHandler> _logger;

    public ImportProductsFromExcelCommandHandler(
        InventoryDbContext dbContext,
        ILogger<ImportProductsFromExcelCommandHandler> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<ImportResultDto> Handle(ImportProductsFromExcelCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Starting bulk product import from Excel stream.");
        var result = new ImportResultDto();

        if (request.FileStream == null || request.FileStream.Length == 0)
        {
            result.Errors.Add("File Excel tải lên trống hoặc không tìm thấy dữ liệu stream.");
            result.FailureCount = 0;
            return result;
        }

        try
        {
            // 1. Register CodePages encoding provider for older Excel files format and special characters encoding
            System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);

            // 2. Read the Excel file into DataSet
            using var reader = ExcelReaderFactory.CreateReader(request.FileStream);
            var dataSet = reader.AsDataSet(new ExcelDataSetConfiguration()
            {
                ConfigureDataTable = (_) => new ExcelDataTableConfiguration()
                {
                    UseHeaderRow = true
                }
            });

            if (dataSet.Tables.Count == 0)
            {
                result.Errors.Add("File Excel không chứa bất kỳ bảng tính (sheet) nào.");
                return result;
            }

            var table = dataSet.Tables[0];
            result.TotalRows = table.Rows.Count;

            if (table.Rows.Count == 0)
            {
                result.Errors.Add("Bảng tính đầu tiên trống, không chứa dữ liệu sản phẩm.");
                return result;
            }

            // 3. Find column headers index dynamically (supporting English & Vietnamese synonyms)
            int skuIdx = FindColumnIndex(table, "sku", "mã sku", "mã sản phẩm");
            int nameIdx = FindColumnIndex(table, "name", "tên", "tên sản phẩm");
            int categoryIdx = FindColumnIndex(table, "category", "phân loại", "loại");
            int priceIdx = FindColumnIndex(table, "price", "giá", "giá bán");
            int originalPriceIdx = FindColumnIndex(table, "originalprice", "giá gốc", "giá niêm yết");
            int imageIdx = FindColumnIndex(table, "image", "ảnh", "hình ảnh", "imageurl");
            int specsIdx = FindColumnIndex(table, "specs", "thông số", "thông số kỹ thuật");

            // Check essential columns
            if (skuIdx == -1 || nameIdx == -1 || categoryIdx == -1 || priceIdx == -1)
            {
                result.Errors.Add("Cấu trúc file Excel không hợp lệ. Các cột bắt buộc cần có: SKU (Mã SKU), Name (Tên), Category (Phân loại), Price (Giá bán).");
                return result;
            }

            var validProducts = new List<Product>();
            var processedSkus = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            // Get existing SKUs in PostgreSQL DB to check database-level duplicates
            var existingDbSkus = await _dbContext.Products
                .Select(p => p.Id)
                .ToListAsync(cancellationToken);
            var existingDbSkusSet = new HashSet<string>(existingDbSkus, StringComparer.OrdinalIgnoreCase);

            for (int i = 0; i < table.Rows.Count; i++)
            {
                var row = table.Rows[i];
                var rowNum = i + 2; // Row number 1 is header, so data starts from row 2

                // Skip completely empty rows
                if (IsRowEmpty(row))
                {
                    result.TotalRows--; // Don't count empty rows in total count
                    continue;
                }

                var sku = row[skuIdx]?.ToString()?.Trim();
                var name = row[nameIdx]?.ToString()?.Trim();
                var category = row[categoryIdx]?.ToString()?.Trim();
                var priceStr = row[priceIdx]?.ToString()?.Trim();
                var originalPriceStr = originalPriceIdx != -1 ? row[originalPriceIdx]?.ToString()?.Trim() : null;
                var imageUrl = imageIdx != -1 ? row[imageIdx]?.ToString()?.Trim() : null;
                var specs = specsIdx != -1 ? row[specsIdx]?.ToString()?.Trim() : null;

                var rowErrors = new List<string>();

                // Validation: SKU
                if (string.IsNullOrWhiteSpace(sku))
                {
                    rowErrors.Add("Mã SKU không được để trống.");
                }
                else
                {
                    sku = sku.ToLowerInvariant();
                    // Validation: Excel file duplicates check
                    if (processedSkus.Contains(sku))
                    {
                        rowErrors.Add($"Mã SKU '{sku}' đã xuất hiện trước đó trong file Excel.");
                    }
                    // Validation: Database duplicates check
                    else if (existingDbSkusSet.Contains(sku))
                    {
                        rowErrors.Add($"Mã SKU '{sku}' đã tồn tại trong cơ sở dữ liệu.");
                    }
                }

                // Validation: Name
                if (string.IsNullOrWhiteSpace(name))
                {
                    rowErrors.Add("Tên sản phẩm không được để trống.");
                }

                // Validation: Category
                if (string.IsNullOrWhiteSpace(category))
                {
                    rowErrors.Add("Phân loại không được để trống.");
                }

                // Validation: Price
                decimal price = 0;
                if (string.IsNullOrWhiteSpace(priceStr))
                {
                    rowErrors.Add("Giá bán không được để trống.");
                }
                else if (!decimal.TryParse(priceStr, out price) || price < 0)
                {
                    rowErrors.Add($"Giá bán '{priceStr}' không hợp lệ (phải là số thực lớn hơn hoặc bằng 0).");
                }

                // Validation: OriginalPrice
                decimal? originalPrice = null;
                if (!string.IsNullOrWhiteSpace(originalPriceStr))
                {
                    if (decimal.TryParse(originalPriceStr, out decimal origPrice))
                    {
                        if (origPrice < price)
                        {
                            rowErrors.Add($"Giá gốc '{originalPriceStr}' không được nhỏ hơn giá bán '{priceStr}'.");
                        }
                        else
                        {
                            originalPrice = origPrice;
                        }
                    }
                    else
                    {
                        rowErrors.Add($"Giá gốc '{originalPriceStr}' không hợp lệ.");
                    }
                }

                // If errors found in this row
                if (rowErrors.Any())
                {
                    result.FailureCount++;
                    foreach (var error in rowErrors)
                    {
                        result.Errors.Add($"Dòng {rowNum}: {error}");
                    }
                    continue;
                }

                // Format fields
                imageUrl ??= "https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=300";
                
                string? discountText = null;
                if (originalPrice.HasValue && originalPrice.Value > price && originalPrice.Value > 0)
                {
                    var percent = (int)Math.Round((originalPrice.Value - price) / originalPrice.Value * 100);
                    discountText = $"Giảm {percent}%";
                }

                var specsList = new List<string>();
                if (!string.IsNullOrWhiteSpace(specs))
                {
                    specsList.AddRange(specs.Split(new[] { ',', ';', '\n' }, StringSplitOptions.RemoveEmptyEntries).Select(s => s.Trim()));
                }
                var specsJson = JsonSerializer.Serialize(specsList);

                // Add to temporary collection and processed set
                var product = new Product(
                    sku!,
                    name!,
                    category!,
                    imageUrl,
                    price,
                    originalPrice,
                    discountText,
                    isNew: false,
                    inStock: true,
                    isActive: true,
                    batteryType: null,
                    batteryOption: null,
                    specsJson: specsJson
                );

                validProducts.Add(product);
                processedSkus.Add(sku!);
            }

            // 4. Batch/Bulk insert valid products into database
            if (validProducts.Any())
            {
                using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);
                try
                {
                    await _dbContext.Products.AddRangeAsync(validProducts, cancellationToken);
                    await _dbContext.SaveChangesAsync(cancellationToken);
                    await transaction.CommitAsync(cancellationToken);

                    result.SuccessCount = validProducts.Count;
                    _logger.LogInformation("Successfully bulk inserted {Count} products from Excel.", validProducts.Count);
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    _logger.LogError(ex, "Transaction failed while bulk inserting products.");
                    result.Errors.Add("Lỗi hệ thống khi ghi dữ liệu hàng loạt vào cơ sở dữ liệu. Toàn bộ dòng đã bị rollback.");
                    result.FailureCount += validProducts.Count;
                    result.SuccessCount = 0;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandle exception occurred during Excel product import.");
            result.Errors.Add($"Lỗi nghiêm trọng: {ex.Message}");
        }

        return result;
    }

    private static int FindColumnIndex(DataTable table, params string[] searchHeaders)
    {
        for (int i = 0; i < table.Columns.Count; i++)
        {
            var header = table.Columns[i].ColumnName?.Trim()?.ToLowerInvariant();
            if (string.IsNullOrEmpty(header)) continue;

            if (searchHeaders.Contains(header))
            {
                return i;
            }
        }
        return -1;
    }

    private static bool IsRowEmpty(DataRow row)
    {
        for (int i = 0; i < row.Table.Columns.Count; i++)
        {
            if (row[i] != null && !string.IsNullOrWhiteSpace(row[i].ToString()))
            {
                return false;
            }
        }
        return true;
    }
}
