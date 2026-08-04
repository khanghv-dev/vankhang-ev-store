-- =============================================================================
-- RBAC (Role-Based Access Control) Schema for PostgreSQL
-- Architected for VinFast O2O Administration Panel
-- =============================================================================

-- ── 1. Roles Table ───────────────────────────────────────────────────────────
CREATE TABLE "Roles" (
    "Id" UUID PRIMARY KEY,
    "Code" VARCHAR(50) NOT NULL,
    "Name" VARCHAR(100) NOT NULL,
    "Description" VARCHAR(255),
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT "UQ_Roles_Code" UNIQUE ("Code")
);

-- ── 2. Permissions Table ──────────────────────────────────────────────────────
CREATE TABLE "Permissions" (
    "Id" UUID PRIMARY KEY,
    "Code" VARCHAR(50) NOT NULL,
    "Name" VARCHAR(100) NOT NULL,
    "Description" VARCHAR(255),
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT "UQ_Permissions_Code" UNIQUE ("Code")
);

-- ── 3. AdminUsers Table ────────────────────────────────────────────────────────
CREATE TABLE "AdminUsers" (
    "Id" UUID PRIMARY KEY,
    "Username" VARCHAR(50) NOT NULL,
    "Email" VARCHAR(320) NOT NULL,
    "PasswordHash" VARCHAR(255) NOT NULL,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT "UQ_AdminUsers_Username" UNIQUE ("Username"),
    CONSTRAINT "UQ_AdminUsers_Email" UNIQUE ("Email")
);

-- ── 4. RolePermissions Table (Many-to-Many: Roles & Permissions) ──────────────
CREATE TABLE "RolePermissions" (
    "RoleId" UUID NOT NULL,
    "PermissionId" UUID NOT NULL,
    CONSTRAINT "PK_RolePermissions" PRIMARY KEY ("RoleId", "PermissionId"),
    CONSTRAINT "FK_RolePermissions_Roles" FOREIGN KEY ("RoleId") 
        REFERENCES "Roles" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_RolePermissions_Permissions" FOREIGN KEY ("PermissionId") 
        REFERENCES "Permissions" ("Id") ON DELETE CASCADE
);

-- ── 5. AdminUserRoles Table (Many-to-Many: AdminUsers & Roles) ────────────────
CREATE TABLE "AdminUserRoles" (
    "AdminUserId" UUID NOT NULL,
    "RoleId" UUID NOT NULL,
    CONSTRAINT "PK_AdminUserRoles" PRIMARY KEY ("AdminUserId", "RoleId"),
    CONSTRAINT "FK_AdminUserRoles_AdminUsers" FOREIGN KEY ("AdminUserId") 
        REFERENCES "AdminUsers" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_AdminUserRoles_Roles" FOREIGN KEY ("RoleId") 
        REFERENCES "Roles" ("Id") ON DELETE CASCADE
);

-- =============================================================================
-- PERFORMANCE INDEXES
-- =============================================================================
-- Optimize reverse-lookup queries for permissions assigned to roles
CREATE INDEX "IX_RolePermissions_PermissionId" ON "RolePermissions" ("PermissionId");

-- Optimize user role queries on authorization check
CREATE INDEX "IX_AdminUserRoles_RoleId" ON "AdminUserRoles" ("RoleId");

-- =============================================================================
-- SEED DATA
-- =============================================================================

-- Seed Permissions
INSERT INTO "Permissions" ("Id", "Code", "Name", "Description") VALUES
('a1111111-1111-1111-1111-111111111111', 'view_revenue', 'Xem doanh thu', 'Quyền xem báo cáo doanh thu và dòng tiền của hệ thống'),
('b2222222-2222-2222-2222-222222222222', 'edit_vehicle_price', 'Sửa giá xe', 'Quyền thay đổi giá niêm yết và mức cọc xe điện'),
('c3333333-3333-3333-3333-333333333333', 'approve_post', 'Duyệt bài viết', 'Quyền phê duyệt và xuất bản bài đăng tin tức hoặc khuyến mãi');

-- Seed Roles
INSERT INTO "Roles" ("Id", "Code", "Name", "Description") VALUES
('11111111-1111-1111-1111-111111111111', 'SuperAdmin', 'Super Admin', 'Quản trị viên tối cao, có toàn quyền hệ thống'),
('22222222-2222-2222-2222-222222222222', 'SalesManager', 'Sales Manager', 'Quản lý kinh doanh, xem doanh thu và chỉnh sửa giá sản phẩm'),
('33333333-3333-3333-3333-333333333333', 'ContentEditor', 'Content Editor', 'Biên tập viên nội dung, tạo và duyệt bài viết tin tức'),
('44444444-4444-4444-4444-444444444444', 'ShowroomStaff', 'Showroom Staff', 'Nhân viên showroom hỗ trợ kỹ thuật và xem doanh thu nội bộ');

-- Map Permissions to Roles (RolePermissions)
-- 1. SuperAdmin (has all permissions)
INSERT INTO "RolePermissions" ("RoleId", "PermissionId") VALUES
('11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111'),
('11111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222'),
('11111111-1111-1111-1111-111111111111', 'c3333333-3333-3333-3333-333333333333');

-- 2. SalesManager (Xem doanh thu, Sửa giá xe)
INSERT INTO "RolePermissions" ("RoleId", "PermissionId") VALUES
('22222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111'),
('22222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222');

-- 3. ContentEditor (Duyệt bài viết)
INSERT INTO "RolePermissions" ("RoleId", "PermissionId") VALUES
('33333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333');

-- 4. ShowroomStaff (Xem doanh thu)
INSERT INTO "RolePermissions" ("RoleId", "PermissionId") VALUES
('44444444-4444-4444-4444-444444444444', 'a1111111-1111-1111-1111-111111111111');
