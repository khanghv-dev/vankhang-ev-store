using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using VinFastO2O.OrderService.Domain.Entities;
using VinFastO2O.OrderService.Domain.States;

namespace VinFastO2O.OrderService.Infrastructure.Persistence;

public static class DbSeeder
{
    public static async Task SeedAsync(OrderDbContext db, ILogger logger, CancellationToken ct = default)
    {
        try
        {
            // Auto migrate database if pending
            if (db.Database.IsRelational())
            {
                await db.Database.MigrateAsync(ct);
            }

            // Clean up old test orders in PostgreSQL if existing
            var oldTestOrders = await db.Orders
                .Where(o => o.CustomerName.Contains("Nguyễn Văn A") || o.CustomerName.Contains("Nguyen Delivery Test"))
                .ToListAsync(ct);
            if (oldTestOrders.Any())
            {
                logger.LogInformation("Removing old test orders from PostgreSQL database...");
                db.Orders.RemoveRange(oldTestOrders);
                await db.SaveChangesAsync(ct);
            }

            // 1. Seed Showrooms
            if (!await db.Showrooms.AnyAsync(ct))
            {
                logger.LogInformation("Seeding VinFast Showrooms...");
                var showrooms = new List<Showroom>
                {
                    new("SR-HN-01", "VinFast Showroom Smart City", "Tòa S2.01, Vinhomes Smart City, Tây Mỗ, Nam Từ Liêm, Hà Nội", 21.0025, 105.7489, "1900 23 23 89", "08:00", "20:00"),
                    new("SR-HN-02", "VinFast Showroom Royal City", "Tầng B2, TTTM Vincom Mega Mall Royal City, Thanh Xuân, Hà Nội", 21.0031, 105.8152, "0968 123 456", "09:00", "21:30"),
                    new("SR-HCM-01", "VinFast Showroom Landmark 81", "TTTM Vincom Center Landmark 81, 720A Điện Biên Phủ, Bình Thạnh, TP.HCM", 10.7951, 106.7218, "1900 23 23 89", "09:30", "22:00"),
                    new("SR-HCM-02", "VinFast Showroom Thảo Điền", "Số 159 Xa Lộ Hà Nội, Thảo Điền, TP. Thủ Đức, TP.HCM", 10.8012, 106.7351, "0909 888 777", "08:00", "20:00"),
                    new("SR-DN-01", "VinFast Showroom Ngô Quyền Đà Nẵng", "910A Ngô Quyền, Sơn Trà, Đà Nẵng", 16.0682, 108.2325, "0236 398 9999", "08:00", "20:00"),
                    new("SR-HP-01", "VinFast Showroom Hải Phòng", "Số 1 Lê Hồng Phong, Ngô Quyền, Hải Phòng", 20.8651, 106.6838, "0225 388 8888", "08:00", "20:00"),
                    new("SR-CT-01", "VinFast Showroom Cần Thơ", "Số 209 30 Tháng 4, Xuân Khánh, Ninh Kiều, Cần Thơ", 10.0298, 105.7725, "0292 388 9999", "08:00", "20:00")
                };
                await db.Showrooms.AddRangeAsync(showrooms, ct);
            }

            // 2. Seed FAQs
            if (!await db.Faqs.AnyAsync(ct))
            {
                logger.LogInformation("Seeding VinFast FAQs...");
                var faqs = new List<Faq>
                {
                    new Faq
                    {
                        Id = Guid.NewGuid(),
                        Question = "Thủ tục đặt cọc xe điện VinFast trực tuyến cần những gì?",
                        Answer = "Quý khách chỉ cần chuẩn bị CCCD/CMND còn hiệu lực, số điện thoại và thẻ ngân hàng/ví điện tử để hoàn tất thanh toán tiền cọc trong 3 phút.",
                        Category = "Đặt cọc",
                        DisplayOrder = 1,
                        CreatedAt = DateTime.UtcNow
                    },
                    new Faq
                    {
                        Id = Guid.NewGuid(),
                        Question = "Hình thức thuê pin và mua đứt pin khác nhau thế nào?",
                        Answer = "Khách hàng có thể lựa chọn gói thuê pin linh hoạt/cố định hàng tháng để giảm chi phí đầu tư ban đầu hoặc chọn mua đứt pin sở hữu trọn đời.",
                        Category = "Pin",
                        DisplayOrder = 2,
                        CreatedAt = DateTime.UtcNow
                    },
                    new Faq
                    {
                        Id = Guid.NewGuid(),
                        Question = "Thời gian nhận xe dự kiến sau khi đặt cọc là bao lâu?",
                        Answer = "Thời gian giao xe phụ thuộc vào phiên bản và màu sắc lựa chọn, thông thường từ 7 đến 14 ngày làm việc đối với các dòng VF3, VF5.",
                        Category = "Giao xe",
                        DisplayOrder = 3,
                        CreatedAt = DateTime.UtcNow
                    },
                    new Faq
                    {
                        Id = Guid.NewGuid(),
                        Question = "Có thể đổi Showroom nhận xe sau khi đặt cọc không?",
                        Answer = "Quý khách hoàn toàn có thể yêu cầu thay đổi Showroom nhận xe bằng cách liên hệ tổng đài hotline 1900 23 23 89 trước khi VIN được gán cho đơn hàng.",
                        Category = "Showroom",
                        DisplayOrder = 4,
                        CreatedAt = DateTime.UtcNow
                    }
                };
                await db.Faqs.AddRangeAsync(faqs, ct);
            }

            // 3. Seed Articles
            if (!await db.Articles.AnyAsync(ct))
            {
                logger.LogInformation("Seeding VinFast Articles...");
                var authorId = Guid.NewGuid();
                var articles = new List<Article>
                {
                    new Article(
                        "VinFast Bàn Giao Lô Xe VF3 Đầu Tiên Cho Khách Hàng Toàn Quốc",
                        "vinfast-ban-giao-lo-xe-vf3-dau-tien",
                        "Sự kiện bàn giao xe điện VF3 thu hút hàng ngàn khách hàng tham dự với nhiều ưu đãi hấp dẫn và cam kết chất lượng dịch vụ chuẩn 3S toàn quốc.",
                        "/images/news/vf3-delivery.jpg",
                        "Published",
                        authorId
                    ),
                    new Article(
                        "Chương Trình Ưu Đãi Đặc Biệt Đặt Cọc VF8 & VF9 Trong Tháng",
                        "chuong-trinh-uu-dai-dac-biet-dat-coc-vf8-vf9",
                        "Nhận ngay voucher miễn phí sạc pin 1 năm tại tất cả các trạm sạc V-GREEN và gói dịch vụ hậu mãi cao cấp khi đặt cọc xe điện VinFast.",
                        "/images/news/promo-vf8.jpg",
                        "Published",
                        authorId
                    )
                };
                await db.Articles.AddRangeAsync(articles, ct);
            }

            // Save seeds
            await db.SaveChangesAsync(ct);
            logger.LogInformation("DbSeeder completed successfully.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error occurred during DbSeeder execution.");
        }
    }
}
