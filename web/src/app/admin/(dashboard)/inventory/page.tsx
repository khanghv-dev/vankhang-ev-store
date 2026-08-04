"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "../../../../context/AdminAuthContext";
import { API_CONFIG } from "@/config/apiConfig";

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  location: string;
}

export default function AdminInventoryPage() {
  const { adminUser, logoutAdmin, adminToken } = useAdminAuth();
  const router = useRouter();

  // Inventory State
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Edit Quantity Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState("");

  // Create Item Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSku, setNewSku] = useState("");
  const [newName, setNewName] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  // Fetch Inventory List
  const fetchInventory = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const response = await fetch(`${API_CONFIG.INVENTORY_URL}/api/inventory`, {
        headers: {
          "Authorization": `Bearer ${adminToken || ""}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setItems(data || []);
      } else {
        setErrorMsg("Không thể tải dữ liệu kho hàng phụ tùng.");
      }
    } catch (err) {
      console.error("Lỗi kết nối tới Inventory API:", err);
      setErrorMsg("Lỗi kết nối tới máy chủ kho hàng.");
    } finally {
      setIsLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    if (adminUser) {
      fetchInventory();
    }
  }, [adminUser, fetchInventory]);

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const qtyNum = parseInt(editQuantity, 10);
    if (isNaN(qtyNum) || qtyNum < 0) {
      setEditError("Số lượng phải là số lớn hơn hoặc bằng 0.");
      return;
    }

    setIsUpdating(true);
    setEditError("");

    try {
      const response = await fetch(`${API_CONFIG.INVENTORY_URL}/api/inventory/${selectedItem.id}/quantity`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken || ""}`
        },
        body: JSON.stringify({ quantity: qtyNum })
      });

      if (response.ok) {
        setShowEditModal(false);
        setSelectedItem(null);
        setEditQuantity("");
        fetchInventory();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setEditError(errorData.message || "Cập nhật tồn kho thất bại.");
      }
    } catch (err) {
      console.error("Lỗi cập nhật tồn kho:", err);
      setEditError("Lỗi kết nối tới máy chủ.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Create Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreateSuccess("");

    if (!newSku.trim()) {
      setCreateError("Mã SKU không được để trống.");
      return;
    }
    if (!newName.trim()) {
      setCreateError("Tên phụ tùng không được để trống.");
      return;
    }
    const qtyNum = parseInt(newQuantity, 10);
    if (isNaN(qtyNum) || qtyNum < 0) {
      setCreateError("Số lượng tồn ban đầu phải là số >= 0.");
      return;
    }
    if (!newLocation.trim()) {
      setCreateError("Vị trí kho không được để trống.");
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch(`${API_CONFIG.INVENTORY_URL}/api/inventory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken || ""}`
        },
        body: JSON.stringify({
          sku: newSku.trim(),
          name: newName.trim(),
          quantity: qtyNum,
          location: newLocation.trim()
        })
      });

      if (response.ok) {
        setCreateSuccess("Khai báo phụ tùng phụ kiện mới thành công!");
        setNewSku("");
        setNewName("");
        setNewQuantity("");
        setNewLocation("");
        fetchInventory();

        setTimeout(() => {
          setShowCreateModal(false);
          setCreateSuccess("");
        }, 1500);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setCreateError(errorData.message || "Không thể tạo mới phụ tùng.");
      }
    } catch (err) {
      console.error("Lỗi khai báo phụ tùng:", err);
      setCreateError("Lỗi kết nối tới máy chủ.");
    } finally {
      setIsCreating(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    logoutAdmin();
    router.push("/admin/login");
  };

  // Filter Items
  const filteredItems = items.filter(item => {
    const matchesSearch =
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStock = showLowStockOnly ? item.quantity < 10 : true;

    return matchesSearch && matchesStock;
  });

  if (!adminUser) return null;

  return (
    <div className="min-h-screen bg-[#F5F7FB] font-sans text-[#374151] p-4 sm:p-8 select-none">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Navigation / Header Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)] relative overflow-hidden gap-4">
          <div className="relative">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#111827]">Hệ Thống Quản Trị O2O</h1>
            <p className="text-xs text-[#6B7280] mt-1">
              Phân hệ: <span className="font-semibold text-[#E11D2E]">Quản lý Kho Phụ tùng & Phụ kiện</span>
            </p>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <button
              onClick={() => router.push("/admin")}
              className="px-4 py-2 bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#374151] rounded-xl text-xs font-semibold tracking-wide transition-all shadow-sm"
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => router.push("/admin/products")}
              className="px-4 py-2 bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#374151] rounded-xl text-xs font-semibold tracking-wide transition-all shadow-sm"
            >
              📦 Xe máy & Ô tô
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-50 border border-red-200 text-[#EF4444] hover:bg-red-100 rounded-xl text-xs font-semibold tracking-wide transition-all"
            >
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-base font-bold tracking-tight text-[#111827] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E11D2E] animate-pulse"></span>
                Danh Mục Linh Kiện Phụ Tùng
              </h2>
              <p className="text-xs text-[#6B7280] mt-1">
                Quản lý số lượng tồn kho của các linh kiện phụ trợ (Lốp, Sạc, Má phanh) và các phụ kiện khác.
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => {
                setCreateError("");
                setCreateSuccess("");
                setShowCreateModal(true);
              }}
              className="px-5 py-2.5 bg-[#E11D2E] hover:bg-[#C8102E] text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              ➕ Khai báo Linh kiện
            </button>
          </div>

          {/* Filters and Search Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm theo mã SKU hoặc tên linh kiện..."
                className="w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-xs text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#E11D2E] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-[#6B7280] hover:text-[#111827] text-xs font-semibold"
                >
                  Xóa
                </button>
              )}
            </div>

            <button
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
              className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                showLowStockOnly
                  ? "bg-amber-50 border-amber-200 text-[#F59E0B] font-bold shadow-sm"
                  : "bg-white border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB]"
              }`}
            >
              ⚠️ {showLowStockOnly ? "Đang lọc: Tồn kho thấp" : "Lọc tồn kho thấp (< 10)"}
            </button>
          </div>

          {/* Data Table */}
          {isLoading ? (
            <div className="py-20 text-center text-[#6B7280] flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-red-200 border-t-[#E11D2E] rounded-full animate-spin"></div>
              <p className="text-xs font-medium">Đang tải danh sách tồn kho...</p>
            </div>
          ) : errorMsg ? (
            <div className="py-12 text-center text-[#EF4444] bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm font-medium">{errorMsg}</p>
              <button
                onClick={fetchInventory}
                className="mt-3 px-4 py-1.5 bg-red-100 text-[#EF4444] rounded-lg text-xs font-semibold"
              >
                Thử lại
              </button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center text-[#6B7280] border border-dashed border-[#E5E7EB] rounded-xl text-xs">
              Không tìm thấy linh kiện phụ tùng nào phù hợp.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F9FAFB] text-[#4B5563] font-semibold border-b border-[#E5E7EB] uppercase tracking-wider">
                    <th className="px-6 py-4">Mã SKU</th>
                    <th className="px-6 py-4">Tên Linh Kiện / Phụ Kiện</th>
                    <th className="px-6 py-4">Vị Trí Kho</th>
                    <th className="px-6 py-4 text-center">Tồn Kho</th>
                    <th className="px-6 py-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {filteredItems.map((item) => {
                    const isLowStock = item.quantity < 10;
                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isLowStock
                            ? "bg-amber-50/50 hover:bg-amber-50"
                            : "hover:bg-[#F3F4F6]"
                        }`}
                      >
                        <td className="px-6 py-4 font-mono font-bold text-[#E11D2E]">
                          {item.sku}
                        </td>
                        <td className="px-6 py-4 font-bold text-[#111827]">
                          {item.name}
                        </td>
                        <td className="px-6 py-4 text-[#6B7280] font-mono">
                          {item.location}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className={`font-bold font-mono ${isLowStock ? "text-[#F59E0B] text-sm" : "text-[#111827]"}`}>
                              {item.quantity}
                            </span>
                            {isLowStock && (
                              <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-[#F59E0B] text-[10px] font-bold rounded-md uppercase tracking-wider animate-pulse">
                                ⚠️ Cần nhập
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setEditQuantity(item.quantity.toString());
                              setEditError("");
                              setShowEditModal(true);
                            }}
                            className="px-3 py-1.5 bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#374151] hover:text-[#E11D2E] rounded-lg text-xs font-semibold transition-all shadow-sm"
                          >
                            ✏️ Cập nhật
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Cập Nhật Số Lượng */}
      {showEditModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.1)] space-y-5">
            <div>
              <h3 className="text-base font-bold text-[#111827]">Cập Nhật Số Lượng Tồn Kho</h3>
              <p className="text-xs text-[#6B7280] mt-1">
                Thay đổi tồn kho cho: <span className="text-[#E11D2E] font-semibold">{selectedItem.name}</span>
              </p>
            </div>

            {editError && (
              <div className="p-3 bg-red-50 border border-red-200 text-[#EF4444] rounded-xl text-xs">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-[#6B7280] uppercase font-bold tracking-wider">Số lượng mới trong kho</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-[#E11D2E]"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedItem(null);
                  }}
                  className="flex-1 py-2.5 bg-white border border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB] rounded-xl text-xs font-semibold transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-2.5 bg-[#E11D2E] hover:bg-[#C8102E] text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-md"
                >
                  {isUpdating ? "Đang lưu..." : "Cập nhật"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Khai Báo Mới */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.1)] space-y-5">
            <div>
              <h3 className="text-base font-bold text-[#111827]">Khai Báo Linh Kiện Phụ Tùng</h3>
              <p className="text-xs text-[#6B7280] mt-1">
                Nhập thông tin sản phẩm phụ tùng phụ kiện mới để đưa vào quản lý kho.
              </p>
            </div>

            {createError && (
              <div className="p-3 bg-red-50 border border-red-200 text-[#EF4444] rounded-xl text-xs">
                {createError}
              </div>
            )}

            {createSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-[#10B981] rounded-xl text-xs">
                {createSuccess}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-[#6B7280] uppercase font-bold tracking-wider">Mã SKU</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: VF-TIRE-999"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    className="w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-[#E11D2E]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-[#6B7280] uppercase font-bold tracking-wider">Vị trí lưu kho</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: WH-A-01"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-[#E11D2E]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-[#6B7280] uppercase font-bold tracking-wider">Tên linh kiện / phụ kiện</label>
                <input
                  type="text"
                  required
                  placeholder='VD: Lốp xe Michelin City Grip 12"'
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-[#E11D2E]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-[#6B7280] uppercase font-bold tracking-wider">Số lượng tồn kho ban đầu</label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="VD: 50"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-[#E11D2E]"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-white border border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB] rounded-xl text-xs font-semibold transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 py-2.5 bg-[#E11D2E] hover:bg-[#C8102E] text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-md"
                >
                  {isCreating ? "Đang tạo..." : "Khai báo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
