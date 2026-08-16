-- =============================================================================
-- VinFast O2O · OrderService · Full Schema
-- Migration : V2__order_schema_full
-- Author    : Database Engineer
-- Date      : 2026-06-17
-- DB Engine : PostgreSQL 15+
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- 1. Enum Types
-- ---------------------------------------------------------------------------

-- Loại cọc: Linh hoạt (hoàn được) vs Cam kết (không hoàn)
CREATE TYPE deposit_type AS ENUM ('LinhHoat', 'CamKet');

-- Tùy chọn pin: Mua pin hay thuê pin theo tháng
CREATE TYPE battery_option AS ENUM ('ThuePin', 'MuaPin');

-- Trạng thái đơn hàng (khớp với OrderStatus C# enum)
CREATE TYPE order_status AS ENUM (
    'Draft',        -- 1  Tạo tạm, chưa gửi
    'Pending',      -- 2  Đã gửi, chờ thanh toán cọc
    'Paid',         -- 3  Đã thanh toán cọc
    'Preparing',    -- 4  Đang chuẩn bị xe tại showroom
    'Delivered',    -- 5  Đã giao xe
    'Cancelled'     -- 6  Đã huỷ
);

-- Phương thức thanh toán
CREATE TYPE payment_method AS ENUM (
    'BankTransfer',     -- Chuyển khoản ngân hàng
    'VNPay',            -- Cổng VNPay
    'MoMo',             -- Ví MoMo
    'ZaloPay',          -- Ví ZaloPay
    'Cash'              -- Tiền mặt tại showroom
);

-- Trạng thái giao dịch thanh toán
CREATE TYPE payment_status AS ENUM (
    'Pending',      -- Chờ xử lý
    'Success',      -- Thành công
    'Failed',       -- Thất bại
    'Refunded'      -- Đã hoàn tiền
);

-- ---------------------------------------------------------------------------
-- 2. Table: orders
--    Đơn đặt cọc xe máy điện VinFast
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    -- Primary key
    id                  UUID            NOT NULL DEFAULT gen_random_uuid(),

    -- Thông tin khách hàng (snapshot tại thời điểm đặt cọc)
    customer_id         UUID            NOT NULL,
    customer_name       VARCHAR(150)    NOT NULL,
    customer_email      VARCHAR(150)    NOT NULL,
    customer_phone      VARCHAR(20)     NOT NULL,
    customer_id_card    VARCHAR(30)     NOT NULL,   -- CCCD / CMND

    -- Showroom thực hiện bàn giao
    store_id            UUID            NOT NULL,

    -- Tài chính
    total_amount        NUMERIC(18, 2)  NOT NULL    CHECK (total_amount   > 0),
    deposit_amount      NUMERIC(18, 2)  NOT NULL    CHECK (deposit_amount > 0),
    deposit_type        deposit_type    NOT NULL    DEFAULT 'LinhHoat',
    battery_option      battery_option  NOT NULL    DEFAULT 'MuaPin',

    -- Trạng thái vòng đời đơn hàng
    status              order_status    NOT NULL    DEFAULT 'Draft',

    -- Timestamps
    created_at          TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    last_modified_at    TIMESTAMPTZ,
    paid_at             TIMESTAMPTZ,
    cancelled_at        TIMESTAMPTZ,

    -- Ghi chú huỷ đơn (nếu bị Cancelled)
    cancellation_reason VARCHAR(500),

    CONSTRAINT pk_orders PRIMARY KEY (id),
    CONSTRAINT chk_orders_deposit_lte_total
        CHECK (deposit_amount <= total_amount),
    CONSTRAINT chk_orders_cancelled_reason
        CHECK (
            (status = 'Cancelled' AND cancellation_reason IS NOT NULL)
            OR status <> 'Cancelled'
        )
);

COMMENT ON TABLE  orders IS 'Đơn đặt cọc xe máy điện VinFast — core entity của OrderService';
COMMENT ON COLUMN orders.deposit_type        IS 'LinhHoat: hoàn được cọc; CamKet: không hoàn nếu huỷ';
COMMENT ON COLUMN orders.battery_option      IS 'ThuePin: thuê pin theo tháng; MuaPin: mua đứt';
COMMENT ON COLUMN orders.customer_id_card    IS 'Số CCCD/CMND — lưu snapshot, không phụ thuộc CustomerService';
COMMENT ON COLUMN orders.cancellation_reason IS 'Bắt buộc điền khi Status = Cancelled';

-- ---------------------------------------------------------------------------
-- 3. Table: order_items
--    Chi tiết từng dòng xe trong đơn hàng
--    (Một đơn có thể đặt cọc nhiều xe)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id              UUID            NOT NULL DEFAULT gen_random_uuid(),
    order_id        UUID            NOT NULL,

    -- ProductId = mã model xe trong InventoryService / catalog
    product_id      UUID            NOT NULL,

    -- Tên model snapshot (tránh join sang InventoryService mỗi lần query)
    product_name    VARCHAR(200)    NOT NULL,

    -- Số khung (VIN) được InventoryService gán sau khi cọc thành công.
    -- NULL khi đơn ở trạng thái Draft / Pending
    assigned_vin    CHAR(17),

    -- Đơn giá tại thời điểm đặt cọc (immutable snapshot)
    unit_price      NUMERIC(18, 2)  NOT NULL    CHECK (unit_price > 0),
    quantity        SMALLINT        NOT NULL    DEFAULT 1 CHECK (quantity > 0),
    line_total      NUMERIC(18, 2)  NOT NULL
        GENERATED ALWAYS AS (unit_price * quantity) STORED,

    -- Thời điểm gán VIN (audit)
    vin_assigned_at TIMESTAMPTZ,

    CONSTRAINT pk_order_items       PRIMARY KEY (id),
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id)
        REFERENCES orders (id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT,
    CONSTRAINT chk_order_items_vin_format
        CHECK (
            assigned_vin IS NULL
            OR (char_length(assigned_vin) = 17 AND assigned_vin ~ '^[A-HJ-NPR-Z0-9]{17}$')
        ),
    CONSTRAINT chk_order_items_vin_assigned_at
        CHECK (
            (assigned_vin IS NOT NULL AND vin_assigned_at IS NOT NULL)
            OR (assigned_vin IS NULL AND vin_assigned_at IS NULL)
        )
);

