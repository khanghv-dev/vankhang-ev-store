"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { API_CONFIG } from "@/config/apiConfig";
import * as signalR from "@microsoft/signalr";

interface TrackingRecord {
  orderId: string;
  phone: string;
  vehicleName: string;
  color: string;
  vin: string;
  showroom: string;
  depositDate: string;
  depositAmount: number;
  depositType: "Linh hoạt" | "Cam kết";
  currentMilestone: number; // 0: Success, 1: VIN assigned, 2: In transit, 3: Ready
}

// Preset database for lookups
const PRESET_TRACKING: TrackingRecord[] = [
  {
    orderId: "FLZ-9821",
    phone: "0987654321",
    vehicleName: "VinFast Feliz S",
    color: "Trắng Ngọc Trai",
    vin: "VNF-FLZS-2026-08173",
    showroom: "VinFast Showroom Landmark 81, Bình Thạnh, TP. Hồ Chí Minh",
    depositDate: "18/06/2026",
    depositAmount: 5000000,
    depositType: "Cam kết",
    currentMilestone: 3 // Sẵn sàng bàn giao
  },
  {
    orderId: "EVO-2001",
    phone: "0912345678",
    vehicleName: "VinFast Evo200 Lite",
    color: "Đỏ Kim Cương",
    vin: "VNF-EVOL-2026-19283",
    showroom: "VinFast Showroom Royal City, Thanh Xuân, Hà Nội",
    depositDate: "17/06/2026",
    depositAmount: 2000000,
    depositType: "Linh hoạt",
    currentMilestone: 1 // Đã gán số VIN
  }
];

const MILESTONES = [
  { title: "Đã cọc thành công", desc: "Hệ thống ghi nhận cọc" },
  { title: "Đã gán số VIN", desc: "Xác định số máy số khung" },
  { title: "Xe đang về Showroom", desc: "Đang vận chuyển nội địa" },
  { title: "Sẵn sàng bàn giao", desc: "Liên hệ làm thủ tục nhận xe" }
];

