"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "../../../../context/AdminAuthContext";
import { API_CONFIG } from "@/config/apiConfig";

interface OrderItemDto {
  itemId: string;
  productId: string;
  productName: string;
  assignedVin: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

interface OrderDto {
  orderId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerIdCard: string;
  storeId: string;
  totalAmount: number;
  depositAmount: number;
  depositType: string;
  batteryOption: string;
  status: string;
  paidAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  items: OrderItemDto[];
}

export default function AdminOrdersPage() {
  const { adminUser, logoutAdmin, adminToken } = useAdminAuth();
  const router = useRouter();

  // State filtering & pagination
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [orderIdInput, setOrderIdInput] = useState("");
  const [searchOrderId, setSearchOrderId] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [selectedStore, setSelectedStore] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Data state
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modal Gán VIN State
  const [selectedOrderForVin, setSelectedOrderForVin] = useState<OrderDto | null>(null);
  const [vinInput, setVinInput] = useState("");
  const [isAssigningVin, setIsAssigningVin] = useState(false);
  const [vinError, setVinError] = useState("");

  // Map Tab to Backend Status string
  const getStatusFromTab = (tab: string) => {
    switch (tab) {
      case "PENDING": return "Pending";
      case "PAID": return "Paid";
      case "VIN_ASSIGNED": return "VinAssigned";
      case "COMPLETED": return "Delivered";
      case "CANCELLED": return "Cancelled";
      default: return "";
    }
  };

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const statusParam = getStatusFromTab(activeTab);
      const statusQuery = statusParam ? `&status=${statusParam}` : "";
      const idQuery = searchOrderId ? `&orderId=${encodeURIComponent(searchOrderId)}` : "";
      const phoneQuery = searchPhone ? `&customerPhone=${encodeURIComponent(searchPhone)}` : "";
      const storeQuery = selectedStore ? `&storeId=${encodeURIComponent(selectedStore)}` : "";

      const response = await fetch(
        `${API_CONFIG.ORDER_URL}/api/admin/orders?page=${page}&pageSize=${pageSize}${statusQuery}${idQuery}${phoneQuery}${storeQuery}`,
        {
          headers: {
            "Authorization": `Bearer ${adminToken || ""}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setOrders(data.items || []);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        setErrorMsg("Không thể tải danh sách đơn cọc từ Order Service.");
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách đơn hàng:", err);
      setErrorMsg("Lỗi kết nối tới Order Service API (Port 5022).");
    } finally {
      setIsLoading(false);
    }
  }, [page, activeTab, searchOrderId, searchPhone, selectedStore, adminToken]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Handle Assign VIN API Call
  const handleAssignVinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForVin) return;
    setVinError("");

    const cleanVin = vinInput.trim().toUpperCase();
    if (cleanVin.length !== 17) {
      setVinError("Mã VIN phải đúng 17 ký tự.");
      return;
    }

    setIsAssigningVin(true);
    try {
      const response = await fetch(`${API_CONFIG.ORDER_URL}/api/admin/orders/${selectedOrderForVin.orderId}/assign-vin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken || ""}`,
        },
        body: JSON.stringify({ vin: cleanVin }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMsg(`✓ ${data.message || "Gán mã VIN thành công!"}`);
        setSelectedOrderForVin(null);
        setVinInput("");
        fetchOrders();
      } else {
        setVinError(data.message || "Lỗi khi gán mã VIN.");
      }
    } catch (err) {
      console.error("Lỗi gán VIN:", err);
      setVinError("Lỗi kết nối máy chủ API.");
    } finally {
      setIsAssigningVin(false);
    }
  };

  // Handle Ready for Delivery Kafka API Call
  const handleReadyForDelivery = async (orderId: string) => {
    if (!confirm("Xác nhận xe đã sẵn sàng và phát lệnh Kafka đến Showroom Mobile App?")) return;
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const response = await fetch(`${API_CONFIG.ORDER_URL}/api/admin/orders/${orderId}/ready-for-delivery`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken || ""}`,
        },
        body: JSON.stringify({ instructions: "Đã kiểm tra kỹ thuật, rửa xe sạch sẽ, sạc đầy pin 100%." }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMsg(`🚀 ${data.message}`);
        fetchOrders();
      } else {
        setErrorMsg(data.message || "Không thể phát lệnh sẵn sàng bàn giao.");
      }
    } catch (err) {
      console.error("Lỗi bàn giao:", err);
      setErrorMsg("Lỗi kết nối API.");
    }
  };