COMMENT ON TABLE  order_items IS 'Dòng sản phẩm trong đơn đặt cọc — mỗi row = 1 model xe';
COMMENT ON COLUMN order_items.assigned_vin    IS 'Số khung 17 ký tự — NULL cho đến khi InventoryService gán sau thanh toán';
COMMENT ON COLUMN order_items.product_name    IS 'Snapshot tên model tại thời điểm đặt cọc, tránh N+1 join';
COMMENT ON COLUMN order_items.line_total      IS 'Cột tính toán: unit_price × quantity, lưu vật lý (STORED)';

-- ---------------------------------------------------------------------------
-- 4. Table: payments
--    Giao dịch thanh toán gắn với đơn hàng
--    (Một đơn có thể có nhiều lần thử thanh toán)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id                  UUID            NOT NULL DEFAULT gen_random_uuid(),
    order_id            UUID            NOT NULL,

    -- Mã giao dịch từ cổng thanh toán (VNPay/MoMo/ZaloPay…)
    transaction_no      VARCHAR(100)    NOT NULL,

    -- Số tiền thực tế được xử lý (có thể < deposit_amount nếu thanh toán nhiều lần)
    amount              NUMERIC(18, 2)  NOT NULL    CHECK (amount > 0),

    payment_method      payment_method  NOT NULL,
    status              payment_status  NOT NULL    DEFAULT 'Pending',

    -- Metadata từ cổng thanh toán (raw callback JSON để audit)
    gateway_response    JSONB,

    -- Timestamps
    created_at          TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    paid_at             TIMESTAMPTZ,
    failed_at           TIMESTAMPTZ,
    refunded_at         TIMESTAMPTZ,
    refund_reason       VARCHAR(500),

    CONSTRAINT pk_payments          PRIMARY KEY (id),
    CONSTRAINT fk_payments_order    FOREIGN KEY (order_id)
        REFERENCES orders (id)
        ON DELETE RESTRICT          -- Giữ lại lịch sử thanh toán kể cả khi đơn bị huỷ
        ON UPDATE RESTRICT,
    CONSTRAINT uq_payments_txn      UNIQUE (transaction_no),
    CONSTRAINT chk_payments_paid_at
        CHECK (
            (status = 'Success'  AND paid_at   IS NOT NULL)
            OR status <> 'Success'
        ),
    CONSTRAINT chk_payments_refund
        CHECK (
            (status = 'Refunded' AND refunded_at IS NOT NULL AND refund_reason IS NOT NULL)
            OR status <> 'Refunded'
        )
);

COMMENT ON TABLE  payments IS 'Giao dịch thanh toán — mỗi lần gọi cổng = 1 row; status track kết quả';
COMMENT ON COLUMN payments.transaction_no   IS 'Mã giao dịch duy nhất từ cổng thanh toán — UNIQUE constraint';
COMMENT ON COLUMN payments.gateway_response IS 'Raw JSON callback từ cổng thanh toán, phục vụ audit & debug';
COMMENT ON COLUMN payments.refund_reason    IS 'Bắt buộc khi Status = Refunded';

-- ---------------------------------------------------------------------------
-- 5. Indexes (performance)
-- ---------------------------------------------------------------------------

-- orders
CREATE INDEX idx_orders_customer_id     ON orders (customer_id);
CREATE INDEX idx_orders_store_id        ON orders (store_id);
CREATE INDEX idx_orders_status          ON orders (status);
CREATE INDEX idx_orders_created_at      ON orders (created_at DESC);
-- Composite: dashboard tìm đơn của khách theo trạng thái
CREATE INDEX idx_orders_customer_status ON orders (customer_id, status);

-- order_items
CREATE INDEX idx_order_items_order_id   ON order_items (order_id);
CREATE INDEX idx_order_items_product_id ON order_items (product_id);
-- Tìm VIN được gán — InventoryService dùng để kiểm tra
CREATE UNIQUE INDEX uq_order_items_assigned_vin
    ON order_items (assigned_vin)
    WHERE assigned_vin IS NOT NULL;   -- Partial unique: 1 VIN chỉ xuất hiện ở 1 order_item

-- payments
CREATE INDEX idx_payments_order_id      ON payments (order_id);
CREATE INDEX idx_payments_status        ON payments (status);
CREATE INDEX idx_payments_created_at    ON payments (created_at DESC);

-- ---------------------------------------------------------------------------
-- 6. Row-level audit trigger (updated_at tự động)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_set_last_modified_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_modified_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orders_last_modified
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION fn_set_last_modified_at();
