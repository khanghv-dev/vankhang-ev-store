"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

interface OrderDetail {
  orderId: string;
  customerName: string;
  vehicleName: string;
  colorName: string;
  vinNumber: string;
  showroomName: string;
  expectedDeliveryDate: string;
  currentStepIndex: number;
}

const mockOrder: OrderDetail = {
  orderId: "OD-VF8-9921",
  customerName: "Nguyễn Văn Hùng",
  vehicleName: "VinFast VF 8 Plus",
  colorName: "Deep Ocean (Xanh Rêu)",
  vinNumber: "VNF8PLUS202606190123",
  showroomName: "VinFast Showroom Ocean Park (Gia Lâm, Hà Nội)",
  expectedDeliveryDate: "26/06/2026",
  currentStepIndex: 2,
};

const steps = [
  {
    title: "Đã đặt cọc",
    description: "Khách hàng hoàn tất thanh toán đặt cọc giữ chỗ.",
    date: "18/06/2026",
  },
  {
    title: "Đã gán số VIN",
    description: "Hệ thống đã định danh xe và cấp mã số VIN chính thức.",
    date: "19/06/2026",
  },
  {
    title: "Xe đang vận chuyển",
    description: "Xe đang được vận chuyển từ nhà máy Hải Phòng về Showroom.",
    date: "Đang xử lý",
  },
  {
    title: "Sẵn sàng bàn giao",
    description: "Xe đã cập bến và sẵn sàng bàn giao cho quý khách hàng.",
    date: "Dự kiến 26/06/2026",
  },
];

