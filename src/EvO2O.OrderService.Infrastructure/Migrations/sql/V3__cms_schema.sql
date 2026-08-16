-- =============================================================================
-- VINFAST O2O E-COMMERCE PLATFORM
-- Database Migration Script: CMS Schema (Articles & FAQs)
-- DBMS: PostgreSQL 14+
-- Script: V3__cms_schema.sql
-- Description: Tạo các bảng cho phân hệ CMS Tin tức/Bài viết và Câu hỏi thường gặp
-- =============================================================================

-- Kích hoạt extension hỗ trợ tạo UUID ngẫu nhiên (nếu chưa có)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. BẢNG ARTICLES (Bài viết / Tin tức CMS)
-- =============================================================================
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_thumbnail VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'Draft',
    view_count INT NOT NULL DEFAULT 0,
    author_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ,

    -- Ràng buộc kiểm tra trạng thái bài viết
    CONSTRAINT chk_articles_status CHECK (status IN ('Draft', 'Published')),
    
    -- Ràng buộc lượt xem không được âm
    CONSTRAINT chk_articles_view_count CHECK (view_count >= 0),
    
    -- Ràng buộc duy nhất cho đường dẫn Slug SEO
    CONSTRAINT uq_articles_slug UNIQUE (slug)
);

-- Tạo chỉ mục (Indexes) tối ưu hóa truy vấn bài viết
CREATE INDEX IF NOT EXISTS idx_articles_status_created_at ON articles(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);

-- Thêm ghi chú cho bảng và các cột của Articles
COMMENT ON TABLE articles IS 'Bảng lưu trữ thông tin các bài viết, tin tức khuyến mãi và đánh giá xe điện CMS';
COMMENT ON COLUMN articles.id IS 'Mã định danh duy nhất của bài viết (UUID)';
COMMENT ON COLUMN articles.title IS 'Tiêu đề bài viết (tối đa 255 ký tự)';
COMMENT ON COLUMN articles.slug IS 'Đường dẫn chuẩn SEO duy nhất (URL friendly slug)';
COMMENT ON COLUMN articles.content IS 'Nội dung chi tiết bài viết (định dạng HTML / Markdown)';
COMMENT ON COLUMN articles.image_thumbnail IS 'Đường dẫn URL ảnh đại diện (thumbnail)';
COMMENT ON COLUMN articles.status IS 'Trạng thái xuất bản: Draft (Bản nháp), Published (Đã xuất bản)';
COMMENT ON COLUMN articles.view_count IS 'Số lượt xem bài viết';
COMMENT ON COLUMN articles.author_id IS 'ID tác giả/Admin tạo bài viết';
COMMENT ON COLUMN articles.created_at IS 'Thời điểm tạo bài viết (UTC+7 / Timestamptz)';


-- =============================================================================
-- 2. BẢNG FAQS (Câu hỏi thường gặp CMS)
-- =============================================================================
CREATE TABLE IF NOT EXISTS faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question VARCHAR(500) NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ,

    -- Ràng buộc kiểm tra phân loại danh mục FAQ
    CONSTRAINT chk_faqs_category CHECK (category IN ('Bảo hành', 'Trả góp', 'Pin'))
);

-- Tạo chỉ mục (Indexes) tối ưu hóa sắp xếp và lọc FAQ theo danh mục
CREATE INDEX IF NOT EXISTS idx_faqs_category_display_order ON faqs(category, display_order ASC);

-- Thêm ghi chú cho bảng và các cột của FAQs
COMMENT ON TABLE faqs IS 'Bảng lưu trữ danh sách các câu hỏi thường gặp (FAQ) cho khách hàng';
COMMENT ON COLUMN faqs.id IS 'Mã định danh duy nhất của FAQ (UUID)';
COMMENT ON COLUMN faqs.question IS 'Nội dung câu hỏi thường gặp';
COMMENT ON COLUMN faqs.answer IS 'Nội dung câu trả lời chi tiết';
COMMENT ON COLUMN faqs.category IS 'Phân loại danh mục: Bảo hành, Trả góp, Pin';
COMMENT ON COLUMN faqs.display_order IS 'Thứ tự ưu tiên hiển thị trên giao diện người dùng';


-- =============================================================================
-- 3. MẪU DỮ LIỆU KHỞI TẠO (SEED DATA)
-- =============================================================================

-- Chèn mẫu dữ liệu Bài viết CMS
INSERT INTO articles (id, title, slug, content, image_thumbnail, status, view_count, author_id, created_at)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', 
     'VinFast Khai Trương Trạm Sạc Siêu Nhanh Mới Tại Hà Nội', 
     'vinfast-khai-truong-tram-sac-sieu-nhan-moi-tai-ha-noi', 
     '<p>Hệ thống trạm sạc công suất 360kW hoàn toàn mới giúp sạc 10-80% chỉ trong 18 phút...</p>', 
     'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80', 
     'Published', 1250, '11111111-1111-1111-1111-111111111111', CURRENT_TIMESTAMP - INTERVAL '2 days'),
    
    ('a0000000-0000-0000-0000-000000000002', 
     'Chính Sách Ưu Đãi Thuê Pin LFP Thế Hệ Mới Dành Cho VF 8', 
     'chinh-sach-uu-dai-thue-pin-lfp-the-he-moi-danh-cho-vf8', 
     '<p>Khách hàng đặt cọc hôm nay sẽ nhận ngay gói thuê pin ưu đãi chỉ 2.900.000đ/tháng không giới hạn km...</p>', 
     'https://images.unsplash.com/photo-1615887023516-9b6bcd559e87?w=600&auto=format&fit=crop&q=80', 
     'Published', 890, '11111111-1111-1111-1111-111111111111', CURRENT_TIMESTAMP - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- Chèn mẫu dữ liệu FAQ CMS
INSERT INTO faqs (id, question, answer, category, display_order, created_at)
VALUES 
    ('f0000000-0000-0000-0000-000000000001', 
     'Thời gian bảo hành xe ô tô điện VinFast là bao lâu?', 
     'VinFast áp dụng chính sách bảo hành chính hãng lên tới 10 năm hoặc 200.000 km (tùy điều kiện nào đến trước) cho các dòng xe ô tô điện cao cấp.', 
     'Bảo hành', 1, CURRENT_TIMESTAMP),
    
    ('f0000000-0000-0000-0000-000000000002', 
     'Thủ tục mua xe trả góp cần chuẩn bị những giấy tờ gì?', 
     'Quý khách chỉ cần chuẩn bị CCCD gắn chip và chứng minh thu nhập hàng tháng. VinFast hỗ trợ vay tối đa 80% giá trị xe với lãi suất ưu đãi đặc biệt.', 
     'Trả góp', 1, CURRENT_TIMESTAMP),
    
    ('f0000000-0000-0000-0000-000000000003', 
     'Gói thuê pin LFP khác gì so với mua đứt pin?', 
     'Gói thuê pin giúp giảm chi phí mua xe ban đầu, đồng thời VinFast sẽ chịu toàn bộ rủi ro về chai pin và thay thế miễn phí khi dung lượng pin tối đa xuống dưới 70%.', 
     'Pin', 1, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;
