"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

interface DepositOrder {
  depositId: string;
  vehicleName: string;
  depositDate: string;
  amount: string;
  type: "Linh hoạt" | "Cam kết";
  status: "SUCCESS" | "PENDING" | "PENDING_REFUND" | "CANCELLED_REFUNDED";
  vinNumber?: string;
  showroomName?: string;
}

const mockDeposits: DepositOrder[] = [
  {
    depositId: "FLZ-9821",
    vehicleName: "VinFast Feliz S",
    depositDate: "18/06/2026",
    amount: "15.000.000 đ",
    type: "Linh hoạt",
    status: "SUCCESS",
    vinNumber: "VNFELIZS202606189821",
    showroomName: "VinFast Showroom Ocean Park (Gia Lâm, Hà Nội)",
  },
  {
    depositId: "EVO-2001",
    vehicleName: "VinFast Evo200 Lite",
    depositDate: "15/06/2026",
    amount: "2.000.000 đ",
    type: "Linh hoạt",
    status: "PENDING_REFUND",
  },
  {
    depositId: "VF6-7781",
    vehicleName: "VinFast VF 6 Plus",
    depositDate: "10/05/2026",
    amount: "5.000.000 đ",
    type: "Cam kết",
    status: "CANCELLED_REFUNDED",
  },
];

