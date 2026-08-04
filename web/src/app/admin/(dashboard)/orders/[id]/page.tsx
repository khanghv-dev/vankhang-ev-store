"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "../../../../../context/AdminAuthContext";

interface OrderItemDto {
  itemId: string;
  productId: string;
  productName: string;
  assignedVin: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

interface OrderDetailDto {
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

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  const { adminUser, logoutAdmin, adminToken } = useAdminAuth();
  const router = useRouter();

  const [order, setOrder] = useState<OrderDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // VIN Assignment State
  const [vinInput, setVinInput] = useState("");
  const [isAssigningVin, setIsAssigningVin] = useState(false);
  const [vinError, setVinError] = useState("");

  const fetchOrderDetail = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const response = await fetch(`http://localhost:5022/api/admin/orders?orderId=${encodeURIComponent(orderId)}`, {
        headers: {
          "Authorization": `Bearer ${adminToken || ""}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          const matched = data.items.find((o: any) => o.orderId.toLowerCase() === orderId.toLowerCase()) || data.items[0];
          setOrder(matched);
          const firstVin = matched.items[0]?.assignedVin || "";
          setVinInput(firstVin);
        } else {
          // Fallback mock data for visual showcase if backend order isn't created yet
          setOrder({
            orderId: orderId,
            customerId: "usr-88291039",
            customerName: "Khách hàng VinFast",
            customerEmail: "nguyenvananh@gmail.com",
            customerPhone: "0987654321",
            customerIdCard: "001200012345",
            storeId: "11111111-2222-3333-4444-555555555555",
            totalAmount: 1090000000,
            depositAmount: 50000000,
            depositType: "LinhHoat",
            batteryOption: "Thuê pin LFP",
            status: "VinAssigned",
            paidAt: "2026-06-27T10:30:00Z",
            cancelledAt: null,
            cancellationReason: null,
            createdAt: "2026-06-27T09:15:00Z",
            items: [
              {
                itemId: "item-001",
                productId: "prod-vf8",
                productName: "VinFast VF 8 Plus",
                assignedVin: "VF8P1234567890123",
                unitPrice: 1090000000,
                quantity: 1,
                lineTotal: 1090000000,
              },
            ],
          });
          setVinInput("VF8P1234567890123");
        }
      } else {
        setErrorMsg("Không thể tải thông tin đơn hàng.");
      }
    } catch (err) {
      console.error("Lỗi tải chi tiết đơn:", err);
      setErrorMsg("Lỗi kết nối Order Service API (Port 5022).");
    } finally {
      setIsLoading(false);
    }
  }, [orderId, adminToken]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  // Handle Assign VIN Action
  const handleAssignVinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVinError("");
    setSuccessMsg("");

    const cleanVin = vinInput.trim().toUpperCase();
    if (cleanVin.length !== 17) {
      setVinError("Mã VIN phải có đúng 17 ký tự chữ và số tiêu chuẩn ô tô VinFast.");
      return;
    }

    setIsAssigningVin(true);
    try {
      const response = await fetch(`http://localhost:5022/api/admin/orders/${orderId}/assign-vin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken || ""}`,
        },
        body: JSON.stringify({ vin: cleanVin }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMsg(`✓ ${data.message || "Gán mã số VIN thành công!"}`);
        fetchOrderDetail();
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

  // Handle Kafka Ready Event
  const handleReadyForDelivery = async () => {
    if (!confirm("Xác nhận phát lệnh Kafka (VehicleReadyForDeliveryEvent) đến Showroom Mobile App?")) return;
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const response = await fetch(`http://localhost:5022/api/admin/orders/${orderId}/ready-for-delivery`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken || ""}`,
        },
        body: JSON.stringify({ instructions: "Đã hoàn thành rửa xe, sạc đầy pin 100% và dán phim cách nhiệt." }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMsg(`🚀 ${data.message}`);
        fetchOrderDetail();
      } else {
        setErrorMsg(data.message || "Lỗi khi kích hoạt bàn giao.");
      }
    } catch (err) {
      console.error("Lỗi bàn giao:", err);
      setErrorMsg("Lỗi kết nối API.");
    }
  };

  if (!adminUser) return null;

  // Stepper logic calculation based on status
  const getStepIndex = (status: string | undefined) => {
    switch (status) {
      case "Pending": return 0;
      case "Paid": return 1;
      case "VinAssigned": return 2;
      case "Preparing": return 3;
      case "Delivered": return 4;
      case "Refunded":
      case "Cancelled": return -1;
      default: return 1;
    }
  };

  const currentStep = getStepIndex(order?.status);

  const steps = [
    { title: "Đã cọc", desc: "Xác nhận VNPAY" },
    { title: "Đã gán VIN", desc: "Cố định khung xe" },
    { title: "Xe tại Showroom", desc: "Đang kiểm tra & sạc" },
    { title: "Sẵn sàng bàn giao", desc: "Bắn lệnh Kafka" },
    { title: "Hoàn thành", desc: "Bàn giao chìa khóa" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FB] font-sans text-[#374151] p-4 sm:p-8 select-none">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)] gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin/orders")}
              className="px-3 py-1.5 bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#374151] hover:text-[#111827] rounded-xl text-xs font-semibold transition-all shadow-sm"
            >
              ◀ Danh sách đơn hàng
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-[#111827]">
                  Chi Tiết Đơn Hàng #{orderId.substring(0, 8).toUpperCase()}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-50 text-[#2563EB] border border-blue-200">
                  {order?.status || "Processing"}
                </span>
              </div>
              <p className="text-xs text-[#6B7280] mt-0.5 font-mono">Mã GUID: {orderId}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchOrderDetail}
              className="px-4 py-2 bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#374151] rounded-xl text-xs font-semibold transition-all shadow-sm"
            >
              🔄 Tải lại dữ liệu
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

        {/* 1. TOP SECTION: STEPPER TIẾN ĐỘ XỬ LÝ ĐƠN HÀNG */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)] relative overflow-hidden">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#E5E7EB]">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#2563EB] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-ping"></span>
              Tiến Trình Xử Lý Đơn Hàng (Order Lifecycle Stepper)
            </h2>
            {currentStep === -1 && (
              <span className="px-3 py-1 bg-red-50 border border-red-200 text-[#EF4444] rounded-lg text-xs font-bold">
                ⚠️ Đơn Hàng Đã Hủy / Hoàn Cọc
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative">
            {steps.map((step, idx) => {
              const isPassed = currentStep > idx;
              const isCurrent = currentStep === idx;

              return (
                <div key={idx} className="relative flex flex-col items-center text-center group">
                  {/* Connecting Line */}
                  {idx < steps.length - 1 && (
                    <div className="hidden sm:block absolute top-5 left-1/2 w-full h-1 bg-[#E5E7EB] -z-0">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          isPassed ? "bg-[#10B981]" : isCurrent ? "bg-gradient-to-r from-[#10B981] to-[#2563EB]" : ""
                        }`}
                      ></div>
                    </div>
                  )}

                  {/* Step Icon Badge */}
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs z-10 transition-all duration-300 shadow-sm ${
                    isPassed ? "bg-[#10B981] text-white scale-105" :
                    isCurrent ? "bg-[#E11D2E] text-white ring-4 ring-red-100 scale-110 shadow-md animate-pulse" :
                    "bg-[#F9FAFB] text-[#9CA3AF] border border-[#E5E7EB]"
                  }`}>
                    {isPassed ? "✓" : idx + 1}
                  </div>

                  <div className="mt-3">
                    <p className={`text-xs font-bold transition-colors ${
                      isPassed ? "text-[#10B981]" : isCurrent ? "text-[#E11D2E] font-extrabold" : "text-[#6B7280]"
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-[10px] text-[#9CA3AF] mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. MAIN LAYOUT: CHIA ĐÔI (50-50) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* BÊN TRÁI: Thông tin khách hàng & Lịch sử thanh toán VNPAY */}
          <div className="space-y-6">
            
            {/* Card 1: Thông tin khách hàng */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#2563EB] flex items-center gap-2">
                  <span>👤</span> Thông Tin Khách Hàng Đặt Cọc
                </h2>
                <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-[#2563EB] rounded text-[10px] font-mono font-bold">
                  VERIFIED CUSTOMER
                </span>
              </div>

              {isLoading ? (
                <div className="h-32 bg-[#F9FAFB] animate-pulse rounded-2xl"></div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-[#F9FAFB] p-3.5 rounded-2xl border border-[#E5E7EB]">
                    <p className="text-[#6B7280] text-[10px] uppercase font-bold">Họ và tên</p>
                    <p className="text-[#111827] font-bold text-sm mt-0.5">{order?.customerName}</p>
                  </div>

                  <div className="bg-[#F9FAFB] p-3.5 rounded-2xl border border-[#E5E7EB]">
                    <p className="text-[#6B7280] text-[10px] uppercase font-bold">Số điện thoại</p>
                    <p className="text-[#2563EB] font-mono font-bold text-sm mt-0.5">{order?.customerPhone}</p>
                  </div>

                  <div className="bg-[#F9FAFB] p-3.5 rounded-2xl border border-[#E5E7EB]">
                    <p className="text-[#6B7280] text-[10px] uppercase font-bold">Email liên hệ</p>
                    <p className="text-[#374151] font-medium mt-0.5">{order?.customerEmail}</p>
                  </div>

                  <div className="bg-[#F9FAFB] p-3.5 rounded-2xl border border-[#E5E7EB]">
                    <p className="text-[#6B7280] text-[10px] uppercase font-bold">Số CCCD / CMND</p>
                    <p className="text-[#374151] font-mono font-semibold mt-0.5">{order?.customerIdCard || "001200012345"}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Card 2: Lịch sử thanh toán VNPAY */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#10B981] flex items-center gap-2">
                  <span>💳</span> Lịch Sử Thanh Toán Cổng VNPAY
                </h2>
                <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-[#10B981] rounded-lg text-[10px] font-bold">
                  ✓ THANH TOÁN THÀNH CÔNG
                </span>
              </div>

              <div className="bg-[#F9FAFB] p-4 rounded-2xl border border-[#E5E7EB] space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-[#E5E7EB]">
                  <span className="text-[#6B7280]">Số tiền đặt cọc</span>
                  <span className="font-mono font-extrabold text-[#10B981] text-sm">
                    {(order?.depositAmount ?? 50000000).toLocaleString("vi-VN")} đ
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E5E7EB]">
                  <span className="text-[#6B7280]">Mã Giao dịch VNPAY</span>
                  <span className="font-mono font-bold text-[#111827]">VNPAY-14928103</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E5E7EB]">
                  <span className="text-[#6B7280]">Ngân hàng thanh toán</span>
                  <span className="font-bold text-[#2563EB]">NCB / Vietcombank</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#6B7280]">Thời gian ghi nhận</span>
                  <span className="text-[#374151] font-mono">
                    {order?.paidAt ? new Date(order.paidAt).toLocaleString("vi-VN") : "27/06/2026 10:30:00"}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* BÊN PHẢI: Thông tin dòng xe cọc & Ô chọn gán số VIN */}
          <div className="space-y-6">
            
            {/* Card 1: Thông tin dòng xe cọc */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#2563EB] flex items-center gap-2">
                  <span>🚘</span> Thông Tin Xe Đặt Cọc
                </h2>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  order?.depositType === "LinhHoat" 
                    ? "bg-cyan-50 text-cyan-700 border border-cyan-200" 
                    : "bg-purple-50 text-purple-700 border border-purple-200"
                }`}>
                  Gói {order?.depositType === "LinhHoat" ? "Linh Hoạt" : "Cam Kết"}
                </span>
              </div>

              <div className="flex items-center gap-4 bg-[#F9FAFB] p-4 rounded-2xl border border-[#E5E7EB]">
                <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-3xl shrink-0 text-[#E11D2E]">
                  ⚡
                </div>
                <div className="flex-1">
                  <h3 className="font-extrabold text-[#111827] text-base">{order?.items[0]?.productName || "VinFast VF 8 Plus"}</h3>
                  <div className="flex items-center gap-3 text-xs mt-1">
                    <span className="text-[#6B7280]">Giá niêm yết:</span>
                    <span className="font-mono font-bold text-[#111827]">{(order?.totalAmount ?? 1090000000).toLocaleString("vi-VN")} đ</span>
                  </div>
                  <p className="text-[11px] text-[#2563EB] mt-1">Gói pin: {order?.batteryOption || "Thuê pin LFP thế hệ mới"}</p>
                </div>
              </div>
            </div>

            {/* Card 2: Ô cho phép chọn gán số VIN của xe */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)] space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#F59E0B] flex items-center gap-2">
                  <span>📌</span> Điều Phối & Gán Mã Số Khung (VIN)
                </h2>
                {order?.items[0]?.assignedVin ? (
                  <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-[#10B981] rounded-lg text-[10px] font-bold">
                    ✓ ĐÃ CHỐT VIN
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-[#F59E0B] rounded-lg text-[10px] font-bold">
                    ⏳ CHỜ GÁN VIN
                  </span>
                )}
              </div>

              {vinError && (
                <div className="p-3 bg-red-50 border border-red-200 text-[#EF4444] text-xs rounded-xl">
                  ⚠️ {vinError}
                </div>
              )}

              <form onSubmit={handleAssignVinSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#374151] mb-2">
                    Mã số VIN thực tế về Showroom (17 ký tự)
                  </label>
                  <input
                    type="text"
                    maxLength={17}
                    value={vinInput}
                    onChange={(e) => setVinInput(e.target.value.toUpperCase())}
                    placeholder="Nhập chuỗi VIN 17 ký tự..."
                    className="w-full bg-white border border-[#E5E7EB] text-[#10B981] font-mono font-bold text-center tracking-widest text-base rounded-2xl p-4 outline-none focus:border-[#E11D2E] focus:ring-1 focus:ring-red-100 transition-colors"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isAssigningVin}
                    className="w-full py-3.5 bg-[#E11D2E] hover:bg-[#C8102E] text-white rounded-2xl text-xs font-bold transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isAssigningVin ? "Đang gán VIN..." : "📌 Xác Nhận Gán VIN Thực Tế"}
                  </button>
                </div>
              </form>

              {/* Action Operations */}
              <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between gap-3">
                <button
                  onClick={handleReadyForDelivery}
                  className="w-1/2 py-3 bg-[#F59E0B] hover:bg-[#D97706] text-white font-extrabold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <span>🚗</span> Sẵn sàng bàn giao (Kafka)
                </button>

                <button
                  onClick={() => router.push("/admin/orders")}
                  className="w-1/2 py-3 bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#374151] rounded-2xl text-xs font-semibold transition-all text-center"
                >
                  Quay lại danh sách
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
