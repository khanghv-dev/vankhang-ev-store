"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { API_CONFIG } from "@/config/apiConfig";

interface VehicleCampaign {
  id: string;
  name: string;
  sub: string;
  image: string;
  marketPrice: number;
  perks: string[];
  specs: { label: string; value: string }[];
}

const CAMPAIGN_VEHICLES: VehicleCampaign[] = [
  {
    id: "evo200",
    name: "VinFast Evo200",
    sub: "Dòng xe quốc dân thế hệ mới - Quãng đường 205km/sạc",
    image: "/products/impes.png",
    marketPrice: 18000000,
    perks: [
      "Tặng phụ kiện chính hãng trị giá 1.000.000đ",
      "Ưu tiên nhận xe đợt đầu tháng 7/2026",
      "Miễn phí thuê pin trong 3 tháng đầu"
    ],
    specs: [
      { label: "Vận tốc tối đa", value: "70 km/h" },
      { label: "Quãng đường", value: "205 km / sạc" },
      { label: "Loại pin", value: "LFP thế hệ mới" }
    ]
  },
  {
    id: "felizs",
    name: "VinFast Feliz S",
    sub: "Thanh lịch và mạnh mẽ - Thiết kế sang trọng tối ưu",
    image: "/products/klara_ref.png",
    marketPrice: 27000000,
    perks: [
      "Tặng voucher sạc pin trị giá 2.000.000đ",
      "Miễn phí vận chuyển & giao xe tận nhà",
      "Giảm 20% phí thuê pin trọn đời xe"
    ],
    specs: [
      { label: "Vận tốc tối đa", value: "78 km/h" },
      { label: "Quãng đường", value: "198 km / sạc" },
      { label: "Thể tích cốp", value: "25 Lít rộng rãi" }
    ]
  },
  {
    id: "klaras",
    name: "VinFast Klara S",
    sub: "Biểu tượng xe máy điện châu Á - Đẳng cấp bền bỉ",
    image: "/products/klara-s.png",
    marketPrice: 35000000,
    perks: [
      "Tặng mũ bảo hiểm cao cấp & áo mưa VinFast",
      "Miễn phí cứu hộ 24/7 toàn quốc trong 1 năm",
      "Bảo hành pin LFP lên đến 5 năm chính hãng"
    ],
    specs: [
      { label: "Vận tốc tối đa", value: "78 km/h" },
      { label: "Quãng đường", value: "194 km / sạc" },
      { label: "Động cơ", value: "In-wheel 3000W" }
    ]
  }
];