export default function DepositHistoryPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [deposits, setDeposits] = useState<DepositOrder[]>([]);
  const [activeQrOrder, setActiveQrOrder] = useState<DepositOrder | null>(null);

  useEffect(() => {
    async function fetchDeposits() {
      try {
        const token = localStorage.getItem("accessToken");
        const userPhone = localStorage.getItem("userPhone") || localStorage.getItem("lastOrderPhone") || "";

        // Nếu không đăng nhập và không có phone → redirect login
        if (!token && !userPhone) {
          router.push("/login");
          return;
        }

        // Xây URL: nếu có phone thì lọc theo phone
        let url = "http://localhost:5022/api/orders/my-orders";
        if (userPhone) {
          url += `?phone=${encodeURIComponent(userPhone)}`;
        }

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const mapStatus = (s: string): DepositOrder["status"] => {
              if (s === "Paid" || s === "Delivered" || s === "Ready") return "SUCCESS";
              if (s === "Cancelled") return "CANCELLED_REFUNDED";
              if (s === "Preparing") return "PENDING_REFUND";
              return "PENDING"; // Pending, Created, etc.
            };
            const mapped: DepositOrder[] = data.map((item: any) => ({
              depositId: item.id?.substring(0, 8).toUpperCase() || "ORD-2026",
              vehicleName: item.items?.[0]?.productName || "VinFast VF 8",
              depositDate: item.paidAt
                ? new Date(item.paidAt).toLocaleDateString("vi-VN")
                : new Date(item.createdAt).toLocaleDateString("vi-VN"),
              amount: `${(item.depositAmount || 0).toLocaleString("vi-VN")} đ`,
              type: (item.depositType === 0 ? "Linh hoạt" : "Cam kết") as "Linh hoạt" | "Cam kết",
              status: mapStatus(item.status),
              vinNumber: item.items?.[0]?.assignedVin || "",
              showroomName: "VinFast Showroom Smart City",
            }));
            setDeposits(mapped);
          } else if (Array.isArray(data) && data.length === 0) {
            // Không có đơn nào theo phone → fallback lấy 20 đơn mới nhất
            setDeposits([]);
          }
        }
      } catch (error) {
        console.error("Lỗi khi tải lịch sử cọc từ backend API:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDeposits();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-neutral-50 gap-4">
        <svg className="animate-spin h-10 w-10 text-[#E30613]" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <span className="text-sm font-semibold text-neutral-500">Đang tải lịch sử đặt cọc...</span>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-neutral-50 via-neutral-100 to-neutral-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400">
          <Link href="/" className="hover:text-[#E30613] transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-neutral-500">Trang cá nhân</span>
          <span>/</span>
          <span className="text-neutral-700">Lịch sử đặt cọc</span>
        </div>

        {/* Page Header */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#E30613] to-red-800"></div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 font-sans">Lịch sử đặt cọc xe</h1>
            <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider mt-0.5">Quản lý danh sách các đơn hàng và vé nhận xe của bạn</p>
          </div>
          <div className="bg-neutral-50 rounded-xl px-4 py-2 border border-neutral-100 text-neutral-500 text-xs font-bold text-center shrink-0 self-start sm:self-auto">
            Tổng đơn cọc: <span className="text-[#E30613] font-black">{deposits.length}</span>
          </div>
        </div>

        {/* Deposit List */}
        {deposits.length > 0 ? (
          <div className="space-y-4">
            {deposits.map((order) => (
              <div 
                key={order.depositId} 
                className="bg-white rounded-2xl border border-neutral-150 p-6 shadow-md hover:shadow-lg transition-all duration-200 relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6"
              >
                {/* Left Column: ID & Car specs */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-mono font-bold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-150">
                      #{order.depositId}
                    </span>
                    <span className="text-xs font-semibold text-neutral-500">{order.depositDate}</span>
                  </div>
                  <h2 className="text-lg font-black text-neutral-900 leading-tight">{order.vehicleName}</h2>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-400 font-semibold">
                    <span className="flex items-center gap-1">
                      💰 Số tiền cọc: <strong className="text-neutral-700">{order.amount}</strong>
                    </span>
                    <span>|</span>
                    <span className="flex items-center gap-1">
                      🏷️ Loại cọc: <strong className="text-neutral-700">{order.type}</strong>
                    </span>
                  </div>
                </div>

                {/* Right Column: Badges & Buttons */}
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 pt-4 sm:pt-0 border-t border-neutral-50 sm:border-t-0">
                  {/* Status Badges */}
                  {order.status === "SUCCESS" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-250">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Đã giữ chỗ thành công
                    </span>
                  )}
                  {order.status === "PENDING_REFUND" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 ring-1 ring-inset ring-amber-250">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Đang chờ trả cọc
                    </span>
                  )}
                  {order.status === "CANCELLED_REFUNDED" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-50 px-2.5 py-0.5 text-xs font-bold text-neutral-500 ring-1 ring-inset ring-neutral-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
                      Đã hủy/Hoàn cọc
                    </span>
                  )}

                  {/* Actions */}
                  {order.status === "SUCCESS" && (
                    <button 
                      onClick={() => setActiveQrOrder(order)}
                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-[#E30613] hover:bg-[#E30613]/5 active:scale-[0.98] transition-all text-xs font-extrabold text-[#E30613] px-3.5 py-2 cursor-pointer shadow-sm shadow-[#E30613]/5"
                    >
                      🎟️ Xem vé nhận xe
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-neutral-100 p-12 text-center space-y-4 shadow-sm">
            <div className="text-4xl">📋</div>
            <h3 className="text-lg font-bold text-neutral-800">Bạn chưa có đơn đặt cọc nào</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Khi thực hiện đặt cọc giữ chỗ thành công các dòng xe máy điện VinFast, đơn cọc của bạn sẽ được lưu vết và hiển thị tại đây.
            </p>
            <Link 
              href="/"
              className="inline-block bg-[#E30613] hover:bg-red-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-colors shadow-md"
            >
              Đặt cọc xe VinFast ngay
            </Link>
          </div>
        )}

        {/* QR Ticket Popup Modal */}
        {activeQrOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Dark glass backdrop overlay */}
            <div 
              onClick={() => setActiveQrOrder(null)} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
            ></div>

            {/* Modal Box */}
            <div className="bg-white rounded-3xl border border-neutral-100 p-6 sm:p-8 max-w-sm w-full relative z-10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center text-center space-y-6">
              
              {/* Brand Stripe Indicator */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#E30613] to-red-800"></div>

              {/* Close Button */}
              <button 
                onClick={() => setActiveQrOrder(null)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 p-1.5 rounded-full cursor-pointer transition-colors"
                aria-label="Đóng Pop-up"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#E30613]">Vé nhận xe điện tử</span>
                <h3 className="text-lg font-black text-neutral-900">{activeQrOrder.vehicleName}</h3>
                <span className="inline-block text-[10px] font-mono font-bold text-neutral-400 bg-neutral-50 px-2.5 py-0.5 rounded border border-neutral-150">
                  Mã cọc: #{activeQrOrder.depositId}
                </span>
              </div>

              {/* QR Code SVG Vector Graphic */}
              <div className="bg-white border border-neutral-150 p-4 rounded-2xl shadow-inner relative flex flex-col items-center">
                <svg className="h-44 w-44 text-neutral-900" viewBox="0 0 100 100" fill="currentColor">
                  {/* Outer corner squares */}
                  <rect x="0" y="0" width="25" height="25" />
                  <rect x="2" y="2" width="21" height="21" fill="white" />
                  <rect x="6" y="6" width="13" height="13" />

                  <rect x="75" y="0" width="25" height="25" />
                  <rect x="77" y="2" width="21" height="21" fill="white" />
                  <rect x="81" y="6" width="13" height="13" />

                  <rect x="0" y="75" width="25" height="25" />
                  <rect x="2" y="77" width="21" height="21" fill="white" />
                  <rect x="6" y="81" width="13" height="13" />

                  {/* Mock QR details pattern */}
                  <rect x="35" y="10" width="8" height="8" />
                  <rect x="45" y="5" width="8" height="15" />
                  <rect x="60" y="15" width="10" height="8" />
                  <rect x="15" y="35" width="8" height="8" />
                  <rect x="10" y="45" width="15" height="8" />
                  
                  {/* Center branding box */}
                  <rect x="38" y="38" width="24" height="24" />
                  <rect x="40" y="40" fill="white" width="20" height="20" />
                  {/* Tiny Red V branding in center of QR */}
                  <path d="M46 45 L50 54 L54 45" fill="none" stroke="#E30613" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                  <rect x="70" y="40" width="8" height="15" />
                  <rect x="35" y="75" width="8" height="8" />
                  <rect x="45" y="80" width="15" height="8" />
                  <rect x="75" y="75" width="8" height="8" />
                  <rect x="85" y="85" width="10" height="10" />
                  <rect x="65" y="65" width="15" height="8" />
                  <rect x="80" y="55" width="8" height="12" />
                </svg>
                <span className="text-[8px] text-neutral-400 font-extrabold uppercase tracking-widest mt-2">Đưa mã này cho Showroom để quét nhận xe</span>
              </div>

              {/* Showroom info & VIN */}
              <div className="w-full text-xs font-semibold text-neutral-500 text-left bg-neutral-50 rounded-2xl p-4 border border-neutral-150 space-y-2">
                <div className="flex justify-between items-center py-1">
                  <span>Số VIN xe được gán:</span>
                  <span className="font-mono font-bold text-neutral-800">{activeQrOrder.vinNumber}</span>
                </div>
                <div className="flex justify-between items-start py-1 gap-2">
                  <span className="shrink-0">Showroom giao xe:</span>
                  <span className="font-black text-neutral-800 text-right leading-tight max-w-[170px]">{activeQrOrder.showroomName}</span>
                </div>
              </div>

              {/* Close Button */}
              <button 
                onClick={() => setActiveQrOrder(null)}
                className="w-full py-3 rounded-xl bg-[#E30613] hover:bg-[#E30613]/90 active:scale-[0.98] text-white text-xs font-black tracking-wider uppercase transition-all shadow-md shadow-brand-500/10 cursor-pointer"
              >
                Đồng ý & Đóng
              </button>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