  // Handle Refund API Call
  const handleRefund = async (orderId: string) => {
    if (!confirm("CẢNH BÁO: Bạn có chắc chắn muốn HỦY ĐƠN VÀ HOÀN CỌC cho khách hàng qua cổng thanh toán?")) return;
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const response = await fetch(`${API_CONFIG.ORDER_URL}/api/admin/orders/${orderId}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken || ""}`,
        },
        body: JSON.stringify({ reason: "Admin hỗ trợ hoàn cọc theo yêu cầu khách hàng." }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMsg(`💸 ${data.message}`);
        fetchOrders();
      } else {
        setErrorMsg(data.message || "Không thể xử lý hoàn cọc.");
      }
    } catch (err) {
      console.error("Lỗi hoàn cọc:", err);
      setErrorMsg("Lỗi kết nối API.");
    }
  };

  if (!adminUser) return null;

  const tabs = [
    { id: "ALL", label: "Tất cả", icon: "📋" },
    { id: "PENDING", label: "Chờ thanh toán", icon: "⏳" },
    { id: "PAID", label: "Đã cọc - Chờ gán xe", icon: "💵" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FA] font-sans text-[#4B5563] p-4 sm:p-8 select-none">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Panel */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.06)] relative overflow-hidden gap-4">
          <div className="relative">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/admin/dashboard")}
                className="text-[#6B7280] hover:text-[#1F2937] transition-colors text-xs font-semibold"
              >
                ◀ Trang chủ Admin
              </button>
              <span className="text-[#D1D5DB]">/</span>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#1F2937]">
                Quản Lý Đơn Hàng & Điều Phối
              </h1>
            </div>
            <p className="text-xs text-[#6B7280] mt-1">
              Theo dõi tiến trình đặt cọc, gán số VIN thực tế và kích hoạt bàn giao xe cho khách hàng.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setOrderIdInput("");
                setSearchOrderId("");
                setPhoneInput("");
                setSearchPhone("");
                setSelectedStore("");
                setActiveTab("ALL");
                setPage(1);
              }}
              className="px-4 py-2.5 bg-white border border-[#D1D5DB] hover:bg-[#F3F4F6] text-[#374151] rounded-xl text-xs font-semibold transition-all shadow-sm"
            >
              🔄 Tải lại / Reset
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-[#10B981] text-xs flex items-center justify-between shadow-sm">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg("")} className="text-emerald-600 font-bold">✕</button>
          </div>
        )}
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-[#EF4444] text-xs flex items-center justify-between shadow-sm">
            <span>⚠️ {errorMsg}</span>
            <button onClick={() => setErrorMsg("")} className="text-red-600 font-bold">✕</button>
          </div>
        )}

        {/* 1. STATUS QUICK SWITCH TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setPage(1);
                }}
                className={`px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 whitespace-nowrap flex items-center gap-2 border shadow-sm ${
                  isActive
                    ? "bg-[#FFE8EA] text-[#E11D2E] border-[#E11D2E] font-semibold"
                    : "bg-white text-[#374151] border-[#E5E7EB] hover:bg-[#F3F4F6]"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 2. DYNAMIC FILTERS BAR */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-[0_4px_12px_rgba(0,0,0,0.06)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">Mã đơn cọc (ID)</label>
            <input
              type="text"
              value={orderIdInput}
              onChange={(e) => setOrderIdInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { setSearchOrderId(orderIdInput); setPage(1); } }}
              placeholder="Nhập GUID hoặc mã..."
              className="w-full bg-white border border-[#D1D5DB] text-[#1F2937] rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#E11D2E] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">SĐT Khách hàng</label>
            <input
              type="text"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { setSearchPhone(phoneInput); setPage(1); } }}
              placeholder="Nhập số điện thoại..."
              className="w-full bg-white border border-[#D1D5DB] text-[#1F2937] rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#E11D2E] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">Showroom nhận xe</label>
            <select
              value={selectedStore}
              onChange={(e) => { setSelectedStore(e.target.value); setPage(1); }}
              className="w-full bg-white border border-[#D1D5DB] text-[#1F2937] rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#E11D2E] transition-colors"
            >
              <option value="">Tất cả Showroom</option>
              <option value="11111111-2222-3333-4444-555555555555">Showroom VinFast Hà Nội</option>
              <option value="22222222-3333-4444-5555-666666666666">Showroom VinFast TP.HCM</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={() => {
                setSearchOrderId(orderIdInput);
                setSearchPhone(phoneInput);
                setPage(1);
              }}
              className="w-full py-2.5 bg-[#E11D2E] hover:bg-[#C80010] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              <span>🔍</span> Tìm kiếm
            </button>
          </div>
        </div>

        {/* 3. ORDERS DATA TABLE */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#1F2937] uppercase tracking-wider">
              Danh sách Đơn hàng ({totalCount})
            </h2>
            <span className="text-xs text-[#6B7280] font-mono">
              Trang {page} / {totalPages}
            </span>
          </div>

          <div className="overflow-x-auto border border-[#E5E7EB] rounded-xl bg-white">
            {isLoading ? (
              <div className="p-16 text-center text-[#6B7280] flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-3 border-red-200 border-t-[#E11D2E] rounded-full animate-spin"></div>
                <span className="text-xs font-medium">Đang tải danh sách đơn hàng...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-16 text-center text-[#6B7280] text-xs">
                Không tìm thấy đơn đặt cọc nào phù hợp với bộ lọc.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#4B5563] font-semibold uppercase tracking-wider">
                    <th className="p-4 w-36">Mã Đơn</th>
                    <th className="p-4">Khách Hàng</th>
                    <th className="p-4">Sản Phẩm & VIN</th>
                    <th className="p-4 w-36">Tiền Cọc (VND)</th>
                    <th className="p-4 w-28">Gói Cọc</th>
                    <th className="p-4 w-32">Trạng Thái</th>
                    <th className="p-4 text-center w-48">Hành Động Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {orders.map((order) => {
                    const firstItem = order.items && order.items[0];
                    return (
                      <tr key={order.orderId} className="hover:bg-[#F3F4F6] transition-colors">
                        <td className="p-4 font-mono font-bold text-[#E11D2E]">
                          <div>{order.orderId.substring(0, 8)}...</div>
                          <div className="text-[10px] text-[#6B7280] font-normal">{new Date(order.createdAt).toLocaleDateString("vi-VN")}</div>
                        </td>

                        <td className="p-4">
                          <div className="font-bold text-[#1F2937]">{order.customerName}</div>
                          <div className="text-[11px] text-[#6B7280] font-mono mt-0.5">{order.customerPhone}</div>
                          <div className="text-[10px] text-[#9CA3AF]">{order.customerEmail}</div>
                        </td>

                        <td className="p-4">
                          <div className="font-semibold text-[#1F2937]">{firstItem?.productName || "VinFast Vehicle"}</div>
                          {firstItem?.assignedVin ? (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-[#10B981] font-mono rounded text-[10px] font-bold">
                              VIN: {firstItem.assignedVin}
                            </span>
                          ) : (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-[#F9FAFB] text-[#9CA3AF] font-mono border border-[#E5E7EB] rounded text-[10px] italic">
                              Chưa gán VIN
                            </span>
                          )}
                        </td>

                        <td className="p-4 font-mono font-extrabold text-[#10B981]">
                          <div>{order.depositAmount.toLocaleString("vi-VN")} đ</div>
                          <div className="text-[10px] text-[#6B7280] font-normal">Tổng: {order.totalAmount.toLocaleString("vi-VN")} đ</div>
                        </td>

                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                            order.depositType === "LinhHoat" 
                              ? "bg-cyan-50 text-cyan-700 border border-cyan-200" 
                              : "bg-purple-50 text-purple-700 border border-purple-200"
                          }`}>
                            {order.depositType === "LinhHoat" ? "Linh Hoạt" : "Cam Kết"}
                          </span>
                        </td>

                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            order.status === "Paid" ? "bg-amber-50 text-[#F59E0B] border border-amber-200" :
                            order.status === "VinAssigned" || order.status === "Preparing" ? "bg-cyan-50 text-[#2563EB] border border-cyan-200" :
                            order.status === "Delivered" ? "bg-emerald-50 text-[#10B981] border border-emerald-200" :
                            order.status === "Refunded" || order.status === "Cancelled" ? "bg-red-50 text-[#EF4444] border border-red-200" :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            {order.status === "Paid" ? "Đã Cọc" :
                             order.status === "VinAssigned" ? "Đã Gán VIN" :
                             order.status === "Preparing" ? "Sẵn Sàng Giao" :
                             order.status === "Delivered" ? "Đã Bàn Giao" :
                             order.status === "Refunded" ? "Đã Hoàn Cọc" :
                             order.status === "Cancelled" ? "Đã Hủy" : order.status}
                          </span>
                        </td>

                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {/* Nút Gán VIN thủ công */}
                            {(order.status === "Paid" || order.status === "Preparing") && (
                              <button
                                onClick={() => {
                                  setSelectedOrderForVin(order);
                                  setVinInput(firstItem?.assignedVin || "");
                                  setVinError("");
                                }}
                                className="px-2.5 py-1.5 bg-[#E11D2E] hover:bg-[#C80010] text-white rounded-lg text-[10px] font-bold transition-all shadow"
                              >
                                📌 Gán VIN
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#E5E7EB]">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1 || isLoading}
                className="px-4 py-2 bg-white border border-[#D1D5DB] hover:bg-[#F3F4F6] text-[#374151] text-[11px] font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                ◀ Trang trước
              </button>
              
              <span className="text-xs text-[#6B7280] font-medium">
                Trang <span className="text-[#E11D2E] font-bold">{page}</span> / {totalPages}
              </span>

              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page >= totalPages || isLoading}
                className="px-4 py-2 bg-white border border-[#D1D5DB] hover:bg-[#F3F4F6] text-[#374151] text-[11px] font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                Trang sau ▶
              </button>
            </div>
          )}
        </div>

      </div>

      {/* MODAL GÁN VIN THỦ CÔNG */}
      {selectedOrderForVin && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl max-w-md w-full p-6 shadow-[0_4px_12px_rgba(0,0,0,0.1)] space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[#E5E7EB]">
              <h3 className="font-bold text-[#1F2937] text-sm">🚘 Gán Số VIN Xe Thực Tế</h3>
              <button onClick={() => setSelectedOrderForVin(null)} className="text-[#6B7280] hover:text-[#1F2937] font-bold">✕</button>
            </div>

            <div className="text-xs space-y-1 bg-[#F9FAFB] p-3 rounded-xl border border-[#E5E7EB]">
              <div><span className="text-[#6B7280]">Đơn cọc:</span> <span className="font-mono text-[#E60012] font-bold">{selectedOrderForVin.orderId}</span></div>
              <div><span className="text-[#6B7280]">Khách hàng:</span> <span className="font-bold text-[#1F2937]">{selectedOrderForVin.customerName}</span> ({selectedOrderForVin.customerPhone})</div>
              <div><span className="text-[#6B7280]">Mẫu xe:</span> <span className="font-semibold text-[#1F2937]">{selectedOrderForVin.items[0]?.productName}</span></div>
            </div>

            {vinError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[#EF4444] text-xs">
                ⚠️ {vinError}
              </div>
            )}

            <form onSubmit={handleAssignVinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2">Nhập Số VIN Xe Thực Tế (17 Ký tự)</label>
                <input
                  type="text"
                  maxLength={17}
                  value={vinInput}
                  onChange={(e) => setVinInput(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: VF8P1234567890123"
                  required
                  className="w-full bg-white border border-[#D1D5DB] text-[#1F2937] font-mono rounded-xl p-3 text-xs outline-none focus:border-[#E60012]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForVin(null)}
                  className="px-4 py-2 bg-white border border-[#D1D5DB] text-[#374151] rounded-xl text-xs font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isAssigningVin}
                  className="px-5 py-2 bg-[#E60012] hover:bg-[#C80010] text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {isAssigningVin ? "Đang gán VIN..." : "Xác nhận gán VIN"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
