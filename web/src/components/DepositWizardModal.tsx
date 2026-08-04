"use client";

import React, { useState } from "react";
import { API_CONFIG } from "@/config/apiConfig";

interface DepositWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    price: number;
  };
  selectedColor: string;
}

interface Showroom {
  id: string;
  name: string;
  address: string;
  phone: string;
  city: string;
  district: string;
}

const MOCK_SHOWROOMS: Showroom[] = [
  {
    id: "7ade971e-16e8-4e4e-bc75-54c7e4843062",
    name: "VinFast Showroom Mỹ Đình",
    address: "Phạm Hùng, Mỹ Đình 2, Nam Từ Liêm, Hà Nội",
    phone: "1900 232389",
    city: "hanoi",
    district: "namtuliem",
  },
  {
    id: "ed331c16-7732-4cf3-8ac2-3e30d7de9011",
    name: "VinFast Showroom Landmark 81",
    address: "720A Điện Biên Phủ, Phường 22, Bình Thạnh, TP. Hồ Chí Minh",
    phone: "1900 232389",
    city: "hcm",
    district: "binhthanh",
  },
  {
    id: "454ad1fd-9118-4b52-9ad2-35fc4796ab18",
    name: "VinFast Showroom Thảo Điền",
    address: "159 Xa lộ Hà Nội, Thảo Điền, TP. Thủ Đức, TP. Hồ Chí Minh",
    phone: "1900 232389",
    city: "hcm",
    district: "thaodien",
  },
  {
    id: "334fb037-b6a1-49a5-9e4f-0f29e265f6e2",
    name: "VinFast Showroom Bình Dương",
    address: "Đại lộ Bình Dương, Phú Hòa, Thủ Dầu Một, Bình Dương",
    phone: "1900 232389",
    city: "binhduong",
    district: "thudaumot",
  },
];

const DISTRICTS_MAP: { [key: string]: { value: string; label: string }[] } = {
  hanoi: [
    { value: "namtuliem", label: "Quận Nam Từ Liêm" },
  ],
  hcm: [
    { value: "binhthanh", label: "Quận Bình Thạnh" },
    { value: "thaodien", label: "Quận 2 / Thủ Đức (Thảo Điền)" },
  ],
  binhduong: [
    { value: "thudaumot", label: "Thủ Dầu Một" },
  ],
};