export default function DepositCampaign() {
  // Target deadline: June 30, 2026
  const TARGET_DATE = useMemo(() => new Date("2026-06-30T23:59:59").getTime(), []);
  const [timeLeft, setTimeLeft] = useState(0);

  // Active Booking counter (FOMO Simulation)
  const [reservedCount, setReservedCount] = useState(852);

  // Tier selection state per vehicle: key is vehicle id, value is "flexible" or "committed"
  const [selectedTiers, setSelectedTiers] = useState<Record<string, "flexible" | "committed">>({
    evo200: "flexible",
    felizs: "flexible",
    klaras: "committed"
  });

  // Checkout modal states
  const [activeCheckout, setActiveCheckout] = useState<{
    vehicle: VehicleCampaign;
    tier: "flexible" | "committed";
  } | null>(null);

  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentTimeLeft, setPaymentTimeLeft] = useState(900); // 15 minutes in seconds

  // Form states for actual backend deposit
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerIdCard, setCustomerIdCard] = useState("");
  const [selectedShowroom, setSelectedShowroom] = useState("");
  const [showrooms, setShowrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Load showrooms dynamically
  useEffect(() => {
    const fetchShowrooms = async () => {
      try {
        const res = await fetch(`${API_CONFIG.ORDER_URL}/api/admin/showrooms?page=1&pageSize=100`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.items)) {
            setShowrooms(data.items);
            if (data.items.length > 0) {
              setSelectedShowroom(data.items[0].id);
            }
          }
        }
      } catch (err) {
        console.error("Lỗi khi tải danh sách showroom:", err);
      }
    };
    fetchShowrooms();
  }, []);

  // Pre-select vehicle if "bike" query param is present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const bikeParam = new URLSearchParams(window.location.search).get("bike");
      if (bikeParam) {
        const vehicle = CAMPAIGN_VEHICLES.find(
          v => v.id.toLowerCase() === bikeParam.toLowerCase() || 
               // fallback partial matches (e.g. felizs matching feliz-s or feliz or vf8 matching felizs as default)
               bikeParam.toLowerCase().includes(v.id.toLowerCase())
        );
        if (vehicle) {
          const chosenTier = selectedTiers[vehicle.id] || "flexible";
          setActiveCheckout({ vehicle, tier: chosenTier });
          setPaymentSuccess(false);
        }
      }
    }
  }, [selectedTiers]);

  const getBackendProductId = (frontendId: string) => {
    switch (frontendId) {
      case "evo200":
        return "e0000000-0000-0000-0000-000000000001";
      case "felizs":
        return "e0000000-0000-0000-0000-000000000002";
      case "klaras":
        return "e0000000-0000-0000-0000-000000000003";
      default:
        return "e0000000-0000-0000-0000-000000000003";
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCheckout) return;
    if (!customerName.trim() || !customerPhone.trim() || !customerEmail.trim() || !customerIdCard.trim() || !selectedShowroom) {
      setErrorMessage("Vui lòng điền đầy đủ thông tin và chọn showroom.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    const orderPayload = {
      customerId: "c1111111-1111-1111-1111-111111111111", // mock customer ID
      customerName: customerName,
      customerEmail: customerEmail,
      customerPhone: customerPhone,
      customerIdCard: customerIdCard,
      productId: getBackendProductId(activeCheckout.vehicle.id),
      storeId: selectedShowroom,
      depositAmount: checkoutPrice,
      depositType: activeCheckout.tier === "flexible" ? 1 : 2, // 1: LinhHoat, 2: CamKet
      batteryOption: 1 // default to 1: ThuePin
    };

    try {
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

      const payResponse = await fetch(`${API_CONFIG.ORDER_URL}/api/orders/${orderId}/payment`, {
        method: "POST",
      });

      if (!payResponse.ok) {
        const errorData = await payResponse.json();
        throw new Error(errorData.message || "Không thể tạo liên kết thanh toán.");
      }

      const payData = await payResponse.json();
      window.location.href = payData.paymentUrl;
    } catch (err) {
      setLoading(false);
      const message = err instanceof Error ? err.message : "Lỗi kết nối tới hệ thống. Vui lòng thử lại.";
      setErrorMessage(message);
    }
  };

  // Real-time Campaign Countdown hook
  useEffect(() => {
    const getDiff = () => Math.max(0, TARGET_DATE - Date.now());
    setTimeLeft(getDiff());

    const campaignTimer = setInterval(() => {
      const diff = getDiff();
      setTimeLeft(diff);
      if (diff <= 0) {
        clearInterval(campaignTimer);
      }
    }, 1000);

    return () => clearInterval(campaignTimer);
  }, [TARGET_DATE]);

  // Live Purchase Ticket counter FOMO hook (Simulate a new booking registration every 20 seconds)
  useEffect(() => {
    const liveBookingInterval = setInterval(() => {
      setReservedCount(prev => {
        if (prev < 996) {
          // Increment by 1 or 2
          return prev + Math.floor(Math.random() * 2) + 1;
        }
        return prev;
      });
    }, 20000);

    return () => clearInterval(liveBookingInterval);
  }, []);

  // Payment checkout timer hook
  useEffect(() => {
    if (!activeCheckout || paymentSuccess) return;

    setPaymentTimeLeft(900);
    const payTimer = setInterval(() => {
      setPaymentTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(payTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(payTimer);
  }, [activeCheckout, paymentSuccess]);

  // Countdown timer parts calculations
  const countdownParts = useMemo(() => {
    const totalSecs = Math.floor(timeLeft / 1000);
    const secs = totalSecs % 60;
    const totalMins = Math.floor(totalSecs / 60);
    const mins = totalMins % 60;
    const totalHours = Math.floor(totalMins / 60);
    const hours = totalHours % 24;
    const days = Math.floor(totalHours / 24);

    return {
      days: days.toString().padStart(2, "0"),
      hours: hours.toString().padStart(2, "0"),
      minutes: mins.toString().padStart(2, "0"),
      seconds: secs.toString().padStart(2, "0")
    };
  }, [timeLeft]);

  // Checkout dynamic variables
  const checkoutPrice = useMemo(() => {
    if (!activeCheckout) return 0;
    return activeCheckout.tier === "flexible" ? 2000000 : 5000000;
  }, [activeCheckout]);

  const checkoutFormattedTime = useMemo(() => {
    const mins = Math.floor(paymentTimeLeft / 60);
    const secs = paymentTimeLeft % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }, [paymentTimeLeft]);

  const handleTierChange = (vehicleId: string, tier: "flexible" | "committed") => {
    setSelectedTiers(prev => ({
      ...prev,
      [vehicleId]: tier
    }));
  };

  const triggerPreOrder = (vehicle: VehicleCampaign) => {
    const chosenTier = selectedTiers[vehicle.id] || "flexible";
    setActiveCheckout({ vehicle, tier: chosenTier });
    setPaymentSuccess(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 font-sans">
      
      {/* ── SECTION 1: HERO COUNTDOWN (FOMO HEADER) ── */}
      <section className="relative overflow-hidden bg-slate-950 text-white py-16 px-4 border-b border-slate-900 shadow-lg">
        {/* Abstract background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />
        
        {/* Glow indicator decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <span className="inline-block bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md animate-pulse">
            Sự kiện Pre-order Độc Quyền
          </span>
          
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight uppercase leading-none text-slate-100">
            Mở Đặt Cọc Xe Máy Điện VinFast <br className="hidden sm:inline" />
            <span className="text-[#E30613] drop-shadow-sm">Đợt Mới 2026</span>
          </h1>

          <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-xl mx-auto uppercase tracking-wider">
            Nhận siêu đặc quyền giữ xe đợt đầu - Khóa giá ưu đãi pin LFP trọn đời. cổng cọc sẽ đóng khi đồng hồ chạm mốc 0.
          </p>

          {/* Time digits boxes */}
          <div className="flex justify-center items-center gap-2 sm:gap-4 pt-4">
            <div className="flex flex-col items-center">
              <div className="bg-slate-900 border border-slate-850 rounded-xl px-4 py-3 min-w-[64px] sm:min-w-[80px] text-2xl sm:text-4xl font-black text-center text-[#E30613] shadow-md">
                {countdownParts.days}
              </div>
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider mt-1.5">Ngày</span>
            </div>
            
            <div className="text-xl sm:text-2xl font-black text-slate-600 -mt-5">:</div>

            <div className="flex flex-col items-center">
              <div className="bg-slate-900 border border-slate-850 rounded-xl px-4 py-3 min-w-[64px] sm:min-w-[80px] text-2xl sm:text-4xl font-black text-center text-slate-100 shadow-md">
                {countdownParts.hours}
              </div>
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider mt-1.5">Giờ</span>
            </div>

            <div className="text-xl sm:text-2xl font-black text-slate-600 -mt-5">:</div>

            <div className="flex flex-col items-center">
              <div className="bg-slate-900 border border-slate-850 rounded-xl px-4 py-3 min-w-[64px] sm:min-w-[80px] text-2xl sm:text-4xl font-black text-center text-slate-100 shadow-md">
                {countdownParts.minutes}
              </div>
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider mt-1.5">Phút</span>
            </div>

            <div className="text-xl sm:text-2xl font-black text-slate-600 -mt-5">:</div>

            <div className="flex flex-col items-center">
              <div className="bg-slate-900 border border-slate-850 rounded-xl px-4 py-3 min-w-[64px] sm:min-w-[80px] text-2xl sm:text-4xl font-black text-center text-slate-100 shadow-md animate-pulse">
                {countdownParts.seconds}
              </div>
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider mt-1.5">Giây</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: RESERVATION PROGRESS BAR (FOMO ACTION) ── */}
      <section className="max-w-4xl mx-auto -mt-6 px-4 relative z-20">
        <div className="bg-white rounded-3xl border border-slate-150 p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-100">
                <span className="h-2 w-2 rounded-full bg-[#E30613] animate-ping" />
              </span>
              <p className="text-xs font-black text-slate-900 uppercase tracking-tight">
                Chiến dịch giữ chỗ VinFast LFP toàn quốc
              </p>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              Chỉ còn <span className="text-[#E30613] font-black">{1000 - reservedCount}</span> / 1000 suất nhận ưu đãi
            </div>
          </div>

          {/* Progress bar container */}
          <div className="relative">
            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-red-500 to-[#E30613] rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${(reservedCount / 1000) * 100}%` }}
              />
            </div>
            {/* Pulsing visual tag pinned on the progress */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 -ml-3 transition-all duration-1000 ease-out"
              style={{ left: `${(reservedCount / 1000) * 100}%` }}
            >
              <div className="h-5 w-5 bg-white border-2 border-[#E30613] rounded-full shadow-md flex items-center justify-center animate-bounce">
                <span className="text-[8px] font-black text-[#E30613]">V</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span>🚀 Tiến trình: {reservedCount}/1000 đơn thành công</span>
            <span className="text-[#E30613] font-black animate-pulse">🔥 {Math.round((reservedCount/1000)*100)}% ĐÃ ĐẦY</span>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: VEHICLE CAMPAIGN LIST GRID ── */}
      <section className="max-w-6xl mx-auto px-4 mt-12">
        <div className="text-center mb-8 space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-tight">
            Chọn dòng xe của bạn để giữ chỗ
          </h2>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Mỗi xe đi kèm các gói cọc linh hoạt khác nhau phục vụ nhu cầu mua sắm riêng biệt
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {CAMPAIGN_VEHICLES.map((vehicle) => {
            const currentTier = selectedTiers[vehicle.id] || "flexible";
            
            return (
              <article 
                key={vehicle.id}
                className="bg-white rounded-3xl border border-slate-150 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
              >
                {/* Vehicle Image section */}
                <div className="relative h-56 bg-slate-50 flex items-center justify-center p-6 border-b border-slate-100 overflow-hidden shrink-0">
                  <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
                  
                  {/* Image zoom effect on hover */}
                  <div className="relative w-full h-full transform transition-transform duration-300 group-hover:scale-105">
                    <Image
                      src={vehicle.image}
                      alt={vehicle.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>

                  {/* Market price tag */}
                  <span className="absolute top-4 left-4 bg-slate-900/90 text-white text-[9px] font-bold px-2.5 py-1 rounded-md tracking-wide">
                    Giá xe: {vehicle.marketPrice.toLocaleString("vi-VN")}đ
                  </span>

                  {/* Booking count status */}
                  <span className="absolute bottom-4 right-4 bg-red-50 border border-red-100 text-[#E30613] text-[9px] font-black px-2.5 py-1 rounded-md tracking-wider uppercase">
                    ⚡ Rất hot
                  </span>
                </div>

                {/* Card Main Info */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-950 tracking-tight">{vehicle.name}</h3>
                      <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{vehicle.sub}</p>
                    </div>

                    {/* Specs badges */}
                    <div className="grid grid-cols-3 gap-1.5 py-2.5 border-t border-b border-slate-100">
                      {vehicle.specs.map((spec, i) => (
                        <div key={i} className="text-center bg-slate-50 rounded-lg p-1.5">
                          <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wide leading-none">{spec.label}</span>
                          <span className="block text-[9px] text-slate-800 font-black mt-1 leading-none">{spec.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Perk Box */}
                    <div className="bg-slate-50/70 rounded-2xl border border-slate-100 p-4 space-y-2.5">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                        🎁 Đặc Quyền Nhận Xe Đợt Này:
                      </h4>
                      <ul className="space-y-1.5">
                        {vehicle.perks.map((perk, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-[10px] text-slate-600 font-bold leading-normal">
                            <span className="text-emerald-500 shrink-0">✓</span>
                            <span>{perk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Pricing Tiers Frame selection */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none text-center">
                      Chọn gói đặt cọc xe:
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {/* Tier A: Flexible Deposit */}
                      <button
                        onClick={() => handleTierChange(vehicle.id, "flexible")}
                        className={`text-left rounded-xl border-2 p-3 transition-all cursor-pointer relative ${
                          currentTier === "flexible"
                            ? "border-[#E30613] bg-red-50/10 shadow-sm"
                            : "border-slate-150 hover:border-slate-300"
                        }`}
                      >
                        <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Gói Linh Hoạt</span>
                        <span className="block text-xs font-black text-slate-900 mt-1">2.000.000đ</span>
                        <span className="block text-[7.5px] text-slate-400 font-medium leading-tight mt-1">
                          Hoàn trả cọc hoặc chuyển nhượng được.
                        </span>
                        {currentTier === "flexible" && (
                          <span className="absolute top-2 right-2 text-[8px] font-black text-[#E30613] bg-red-50 border border-red-100 rounded px-1 uppercase scale-90 leading-none">OK</span>
                        )}
                      </button>

                      {/* Tier B: Committed Deposit */}
                      <button
                        onClick={() => handleTierChange(vehicle.id, "committed")}
                        className={`text-left rounded-xl border-2 p-3 transition-all cursor-pointer relative ${
                          currentTier === "committed"
                            ? "border-[#E30613] bg-red-50/10 shadow-sm"
                            : "border-slate-150 hover:border-slate-300"
                        }`}
                      >
                        <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Gói Cam Kết</span>
                        <span className="block text-xs font-black text-[#E30613] mt-1">5.000.000đ</span>
                        <span className="block text-[7.5px] text-slate-400 font-medium leading-tight mt-1">
                          Không hoàn hủy, giao xe ưu tiên tuyệt đối.
                        </span>
                        {currentTier === "committed" && (
                          <span className="absolute top-2 right-2 text-[8px] font-black text-[#E30613] bg-red-50 border border-red-100 rounded px-1 uppercase scale-90 leading-none">OK</span>
                        )}
                      </button>
                    </div>

                    {/* Pre-order action Button */}
                    <button
                      onClick={() => triggerPreOrder(vehicle)}
                      className="w-full rounded-2xl bg-[#E30613] hover:bg-red-700 text-xs font-black uppercase tracking-wider text-white py-3.5 transition-all shadow-md active:scale-95 cursor-pointer block text-center"
                    >
                      BẤM ĐẶT CỌC NGAY ({currentTier === "flexible" ? "2.000.000đ" : "5.000.000đ"})
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── CHECKOUT PAYMENT MODAL OVERLAY ── */}
      {activeCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-150 p-6 shadow-2xl w-full max-w-md my-8 animate-in fade-in zoom-in-95 duration-200 relative text-left">
            
            {/* Close modal */}
            <button
              onClick={() => setActiveCheckout(null)}
              className="absolute top-4 right-4 h-8 w-8 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              ✕
            </button>

            {!paymentSuccess ? (
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div className="text-center">
                  <span className="inline-block bg-red-50 border border-red-100 rounded-full px-3 py-1 text-[9px] font-bold text-[#E30613] uppercase tracking-wider leading-none">
                    Đặt cọc trực tuyến (VNPAY)
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-2 uppercase tracking-tight">Thanh toán đặt giữ chỗ</h3>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wide font-medium">Nhập thông tin đăng ký để tạo đơn cọc xe</p>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-[10px] text-rose-700 font-bold rounded-xl">
                    ⚠️ {errorMessage}
                  </div>
                )}

                {/* Selected Package review */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 text-xs font-semibold text-slate-600">
                  <div className="flex justify-between">
                    <span>Mẫu xe:</span>
                    <span className="font-black text-slate-900">{activeCheckout.vehicle.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gói đặt cọc:</span>
                    <span className={`font-black uppercase text-[10px] ${
                      activeCheckout.tier === "flexible" ? "text-slate-800" : "text-[#E30613]"
                    }`}>
                      {activeCheckout.tier === "flexible" ? "Cọc linh hoạt (Hoàn hủy)" : "Cọc cam kết (Không hoàn)"}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200/60 pt-2 text-sm">
                    <span className="text-slate-900">Số tiền cọc:</span>
                    <span className="font-black text-[#E30613]">{checkoutPrice.toLocaleString("vi-VN")}đ</span>
                  </div>
                </div>

                {/* Customer Fields Inputs */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] uppercase font-bold tracking-wider text-slate-400 mb-1">Họ và tên khách hàng</label>
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-[#E30613] focus:bg-white outline-none font-semibold text-slate-800"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] uppercase font-bold tracking-wider text-slate-400 mb-1">Số điện thoại</label>
                      <input
                        type="tel"
                        required
                        placeholder="0987654321"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-[#E30613] focus:bg-white outline-none font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-bold tracking-wider text-slate-400 mb-1">Số CMND/CCCD</label>
                      <input
                        type="text"
                        required
                        placeholder="012345678912"
                        value={customerIdCard}
                        onChange={(e) => setCustomerIdCard(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-[#E30613] focus:bg-white outline-none font-semibold text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase font-bold tracking-wider text-slate-400 mb-1">Địa chỉ Email</label>
                    <input
                      type="email"
                      required
                      placeholder="example@gmail.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-[#E30613] focus:bg-white outline-none font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase font-bold tracking-wider text-slate-400 mb-1">Showroom nhận xe chỉ định</label>
                    <select
                      value={selectedShowroom}
                      onChange={(e) => setSelectedShowroom(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-[#E30613] focus:bg-white outline-none font-semibold text-slate-700 cursor-pointer"
                    >
                      {showrooms.length > 0 ? (
                        showrooms.map((sr, idx) => (
                          <option key={sr.id || `sr-opt-${idx}`} value={sr.id || `sr-opt-${idx}`}>
                            {sr.name || "VinFast Showroom"} {sr.address ? `- ${sr.address}` : ""}
                          </option>
                        ))
                      ) : (
                        <option value="7ade971e-16e8-4e4e-bc75-54c7e4843062">VinFast Showroom Mỹ Đình (Mặc định)</option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-2xl bg-[#E30613] hover:bg-red-700 text-xs font-black uppercase text-white py-3.5 transition-colors shadow-md active:scale-95 cursor-pointer text-center flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="h-4.5 w-4.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                        Đang tạo đơn hàng...
                      </>
                    ) : (
                      "Tiến hành đặt cọc qua VNPAY"
                    )}
                  </button>
                </div>
              </form>
            ) : (
              // Success confirmation step
              <div className="text-center py-6 space-y-6 animate-in fade-in duration-300">
                <div className="h-16 w-16 bg-emerald-50 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-md">
                  <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-black text-slate-950 uppercase tracking-tight">ĐÃ GHI NHẬN ĐẶT CỌC THÀNH CÔNG</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Cảm ơn bạn đã lựa chọn xe máy điện VinFast! <br />
                    Mã cọc của bạn là <span className="font-bold text-[#E30613]">#{activeCheckout.vehicle.id.toUpperCase()}-5829</span>. Thông tin chi tiết vé nhận xe đã được gửi và cập nhật vào mục **Đơn cọc của tôi** ở thanh tiêu đề.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-semibold text-left space-y-1.5">
                  <p className="flex justify-between"><span>Mẫu xe:</span> <span className="font-black text-slate-900">{activeCheckout.vehicle.name}</span></p>
                  <p className="flex justify-between"><span>Mã giao dịch:</span> <span className="font-mono font-bold text-slate-700">TXN-VF-98218-E</span></p>
                  <p className="flex justify-between"><span>Thời điểm cọc:</span> <span className="text-slate-600">Vừa xong (18/06/2026)</span></p>
                </div>

                <button
                  onClick={() => setActiveCheckout(null)}
                  className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-xs font-black uppercase text-white py-3.5 transition-colors cursor-pointer text-center shadow-md active:scale-95"
                >
                  Hoàn tất và Đóng
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
