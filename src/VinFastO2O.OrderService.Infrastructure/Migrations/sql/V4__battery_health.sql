-- =============================================================================
-- VINFAST O2O E-COMMERCE PLATFORM
-- Database Migration Script: Battery Health Reports (Spark Outputs)
-- DBMS: PostgreSQL 14+
-- Script: V4__battery_health.sql
-- Description: Tạo bảng lưu trữ kết quả phân tích sức khỏe pin từ Spark Batch
-- =============================================================================

CREATE TABLE IF NOT EXISTS battery_health_reports (
    vin VARCHAR(50) PRIMARY KEY,
    max_temp DOUBLE PRECISION NOT NULL,
    avg_temp DOUBLE PRECISION NOT NULL,
    temp_anomalies_count INT NOT NULL,
    total_records INT NOT NULL,
    avg_discharge_rate DOUBLE PRECISION,
    soh DOUBLE PRECISION NOT NULL,
    is_risky BOOLEAN NOT NULL,
    analysis_date VARCHAR(20) NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE battery_health_reports IS 'Bảng lưu trữ kết quả phân tích sức khỏe bộ pin xe máy điện từ Spark Batch Analytics';
COMMENT ON COLUMN battery_health_reports.vin IS 'Mã định danh số khung xe máy điện / pin';
COMMENT ON COLUMN battery_health_reports.max_temp IS 'Nhiệt độ lõi lớn nhất ghi nhận được (°C)';
COMMENT ON COLUMN battery_health_reports.avg_temp IS 'Nhiệt độ lõi trung bình ghi nhận được (°C)';
COMMENT ON COLUMN battery_health_reports.temp_anomalies_count IS 'Số lần phát hiện nhiệt độ vượt ngưỡng nguy hiểm (>55°C)';
COMMENT ON COLUMN battery_health_reports.avg_discharge_rate IS 'Tốc độ tiêu thụ pin trung bình (% dung lượng hao hụt mỗi giây)';
COMMENT ON COLUMN battery_health_reports.soh IS 'Chỉ số sức khỏe pin State of Health (0.0% - 100.0%)';
COMMENT ON COLUMN battery_health_reports.is_risky IS 'Cờ cảnh báo pin có nguy cơ hỏng cao (SOH < 75%, Quá nhiệt hoặc Tiêu hao quá nhanh)';
