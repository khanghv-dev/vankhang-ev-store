-- =============================================================================
-- VINFAST O2O E-COMMERCE PLATFORM
-- Database Migration Script: Transactional Outbox Schema
-- DBMS: PostgreSQL 14+
-- Script: V5__outbox_schema.sql
-- Description: Tạo bảng outbox_events để phục vụ Transactional Outbox Pattern
-- =============================================================================

CREATE TABLE IF NOT EXISTS outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(255) NOT NULL,
    payload TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMPTZ,
    error TEXT
);

CREATE INDEX IF NOT EXISTS idx_outbox_unprocessed ON outbox_events(created_at) WHERE processed_at IS NULL;

COMMENT ON TABLE outbox_events IS 'Bảng lưu trữ các sự kiện tích hợp cần xuất bản lên Kafka một cách tin cậy';
COMMENT ON COLUMN outbox_events.id IS 'Mã định danh duy nhất của sự kiện Outbox (UUID)';
COMMENT ON COLUMN outbox_events.event_type IS 'Loại sự kiện (ví dụ: VehicleDepositedEvent)';
COMMENT ON COLUMN outbox_events.payload IS 'Nội dung sự kiện được serialize dạng JSON';
COMMENT ON COLUMN outbox_events.created_at IS 'Thời điểm sự kiện được tạo (UTC)';
COMMENT ON COLUMN outbox_events.processed_at IS 'Thời điểm sự kiện được đẩy lên Kafka thành công (UTC)';
COMMENT ON COLUMN outbox_events.error IS 'Vết thông báo lỗi chi tiết nếu đẩy lên Kafka thất bại';