export default function OrderTrackingPage() {
  const router = useRouter();
  const { isAuthenticated, userEmail } = useAuth();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderDetail | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          router.push("/login");
          return;
        }

        const url = userEmail
          ? `http://localhost:5022/api/orders/my-orders?email=${encodeURIComponent(userEmail)}`
          : "http://localhost:5022/api/orders/my-orders";

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const first = data[0];
            const item = first.items?.[0];
            const milestone = first.status === "Paid" ? 1 : first.status === "Preparing" ? 2 : first.status === "Ready" || first.status === "Delivered" ? 3 : 0;
            
            const rawId = typeof first.id === "string" ? first.id : first.id?.value ? String(first.id.value) : String(first.id || "");
            const formattedOrderId = rawId ? rawId.substring(0, 8).toUpperCase() : "OD-VF-2026";

            setOrder({
              orderId: formattedOrderId,
              customerName: first.customerName || "Khách hàng VinFast",
              vehicleName: item?.productName || "VinFast VF 8 Plus",
              colorName: "Tiêu chuẩn",
              vinNumber: item?.assignedVin || "VNF8PLUS202606190123",
              showroomName: "VinFast Showroom Smart City",
              expectedDeliveryDate: first.paidAt ? new Date(first.paidAt).toLocaleDateString("vi-VN") : "Đang cập nhật",
              currentStepIndex: milestone,
            });
          }
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu đơn hàng từ backend:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-neutral-50 gap-4">
        <svg className="animate-spin h-10 w-10 text-[#E30613]" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <span className="text-sm font-semibold text-neutral-500">Đang tải tiến độ đơn hàng...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[80vh] bg-gradient-to-b from-neutral-50 via-neutral-100 to-neutral-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400">
            <Link href="/" className="hover:text-[#E30613] transition-colors">Trang chủ</Link>
            <span>/</span>
            <span className="text-neutral-500">Trang cá nhân</span>
            <span>/</span>
            <span className="text-neutral-700">Theo dõi đơn hàng</span>
          </div>

          <div className="bg-white rounded-3xl border border-neutral-100 p-12 text-center space-y-4 shadow-sm">
            <div className="text-4xl">🚚</div>
            <h3 className="text-lg font-bold text-neutral-800">Bạn chưa có đơn hàng nào đang xử lý</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Sau khi bạn đặt cọc xe điện VinFast, tiến độ sản xuất và vận chuyển về Showroom sẽ được cập nhật trực tiếp tại đây.
            </p>
            <Link 
              href="/"
              className="inline-block bg-[#E30613] hover:bg-red-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-colors shadow-md"
            >
              Đặt cọc xe VinFast ngay
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-neutral-50 gap-4">
        <svg className="animate-spin h-10 w-10 text-[#E30613]" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <span className="text-sm font-semibold text-neutral-500">Đang tải dữ liệu đơn hàng...</span>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-neutral-50 via-neutral-100 to-neutral-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400">
          <Link href="/" className="hover:text-[#E30613] transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-neutral-500">Trang cá nhân</span>
          <span>/</span>
          <span className="text-neutral-700">Theo dõi đơn hàng</span>
        </div>

        {/* Page Header */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#E30613] to-red-800"></div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#E30613]">Mã đơn hàng: {order.orderId}</span>
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 mt-1 font-sans">Tiến độ chuẩn bị xe</h1>
            <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider mt-0.5">Cập nhật thời gian thực từ nhà máy VinFast</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-amber-850 text-xs font-black self-start sm:self-auto flex items-center gap-1.5 shrink-0 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>
            <span>{steps[order.currentStepIndex]?.title || "Đã đặt cọc"}</span>
          </div>
        </div>

        {/* Stepper Card */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-8 shadow-xl space-y-8">
          <h2 className="text-sm font-black uppercase tracking-wider text-neutral-800 border-l-4 border-[#E30613] pl-3 leading-none">
            Trình tự quy trình chuẩn bị
          </h2>

          {/* Stepper Container */}
          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-8 md:gap-4 mt-6">
            
            {/* Desktop connecting lines */}
            <div className="hidden md:block absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-neutral-100 -z-0">
              <div 
                className="h-full bg-[#E30613] transition-all duration-500" 
                style={{ width: `${(order.currentStepIndex / (steps.length - 1)) * 100}%` }}
              ></div>
            </div>

            {/* Steps loop */}
            {steps.map((step, idx) => {
              const isCompleted = idx < order.currentStepIndex;
              const isActive = idx === order.currentStepIndex;
              const isPending = idx > order.currentStepIndex;

              return (
                <div key={idx} className="flex md:flex-col items-center gap-4 md:gap-3 flex-1 w-full relative z-10 group">
                  {/* Step Line (Mobile View Only) */}
                  {idx < steps.length - 1 && (
                    <div className="md:hidden absolute left-6 top-12 bottom-0 w-1 bg-neutral-100 -z-10">
                      <div 
                        className="w-full bg-[#E30613]" 
                        style={{ height: isCompleted || isActive ? "100%" : "0%" }}
                      ></div>
                    </div>
                  )}

                  {/* Step Bubble Icon */}
                  <div 
                    className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-300 ${
                      isCompleted 
                        ? "bg-[#E30613] border-[#E30613] text-white shadow-md shadow-[#E30613]/20" 
                        : isActive 
                        ? "bg-white border-[#E30613] text-[#E30613] shadow-lg ring-4 ring-red-500/10 scale-105" 
                        : "bg-white border-neutral-200 text-neutral-400"
                    }`}
                  >
                    {isCompleted ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                      </svg>
                    ) : isActive ? (
                      <div className="relative flex items-center justify-center">
                        <span className="absolute inline-flex h-8 w-8 rounded-full bg-red-500/10 animate-ping"></span>
                        <svg className="h-5 w-5 text-[#E30613]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125a1.125 1.125 0 0 0 1.125-1.125V9.75M3.75 14.25h16.5M3.75 14.25v-4.5m0 0A2.25 2.25 0 0 1 6 7.5h7.5a2.25 2.25 0 0 1 2.25 2.25v4.5m-12 0h12" />
                        </svg>
                      </div>
                    ) : (
                      <span className="text-xs font-black">{idx + 1}</span>
                    )}
                  </div>

                  {/* Step Descriptions */}
                  <div className="flex-1 md:text-center space-y-1.5 pr-2 md:pr-0">
                    <p className={`text-sm font-black transition-colors ${
                      isActive ? "text-[#E30613]" : isCompleted ? "text-neutral-800" : "text-neutral-400"
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-[11px] text-neutral-400 font-semibold leading-relaxed hidden sm:block md:max-w-[180px] md:mx-auto">
                      {step.description}
                    </p>
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded font-black tracking-wide ${
                      isCompleted 
                        ? "bg-green-50 text-green-700 font-bold" 
                        : isActive 
                        ? "bg-amber-50 text-amber-700" 
                        : "bg-neutral-100 text-neutral-400"
                    }`}>
                      {step.date}
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* Order Details Panel */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-8 shadow-xl space-y-6">
          <h2 className="text-sm font-black uppercase tracking-wider text-neutral-800 border-l-4 border-[#E30613] pl-3 leading-none">
            Thông tin chi tiết xe bàn giao
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-2">
            
            {/* Left Column */}
            <div className="space-y-4 divide-y divide-neutral-100">
              
              <div className="flex justify-between items-center py-2 text-sm">
                <span className="font-semibold text-neutral-400">Dòng xe đặt mua:</span>
                <span className="font-black text-neutral-800 text-right">{order.vehicleName}</span>
              </div>

              <div className="flex justify-between items-center py-3.5 text-sm">
                <span className="font-semibold text-neutral-400">Màu sắc ngoại thất:</span>
                <span className="font-black text-neutral-800 text-right flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full border border-neutral-300 bg-[#004d40]"></span>
                  {order.colorName}
                </span>
              </div>

              <div className="flex justify-between items-center py-3.5 text-sm">
                <span className="font-semibold text-neutral-400">Định danh số VIN:</span>
                <span className="font-mono font-bold text-neutral-700 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-100">{order.vinNumber}</span>
              </div>

            </div>

            {/* Right Column */}
            <div className="space-y-4 divide-y divide-neutral-100">
              
              <div className="flex justify-between items-start py-2 text-sm gap-2">
                <span className="font-semibold text-neutral-400 shrink-0">Showroom nhận xe:</span>
                <span className="font-black text-neutral-800 text-right leading-tight max-w-[200px]">{order.showroomName}</span>
              </div>

              <div className="flex justify-between items-center py-3.5 text-sm">
                <span className="font-semibold text-neutral-400">Ngày giao xe dự kiến:</span>
                <span className="font-black text-neutral-900 bg-red-50 text-[#E30613] px-2.5 py-0.5 rounded font-bold">{order.expectedDeliveryDate}</span>
              </div>

              <div className="flex justify-between items-center py-3.5 text-sm">
                <span className="font-semibold text-neutral-400">Chủ sở hữu hợp đồng:</span>
                <span className="font-black text-neutral-800">{order.customerName}</span>
              </div>

            </div>
          </div>
        </div>

        {/* Action Bottom Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-neutral-100/50 p-6 shadow-sm">
          <div className="text-center sm:text-left">
            <h3 className="text-sm font-bold text-neutral-800">Cần sự hỗ trợ trực tiếp từ nhân viên bàn giao?</h3>
            <p className="text-xs text-neutral-400 mt-0.5 font-medium">Chúng tôi luôn túc trực phục vụ quý khách 24/7</p>
          </div>
          <a
            href="tel:1900232389"
            className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs tracking-wider uppercase px-5 py-3 transition-colors shadow-md cursor-pointer shrink-0"
          >
            📞 Tổng đài CSKH: 1900 2323 89
          </a>
        </div>

      </div>
    </div>
  );
}