export default function DepositWizardModal({
  isOpen,
  onClose,
  product,
  selectedColor,
}: DepositWizardModalProps) {
  const [step, setStep] = useState(1);
  const [batteryOption, setBatteryOption] = useState<"ThuePin" | "MuaPin">("ThuePin");
  const [selectedCity, setSelectedCity] = useState("hanoi");
  const [selectedDistrict, setSelectedDistrict] = useState("namtuliem");
  const [selectedShowroom, setSelectedShowroom] = useState<Showroom>(MOCK_SHOWROOMS[0]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // State synchronization is handled in select onChange event handlers

  if (!isOpen) return null;

  const depositAmount = batteryOption === "ThuePin" ? 2000000 : 5000000;

  const handleNextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  // Convert Next.js hardcoded client product IDs to backend Guids
  const getBackendProductId = (frontendId: string) => {
    switch (frontendId) {
      case "vinfast-klara-s-2026":
        return "e0000000-0000-0000-0000-000000000001";
      case "vinfast-evo200":
        return "e0000000-0000-0000-0000-000000000001"; // maps to Evo Max in backend
      case "vinfast-impes":
        return "e0000000-0000-0000-0000-000000000002";
      case "vinfast-klara-s-premium":
        return "e0000000-0000-0000-0000-000000000003";
      default:
        return "e0000000-0000-0000-0000-000000000003"; // fallback to VF 8
    }
  };

  const handlePaymentSubmit = async () => {
    setLoading(true);
    setErrorMessage("");

    const orderPayload = {
      customerId: "c1111111-1111-1111-1111-111111111111", // mock customer ID
      customerName: "Nguyễn Văn A",
      customerEmail: "nguyenvana@gmail.com",
      customerPhone: "0987654321",
      customerIdCard: "012345678912",
      productId: getBackendProductId(product.id),
      storeId: selectedShowroom.id,
      depositAmount: depositAmount,
      depositType: 1, // LinhHoat enum value
      batteryOption: batteryOption === "ThuePin" ? 1 : 2, // ThuePin = 1, MuaPin = 2
    };

    try {
      // 1. POST /api/orders/deposit using MediatR Command
      const response = await fetch(`${API_CONFIG.ORDER_URL}/api/orders/deposit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Không thể khởi tạo đơn đặt cọc.");
      }

      const createdOrder = await response.json();
      const orderId = createdOrder.id;

      // 2. POST /api/orders/{id}/payment to fetch VNPAY payment URL
      const payResponse = await fetch(`${API_CONFIG.ORDER_URL}/api/orders/${orderId}/payment`, {
        method: "POST",
      });

      if (!payResponse.ok) {
        const errorData = await payResponse.json();
        throw new Error(errorData.message || "Không thể tạo liên kết thanh toán.");
      }

      const payData = await payResponse.json();

      // Redirect client to VNPAY Payment Gate
      window.location.href = payData.paymentUrl;
    } catch (err) {
      setLoading(false);
      const message = err instanceof Error ? err.message : "Lỗi kết nối tới hệ thống. Vui lòng thử lại.";
      setErrorMessage(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-neutral-100 overflow-hidden flex flex-col my-8">
        
        {/* Header Section */}
        <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <div>
            <h2 className="text-xl font-black text-neutral-900 tracking-tight">Đặt cọc trực tuyến</h2>
            <p className="text-xs text-neutral-500 font-semibold uppercase mt-0.5 tracking-wider">
              {product.name} ({selectedColor})
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors duration-200"
          >
            ✕
          </button>
        </div>

        {/* Wizard Progress Stepper */}
        <div className="px-8 py-6 bg-white border-b border-neutral-50 flex justify-between items-center relative">
          <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1 bg-neutral-100 -z-10" />
          
          {/* Step 1 Indicator */}
          <div className="flex flex-col items-center gap-1.5 bg-white z-10 px-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
              step >= 1 ? "bg-[#E30613] text-white" : "bg-neutral-200 text-neutral-600"
            }`}>
              1
            </div>
            <span className={`text-[10px] uppercase font-bold tracking-wider ${
              step >= 1 ? "text-[#E30613]" : "text-neutral-400"
            }`}>
              Gói Pin
            </span>
          </div>

          {/* Step 2 Indicator */}
          <div className="flex flex-col items-center gap-1.5 bg-white z-10 px-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
              step >= 2 ? "bg-[#E30613] text-white" : "bg-neutral-200 text-neutral-600"
            }`}>
              2
            </div>
            <span className={`text-[10px] uppercase font-bold tracking-wider ${
              step >= 2 ? "text-[#E30613]" : "text-neutral-400"
            }`}>
              Showroom
            </span>
          </div>

          {/* Step 3 Indicator */}
          <div className="flex flex-col items-center gap-1.5 bg-white z-10 px-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
              step >= 3 ? "bg-[#E30613] text-white" : "bg-neutral-200 text-neutral-600"
            }`}>
              3
            </div>
            <span className={`text-[10px] uppercase font-bold tracking-wider ${
              step >= 3 ? "text-[#E30613]" : "text-neutral-400"
            }`}>
              Tóm tắt
            </span>
          </div>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Content Wizard Body */}
        <div className="p-8 flex-1 min-h-[300px]">
          
          {/* STEP 1: SELECT BATTERY OPTION */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="text-center">
                <h3 className="text-base font-bold text-neutral-800">Chọn gói Pin của bạn</h3>
                <p className="text-xs text-neutral-500 mt-1">VinFast hỗ trợ linh hoạt 2 gói pin bảo vệ quyền lợi tối đa</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                
                {/* Lease Pin Button */}
                <button
                  type="button"
                  onClick={() => setBatteryOption("ThuePin")}
                  className={`p-6 rounded-2xl border-2 text-left transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                    batteryOption === "ThuePin"
                      ? "border-[#E30613] bg-rose-50/20 shadow-md ring-1 ring-[#E30613]/30"
                      : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-rose-50 flex items-center justify-center">
                          <svg className="h-6 w-6 text-[#E30613] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25v7.5A2.25 2.25 0 0 1 18.75 18H5.25A2.25 2.25 0 0 1 3 15.75v-7.5A2.25 2.25 0 0 1 5.25 6h13.5A2.25 2.25 0 0 1 21 8.25zM22.5 10.5v3" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9.75v4.5m3.75-4.5v4.5m3.75-4.5v4.5" />
                          </svg>
                        </div>
                        <span className="text-sm font-bold text-neutral-900 uppercase">Thuê pin</span>
                      </div>
                      <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                        batteryOption === "ThuePin" ? "border-[#E30613] bg-[#E30613]" : "border-neutral-300"
                      }`}>
                        {batteryOption === "ThuePin" && <div className="h-2 w-2 rounded-full bg-white" />}
                      </div>
                    </div>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      Tiết kiệm chi phí đầu tư ban đầu, VinFast chịu mọi rủi ro về chất lượng chai pin.
                    </p>
                  </div>
                  <div className="mt-8 border-t border-neutral-100 pt-4 flex items-baseline justify-between">
                    <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Giá cọc</span>
                    <span className="text-lg font-black text-[#E30613]">2.000.000đ</span>
                  </div>
                </button>

                {/* Buy Pin Button */}
                <button
                  type="button"
                  onClick={() => setBatteryOption("MuaPin")}
                  className={`p-6 rounded-2xl border-2 text-left transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                    batteryOption === "MuaPin"
                      ? "border-[#E30613] bg-rose-50/20 shadow-md ring-1 ring-[#E30613]/30"
                      : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-rose-50 flex items-center justify-center">
                          <svg className="h-6 w-6 text-[#E30613] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25v7.5A2.25 2.25 0 0 1 18.75 18H5.25A2.25 2.25 0 0 1 3 15.75v-7.5A2.25 2.25 0 0 1 5.25 6h13.5A2.25 2.25 0 0 1 21 8.25zM22.5 10.5v3" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9.75h12v4.5H6z" />
                          </svg>
                        </div>
                        <span className="text-sm font-bold text-neutral-900 uppercase">Mua đứt pin</span>
                      </div>
                      <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                        batteryOption === "MuaPin" ? "border-[#E30613] bg-[#E30613]" : "border-neutral-300"
                      }`}>
                        {batteryOption === "MuaPin" && <div className="h-2 w-2 rounded-full bg-white" />}
                      </div>
                    </div>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      Sở hữu trọn đời viên pin công nghệ LFP mới, không chịu phí quản lý thuê pin hàng tháng.
                    </p>
                  </div>
                  <div className="mt-8 border-t border-neutral-100 pt-4 flex items-baseline justify-between">
                    <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Giá cọc</span>
                    <span className="text-lg font-black text-[#E30613]">5.000.000đ</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CHOOSE SHOWROOM */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="text-center">
                <h3 className="text-base font-bold text-neutral-800">Chọn Showroom nhận xe</h3>
                <p className="text-xs text-neutral-500 mt-1">Định vị đại lý VinFast gần bạn nhất để nhận xe nhanh chóng</p>
              </div>

              {/* Filtering dropdowns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-400 mb-1.5">Tỉnh / Thành phố</label>
                  <select
                    value={selectedCity}
                    onChange={(e) => {
                      const city = e.target.value;
                      setSelectedCity(city);
                      const districts = DISTRICTS_MAP[city];
                      if (districts && districts.length > 0) {
                        const firstDistrict = districts[0].value;
                        setSelectedDistrict(firstDistrict);
                        const showrooms = MOCK_SHOWROOMS.filter(
                          (s) => s.city === city && s.district === firstDistrict
                        );
                        if (showrooms.length > 0) {
                          setSelectedShowroom(showrooms[0]);
                        }
                      }
                    }}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:border-[#E30613] outline-none transition-colors duration-200 cursor-pointer shadow-sm font-semibold text-neutral-700"
                  >
                    <option value="hanoi">Hà Nội</option>
                    <option value="hcm">TP. Hồ Chí Minh</option>
                    <option value="binhduong">Bình Dương</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-400 mb-1.5">Quận / Huyện</label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => {
                      const district = e.target.value;
                      setSelectedDistrict(district);
                      const showrooms = MOCK_SHOWROOMS.filter(
                        (s) => s.city === selectedCity && s.district === district
                      );
                      if (showrooms.length > 0) {
                        setSelectedShowroom(showrooms[0]);
                      }
                    }}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:border-[#E30613] outline-none transition-colors duration-200 cursor-pointer shadow-sm font-semibold text-neutral-700"
                  >
                    {(DISTRICTS_MAP[selectedCity] || []).map((dist) => (
                      <option key={dist.value} value={dist.value}>
                        {dist.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Showroom Cards List */}
              <div className="space-y-3 pt-2 max-h-[220px] overflow-y-auto pr-2">
                {MOCK_SHOWROOMS.filter(
                  (s) => s.city === selectedCity && s.district === selectedDistrict
                ).map((showroom) => {
                  const isSelected = selectedShowroom.id === showroom.id;
                  return (
                    <button
                      key={showroom.id}
                      type="button"
                      onClick={() => setSelectedShowroom(showroom)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? "border-[#E30613] bg-rose-50/10 shadow-sm"
                          : "border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50/50"
                      }`}
                    >
                      <div className="flex gap-3 items-start">
                        <div className={`p-2 rounded-lg mt-0.5 ${isSelected ? "bg-rose-100/50 text-[#E30613]" : "bg-neutral-100 text-neutral-500"}`}>
                          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                          </svg>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-neutral-900">{showroom.name}</h4>
                          <p className="text-[11px] text-neutral-500 font-medium leading-relaxed">{showroom.address}</p>
                          <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-bold pt-0.5">
                            <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.802-5.14-4.117-6.94-6.94l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                            </svg>
                            <span>Hotline: {showroom.phone}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className={`h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected ? "border-[#E30613] bg-[#E30613]" : "border-neutral-300"
                      }`}>
                        {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}

                {MOCK_SHOWROOMS.filter(
                  (s) => s.city === selectedCity && s.district === selectedDistrict
                ).length === 0 && (
                  <div className="text-center py-6 text-xs text-neutral-400 font-medium">
                    Không tìm thấy đại lý/showroom tại khu vực đã chọn.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: ORDER SUMMARY */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="text-center">
                <h3 className="text-base font-bold text-neutral-800">Tóm tắt đơn đặt cọc</h3>
                <p className="text-xs text-neutral-500 mt-1">Xác thực chính xác các thông tin trước khi chuyển cổng thanh toán</p>
              </div>

              {/* Summary details card (Styled like a premium ticket slip) */}
              <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-6 space-y-4 shadow-inner relative overflow-hidden">
                {/* Decorative punched holes to look like ticket */}
                <div className="absolute top-1/2 -left-3 h-6 w-6 rounded-full bg-white border border-neutral-100 -translate-y-1/2" />
                <div className="absolute top-1/2 -right-3 h-6 w-6 rounded-full bg-white border border-neutral-100 -translate-y-1/2" />
                
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400 font-bold uppercase tracking-wider">Tên xe điện</span>
                  <span className="text-neutral-800 font-extrabold">{product.name}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400 font-bold uppercase tracking-wider">Màu sắc lựa chọn</span>
                  <span className="text-neutral-800 font-extrabold">{selectedColor}</span>
                </div>

                <div className="border-t border-dashed border-neutral-200 pt-4 flex justify-between items-start text-xs">
                  <span className="text-neutral-400 font-bold uppercase tracking-wider shrink-0 mt-0.5">Showroom nhận</span>
                  <div className="text-right space-y-1">
                    <p className="text-neutral-800 font-extrabold">{selectedShowroom.name}</p>
                    <p className="text-[10px] text-neutral-500 font-semibold leading-relaxed">{selectedShowroom.address}</p>
                  </div>
                </div>

                <div className="border-t border-dashed border-neutral-200 pt-4 flex justify-between items-center text-xs">
                  <span className="text-neutral-400 font-bold uppercase tracking-wider">Tùy chọn năng lượng</span>
                  <span className="text-neutral-800 font-extrabold">
                    {batteryOption === "ThuePin" ? "Thuê pin" : "Mua đứt pin"}
                  </span>
                </div>

                <div className="border-t border-neutral-200 pt-4 flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">Tổng tiền đặt cọc</span>
                  <span className="text-2xl font-black text-[#E30613] tracking-tight">
                    {depositAmount.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-[10px] text-neutral-400 leading-relaxed text-center font-semibold px-4">
                * Bằng việc chọn &quot;TIẾN HÀNH THANH TOÁN TIỀN CỌC&quot;, Quý khách đồng ý với điều khoản chính sách đặt mua, bàn giao xe điện thông minh của VinFast Việt Nam.
              </p>
            </div>
          )}

        </div>

        {/* Footer Navigation Panel */}
        <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/50 flex justify-between items-center gap-4">
          {step > 1 ? (
            <button
              onClick={handlePrevStep}
              disabled={loading}
              className="px-6 py-3 border border-neutral-300 rounded-xl text-xs font-bold text-neutral-700 bg-white hover:bg-neutral-100 transition duration-200 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              Quay lại
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={handleNextStep}
              className="px-6 py-3 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition duration-200 shadow-sm cursor-pointer"
            >
              Tiếp tục
            </button>
          ) : (
            <button
              onClick={handlePaymentSubmit}
              disabled={loading}
              className="flex-1 max-w-sm px-6 py-3.5 bg-[#E30613] text-white rounded-xl text-xs font-black hover:bg-[#b8040d] transition duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 tracking-wider uppercase disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  Đang chuyển hướng...
                </>
              ) : (
                "TIẾN HÀNH THANH TOÁN TIỀN CỌC"
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