function DepositTrackingContent() {
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const phoneParam = searchParams.get("phone");

  // Query state
  const [queryInput, setQueryInput] = useState("");
  const [searchedRecord, setSearchedRecord] = useState<TrackingRecord | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  // Audio helper for dual "Ting Ting" chime sound
  const playSuccessSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // First chime "Ting"
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.3);

      // Second chime "Ting" (0.12s later)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880.00, ctx.currentTime + 0.12);
      gain2.gain.setValueAtTime(0.4, ctx.currentTime + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.warn("[SignalR Audio] Failed or blocked by browser policy:", e);
    }
  };

  // Real-time payment update subscription
  useEffect(() => {
    if (!searchedRecord || searchedRecord.currentMilestone > 0) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_CONFIG.BASE_URL}/hubs/notification`, {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveOrderPaidNotification", (data: any) => {
      console.log("[SignalR OrderPaid Received]", data);
      const receivedOrderId = data.OrderId || data.orderId;
      if (receivedOrderId && receivedOrderId.toLowerCase() === searchedRecord.orderId.toLowerCase()) {
        playSuccessSound();
        setShowSuccessOverlay(true);
        setSearchedRecord(prev => prev ? {
          ...prev,
          status: "Paid",
          currentMilestone: data.AssignedVin ? 1 : 0,
          vin: data.AssignedVin || prev.vin,
          depositDate: new Date(data.PaidAt || new Date()).toLocaleDateString("vi-VN")
        } : null);
      }
    });

    let isStopped = false;

    const startConnection = async () => {
      try {
        await connection.start();
        if (isStopped) {
          await connection.stop();
        } else {
          console.log("[SignalR Customer] Connected to OrderService Notification Hub.");
        }
      } catch (err) {
        if (!isStopped) {
          console.warn("[SignalR Customer Connection Warning]", err);
        }
      }
    };

    startConnection();

    return () => {
      isStopped = true;
      if (connection.state === signalR.HubConnectionState.Connected) {
        connection.stop().catch(() => {});
      }
    };
  }, [searchedRecord]);

  // Auto-search if query parameters are present on mount
  useEffect(() => {
    const initialQuery = idParam || phoneParam;
    if (initialQuery) {
      setQueryInput(initialQuery);
      performSearch(initialQuery);
    }
  }, [idParam, phoneParam]);

  // Core lookup logic
  const performSearch = async (inputVal: string) => {
    const cleanInput = inputVal.trim();
    if (!cleanInput) {
      setSearchError("Vui lòng nhập Số điện thoại hoặc Mã đơn hàng.");
      return;
    }

    setSearchError("");
    setSearchAttempted(true);

    try {
      const response = await fetch(`${API_CONFIG.ORDER_URL}/api/orders/lookup?query=${encodeURIComponent(cleanInput)}`, { cache: "no-store" });
      if (response.ok) {
        const item = await response.json();
        if (item) {
          setSearchedRecord({
            orderId: item.orderId,
            phone: item.phone,
            vehicleName: item.vehicleName,
            color: item.color || "Tiêu chuẩn",
            vin: item.vin || "",
            showroom: item.showroom,
            depositDate: item.depositDate,
            depositAmount: item.depositAmount,
            depositType: item.depositType,
            currentMilestone: item.currentMilestone
          });
          return;
        } else {
          setSearchError("Không tìm thấy thông tin đơn đặt cọc phù hợp với từ khóa đã nhập. Vui lòng kiểm tra lại Số điện thoại hoặc Mã đơn cọc.");
          setSearchedRecord(null);
        }
      } else {
        const found = PRESET_TRACKING.find(
          (r) => r.orderId.toUpperCase() === cleanInput.toUpperCase() || r.phone === cleanInput
        );
        if (found) {
          setSearchedRecord(found);
        } else {
          setSearchError("Không tìm thấy thông tin đơn đặt cọc phù hợp với từ khóa đã nhập. Vui lòng kiểm tra lại Số điện thoại hoặc Mã đơn cọc.");
          setSearchedRecord(null);
        }
      }
    } catch (err) {
      console.error("Lỗi khi kết nối API Tra cứu đơn cọc:", err);
      setSearchError("Không thể kết nối đến máy chủ tra cứu. Vui lòng thử lại sau.");
      setSearchedRecord(null);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(queryInput);
  };

  const clearSearch = () => {
    setQueryInput("");
    setSearchedRecord(null);
    setSearchAttempted(false);
    setSearchError("");
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 py-12 px-4 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Breadcrumbs & Title */}
        <div className="space-y-3">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <li>
                <Link href="/" className="hover:text-[#E30613] transition-colors">Trang chủ</Link>
              </li>
              <li className="flex items-center gap-1">
                <svg className="h-3 w-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
                <span className="text-slate-500">Tra cứu đơn cọc</span>
              </li>
            </ol>
          </nav>
          
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">
              Tra Cứu &amp; Quản Lý Đơn Đặt Cọc
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold mt-2 uppercase tracking-wide">
              Kiểm tra tình trạng gán số VIN, tiến độ vận chuyển xe và lấy vé điện tử nhận xe
            </p>
          </div>
        </div>

        {/* ── SECTION 1: LOOKUP FORM (Centered when no search) ── */}
        <section 
          aria-label="Khung tìm kiếm"
          className={`bg-white rounded-3xl border border-slate-150 p-6 sm:p-8 shadow-sm transition-all duration-300 ${
            !searchedRecord ? "max-w-md mx-auto my-12" : "w-full"
          }`}
        >
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="lookup-input" className="text-xs font-black uppercase tracking-wider text-slate-500 block">
                Thông tin tra cứu
              </label>
              <div className="relative">
                <input
                  id="lookup-input"
                  type="text"
                  placeholder="Nhập số điện thoại hoặc mã cọc (VD: FLZ-9821)..."
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3.5 text-xs font-semibold focus:border-[#E30613] focus:bg-white outline-none transition-all text-slate-800 placeholder:text-slate-400"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <svg className="h-4.5 w-4.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
                  </svg>
                </div>
              </div>
            </div>

            {searchError && (
              <p className="text-[10px] font-bold text-red-600 uppercase tracking-wide flex items-center gap-1.5 bg-red-50 p-3 rounded-xl border border-red-100">
                <span>⚠️</span> {searchError}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                className="flex-1 rounded-2xl bg-[#E30613] hover:bg-red-700 text-xs font-black uppercase text-white py-3.5 transition-colors shadow-md active:scale-98 cursor-pointer text-center"
              >
                Tìm kiếm đơn cọc
              </button>
              {searchAttempted && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="rounded-2xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 px-5 transition-colors cursor-pointer"
                >
                  Xóa
                </button>
              )}
            </div>
          </form>
        </section>

        {/* ── SECTION 2: TRACKING DETAILS (Renders on successful lookup) ── */}
        {searchedRecord && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Step Milestones Stepper */}
            <section aria-label="Tiến độ đơn hàng" className="bg-white rounded-3xl border border-slate-150 p-6 sm:p-8 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-8">
                Trạng thái chuẩn bị xe máy
              </h3>
              
              {/* Stepper block: responsive horizontal/vertical */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative">
                
                {/* Horizontal progress bar background (Desktop only) */}
                <div className="hidden lg:block absolute left-6 right-6 top-5 h-1 bg-slate-100 z-0">
                  <div 
                    className="h-full bg-[#E30613] transition-all duration-500"
                    style={{ width: `${(searchedRecord.currentMilestone / (MILESTONES.length - 1)) * 100}%` }}
                  />
                </div>

                {MILESTONES.map((step, index) => {
                  const isCompleted = index <= searchedRecord.currentMilestone;
                  const isCurrent = index === searchedRecord.currentMilestone;

                  return (
                    <div 
                      key={index} 
                      className="flex lg:flex-col items-start lg:items-center text-left lg:text-center gap-4 lg:gap-3 flex-1 relative z-10"
                    >
                      {/* Milestone marker circle */}
                      <div className={`h-10 w-10 rounded-full border-2 flex items-center justify-center shrink-0 shadow-sm transition-all duration-300 ${
                        isCompleted
                          ? "bg-[#E30613] border-[#E30613] text-white"
                          : "bg-white border-slate-200 text-slate-400"
                      } ${isCurrent ? "ring-4 ring-red-100 scale-110" : ""}`}>
                        {isCompleted ? (
                          <svg className="h-5 w-5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                        ) : (
                          <span className="text-xs font-black">{index + 1}</span>
                        )}
                      </div>

                      {/* Milestone text details */}
                      <div>
                        <h4 className={`text-xs font-black uppercase tracking-tight ${
                          isCompleted ? "text-slate-900" : "text-slate-400"
                        }`}>
                          {step.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1 leading-relaxed max-w-[150px]">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Stepper Summary details table & E-Receipt card */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              
              {/* Left summary table */}
              <section aria-label="Tóm tắt thông tin" className="md:col-span-7 bg-white rounded-3xl border border-slate-150 p-6 sm:p-8 shadow-sm space-y-6">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 pb-2.5 border-b border-slate-100">
                  Chi tiết đơn hàng cọc
                </h3>

                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs font-semibold text-slate-500">
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-slate-400">Mẫu xe đặt mua</span>
                    <span className="block text-slate-900 font-black mt-1">{searchedRecord.vehicleName}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-slate-400">Màu sắc ngoại thất</span>
                    <span className="block text-slate-900 font-black mt-1">{searchedRecord.color}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-slate-400">Mã định danh số VIN</span>
                    <span className="block font-mono text-[#E30613] font-black mt-1">
                      {searchedRecord.vin ? searchedRecord.vin : "Đang chuẩn bị gán số"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-slate-400">Gói đặt cọc</span>
                    <span className="block text-slate-900 font-black mt-1">
                      {searchedRecord.depositType} ({searchedRecord.depositAmount.toLocaleString("vi-VN")}đ)
                    </span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-50">
                    <span className="block text-[9px] uppercase tracking-wider text-slate-400">Showroom nhận xe chỉ định</span>
                    <span className="block text-slate-900 font-black mt-1 leading-relaxed">
                      📍 {searchedRecord.showroom}
                    </span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-50 flex justify-between">
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider text-slate-400">Thời điểm thanh toán</span>
                      <span className="block text-slate-600 mt-1">{searchedRecord.depositDate}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider text-slate-400">Phương thức</span>
                      <span className="block text-slate-600 mt-1 uppercase text-right">Chuyển khoản / Ví Momo</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-3.5 items-start">
                  <span className="text-base leading-none">ℹ️</span>
                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                    Mã số khung VIN cụ thể đã được khóa cố định cho tài khoản của bạn. Vui lòng chuẩn bị đầy đủ Căn cước công dân gắn chíp khi ra showroom nhận xe để đối chiếu tên trên hợp đồng đặt cọc.
                  </p>
                </div>
              </section>

              {/* Right Perforated E-Ticket component */}
              <section aria-label="Vé nhận xe điện tử" className="md:col-span-5 relative">
                
                {/* Perforated ticket wrapper */}
                <div className="bg-white rounded-3xl border border-slate-150 shadow-lg relative overflow-hidden flex flex-col items-center">
                  
                  {/* Top card block (Details) */}
                  <div className="w-full p-6 text-center space-y-3.5 bg-slate-900 text-white relative z-10">
                    <div className="h-7 w-7 rounded-lg bg-[#E30613] text-white flex items-center justify-center font-black mx-auto shadow-md">
                      V
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#E30613]">Vé Nhận Xe Điện Tử</h4>
                      <p className="text-[9px] font-mono text-slate-400 font-semibold tracking-wider uppercase mt-1">ID: {searchedRecord.orderId}</p>
                    </div>
                  </div>

                  {/* Perforation punched division divider */}
                  <div className="w-full h-8 relative flex items-center z-20 bg-white">
                    {/* Dashed perforated line */}
                    <div className="w-full border-t border-dashed border-slate-200/80 mx-4" />
                    
                    {/* Perforation holes cutouts on left and right borders */}
                    <div className="absolute -left-3.5 w-7 h-7 bg-slate-50 border border-slate-150 rounded-full z-20" />
                    <div className="absolute -right-3.5 w-7 h-7 bg-slate-50 border border-slate-150 rounded-full z-20" />
                  </div>

                  {/* Bottom ticket block (QR Code & Barcode) */}
                  <div className="w-full p-6 flex flex-col items-center space-y-4 bg-white relative z-10">
                    
                    {/* Dynamic QR Code from API */}
                    <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-inner">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${searchedRecord.orderId}`}
                        alt={`QR Code for Order ${searchedRecord.orderId}`}
                        className="h-32 w-32 object-contain"
                      />
                    </div>

                    {/* Stepper pick up instructions */}
                    <div className="text-center space-y-1 w-full">
                      <span className="text-[9px] text-[#E30613] font-black uppercase tracking-wider block">
                        Trạng thái nhận xe:
                      </span>
                      <span className="text-xs font-black text-slate-900 block">
                        {searchedRecord.currentMilestone === 3 
                          ? "✓ SẴN SÀNG NHẬN XE TẠI SHOWROOM" 
                          : "ĐANG GIAO (CHƯA SẴN SÀNG)"
                        }
                      </span>
                      <p className="text-[8.5px] text-slate-400 font-semibold leading-relaxed max-w-[200px] mx-auto pt-1.5">
                        Hãy chụp màn hình mã QR này đem ra Showroom để nhân viên kiểm tra số VIN và bàn giao phương tiện.
                      </p>
                    </div>

                    {/* Barcode mockup */}
                    <div className="w-full pt-4 border-t border-slate-100 flex flex-col items-center gap-1">
                      <div className="flex h-8 gap-0.5 justify-center items-end opacity-75">
                        <div className="w-1.5 h-full bg-slate-900" />
                        <div className="w-0.5 h-full bg-slate-900" />
                        <div className="w-1 h-full bg-slate-900" />
                        <div className="w-0.5 h-full bg-slate-900" />
                        <div className="w-2 h-full bg-slate-900" />
                        <div className="w-0.5 h-full bg-slate-900" />
                        <div className="w-1 h-full bg-slate-900" />
                        <div className="w-1.5 h-full bg-slate-900" />
                        <div className="w-0.5 h-full bg-slate-900" />
                        <div className="w-2 h-full bg-slate-900" />
                        <div className="w-1 h-full bg-slate-900" />
                        <div className="w-0.5 h-full bg-slate-900" />
                      </div>
                      <span className="text-[8px] font-mono font-bold tracking-widest text-slate-500 uppercase">
                        {searchedRecord.vin ? searchedRecord.vin.replace(/-/g, "") : "VINPENDING"}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

            </div>
          </div>
        )}

        {/* Success Overlay Modal */}
        {showSuccessOverlay && searchedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
            <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center overflow-hidden animate-zoom-in">
              <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative h-20 w-20 bg-emerald-500/10 border-2 border-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10 animate-bounce">
                <svg className="h-10 w-10 text-emerald-400 stroke-[3.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                <span className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-75"></span>
              </div>

              <div className="space-y-3 mt-6">
                <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full leading-none inline-block">
                  ⚡ GIAO DỊCH THÀNH CÔNG
                </span>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">ĐÃ GHI NHẬN ĐẶT CỌC THÀNH CÔNG!</h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                  Cảm ơn bạn đã lựa chọn xe máy điện VinFast! <br />
                  Hệ thống đã nhận thanh toán cọc thành công cho đơn hàng của bạn. Số khung/máy (VIN) của xe đã được giữ cố định.
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4.5 text-xs text-left space-y-2 mt-6 font-semibold">
                <p className="flex justify-between"><span className="text-slate-400">Đơn hàng (TxnRef):</span> <span className="font-mono text-white font-bold">{searchedRecord.orderId}</span></p>
                <p className="flex justify-between"><span className="text-slate-400">Mẫu xe điện:</span> <span className="text-blue-400 font-extrabold">{searchedRecord.vehicleName}</span></p>
                <p className="flex justify-between"><span className="text-slate-400">Số VIN đã khóa:</span> <span className="font-mono text-emerald-400 font-bold">{searchedRecord.vin || "Đang xử lý"}</span></p>
                <p className="flex justify-between"><span className="text-slate-400">Tiền cọc nhận được:</span> <span className="text-white font-mono font-bold">+{searchedRecord.depositAmount.toLocaleString("vi-VN")} đ</span></p>
              </div>

              <button
                onClick={() => setShowSuccessOverlay(false)}
                className="w-full mt-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black uppercase text-xs py-3.5 tracking-wider transition-all shadow-md hover:shadow-emerald-500/20 active:scale-95 cursor-pointer"
              >
                Xem chi tiết đơn cọc
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

export default function DepositTracking() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-8 h-8 border-4 border-[#E30613] border-t-transparent rounded-full" />
          <p className="text-sm font-semibold text-slate-500">Đang tải...</p>
        </div>
      </div>
    }>
      <DepositTrackingContent />
    </Suspense>
  );
}
