"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { API_CONFIG } from "@/config/apiConfig";

interface Showroom {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  isOpen: boolean;
  city: string;
  district: string;
  hasCharging: boolean;
  hasService: boolean;
  hasBatterySwap: boolean;
  lat: number;
  lng: number;
}

const SHOWROOM_DATABASE: Showroom[] = [
  {
    id: "sr-ha-noi-1",
    name: "VinFast Showroom Royal City",
    address: "B2-R6-50-51, TTTM Royal City, 72A Nguyễn Trãi, Thượng Đình, Thanh Xuân, Hà Nội",
    phone: "1900 2323 89",
    hours: "08:00 - 22:00",
    isOpen: true,
    city: "hanoi",
    district: "thanhxuan",
    hasCharging: true,
    hasService: false,
    hasBatterySwap: true,
    lat: 21.002,
    lng: 105.815,
  },
  {
    id: "sr-ha-noi-2",
    name: "VinFast Showroom 3G Trần Hưng Đạo",
    address: "Số 3G Trần Hưng Đạo, Phan Chu Trinh, Hoàn Kiếm, Hà Nội",
    phone: "1900 2323 89",
    hours: "08:00 - 21:00",
    isOpen: true,
    city: "hanoi",
    district: "hoankiem",
    hasCharging: true,
    hasService: true,
    hasBatterySwap: true,
    lat: 21.022,
    lng: 105.856,
  },
  {
    id: "sr-ha-noi-3",
    name: "VinFast Service Center Phạm Văn Đồng",
    address: "Số 166 Phạm Văn Đồng, Xuân Đỉnh, Bắc Từ Liêm, Hà Nội",
    phone: "1900 2323 89",
    hours: "08:00 - 18:00",
    isOpen: false,
    city: "hanoi",
    district: "bactuliem",
    hasCharging: false,
    hasService: true,
    hasBatterySwap: false,
    lat: 21.066,
    lng: 105.792,
  },
  {
    id: "sr-ha-noi-4",
    name: "VinFast Showroom Long Biên",
    address: "Số 1 Nguyễn Văn Linh, Gia Thụy, Long Biên, Hà Nội",
    phone: "1900 2323 89",
    hours: "08:00 - 20:00",
    isOpen: true,
    city: "hanoi",
    district: "longbien",
    hasCharging: true,
    hasService: true,
    hasBatterySwap: false,
    lat: 21.038,
    lng: 105.897,
  },
  {
    id: "sr-hcm-1",
    name: "VinFast Showroom Landmark 81",
    address: "TTTM Vincom Center Landmark 81, 208 Nguyễn Hữu Cảnh, Phường 22, Bình Thạnh, TP. Hồ Chí Minh",
    phone: "1900 2323 89",
    hours: "09:30 - 22:00",
    isOpen: true,
    city: "hcm",
    district: "binhthanh",
    hasCharging: true,
    hasService: false,
    hasBatterySwap: true,
    lat: 10.795,
    lng: 106.721,
  },
  {
    id: "sr-hcm-2",
    name: "VinFast Showroom Trần Hưng Đạo",
    address: "Số 322 Trần Hưng Đạo, Phường Nguyễn Cư Trinh, Quận 1, TP. Hồ Chí Minh",
    phone: "1900 2323 89",
    hours: "08:00 - 21:00",
    isOpen: true,
    city: "hcm",
    district: "quan1",
    hasCharging: true,
    hasService: true,
    hasBatterySwap: true,
    lat: 10.762,
    lng: 106.689,
  },
  {
    id: "sr-hcm-3",
    name: "VinFast Showroom An Dương Vương",
    address: "Số 20 An Dương Vương, Phường 9, Quận 5, TP. Hồ Chí Minh",
    phone: "1900 2323 89",
    hours: "08:00 - 21:00",
    isOpen: true,
    city: "hcm",
    district: "quan5",
    hasCharging: false,
    hasService: true,
    hasBatterySwap: true,
    lat: 10.755,
    lng: 106.671,
  },
  {
    id: "sr-danang-1",
    name: "VinFast Showroom Ngô Quyền",
    address: "Số 910A Ngô Quyền, An Hải Bắc, Sơn Trà, Đà Nẵng",
    phone: "1900 2323 89",
    hours: "08:00 - 21:00",
    isOpen: true,
    city: "danang",
    district: "sontra",
    hasCharging: true,
    hasService: true,
    hasBatterySwap: false,
    lat: 16.082,
    lng: 108.231,
  },
  {
    id: "sr-danang-2",
    name: "VinFast Showroom Hải Châu",
    address: "Số 115 Nguyễn Văn Linh, Nam Dương, Hải Châu, Đà Nẵng",
    phone: "1900 2323 89",
    hours: "08:00 - 22:00",
    isOpen: true,
    city: "danang",
    district: "haichau",
    hasCharging: true,
    hasService: false,
    hasBatterySwap: true,
    lat: 16.061,
    lng: 108.215,
  }
];

const CITIES = [
  { value: "all", label: "Tất cả Tỉnh/Thành" },
  { value: "hanoi", label: "Hà Nội" },
  { value: "hcm", label: "TP. Hồ Chí Minh" },
  { value: "danang", label: "Đà Nẵng" }
];

const DISTRICTS_MAP: Record<string, { value: string; label: string }[]> = {
  all: [{ value: "all", label: "Tất cả Quận/Huyện" }],
  hanoi: [
    { value: "all", label: "Tất cả Quận/Huyện" },
    { value: "thanhxuan", label: "Thanh Xuân" },
    { value: "hoankiem", label: "Hoàn Kiếm" },
    { value: "bactuliem", label: "Bắc Từ Liêm" },
    { value: "longbien", label: "Long Biên" }
  ],
  hcm: [
    { value: "all", label: "Tất cả Quận/Huyện" },
    { value: "binhthanh", label: "Bình Thạnh" },
    { value: "quan1", label: "Quận 1" },
    { value: "quan5", label: "Quận 5" }
  ],
  danang: [
    { value: "all", label: "Tất cả Quận/Huyện" },
    { value: "sontra", label: "Sơn Trà" },
    { value: "haichau", label: "Hải Châu" }
  ]
};

const CITY_CENTERS: Record<string, { lat: number; lng: number }> = {
  hanoi: { lat: 21.028, lng: 105.834 },
  hcm: { lat: 10.776, lng: 106.696 },
  danang: { lat: 16.068, lng: 108.212 },
  all: { lat: 16.0, lng: 108.0 }
};

function ShowroomsContent() {
  const searchParams = useSearchParams();
  const regionParam = searchParams.get("region");

  // Mobile viewport view toggle: false = List, true = Map
  const [showMobileMap, setShowMobileMap] = useState(false);

  // Filter states
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedDistrict, setSelectedDistrict] = useState("all");
  const [filterCharging, setFilterCharging] = useState(false);
  const [filterService, setFilterService] = useState(false);
  const [filterBatterySwap, setFilterBatterySwap] = useState(false);

  // Zoom control state for the mockup map
  const [zoom, setZoom] = useState(12);

  // Showrooms state loaded from API (with SHOWROOM_DATABASE as fallback)
  const [showrooms, setShowrooms] = useState<Showroom[]>(SHOWROOM_DATABASE);

  // Selected Showroom state
  const [selectedShowroom, setSelectedShowroom] = useState<Showroom>(SHOWROOM_DATABASE[0]);

  // Fetch showrooms dynamically from Backend API on mount
  useEffect(() => {
    const loadShowrooms = async () => {
      try {
        const response = await fetch(`${API_CONFIG.ORDER_URL}/api/admin/showrooms?page=1&pageSize=100`, {
          cache: "no-store"
        });
        if (response.ok) {
          const data = await response.json();
          if (data && Array.isArray(data.items) && data.items.length > 0) {
            const mappedShowrooms: Showroom[] = data.items.map((sr: any, idx: number) => {
              const nameLower = (sr.name || "").toLowerCase();
              const addressLower = (sr.address || "").toLowerCase();
              const srId = sr.id || sr.code || `sr-item-${idx}`;

              // Determine city based on address keywords
              let city = "hcm";
              if (addressLower.includes("hà nội") || addressLower.includes("ha noi")) city = "hanoi";
              else if (addressLower.includes("đà nẵng") || addressLower.includes("da nang")) city = "danang";

              // Determine district based on address keywords
              let district = "all";
              if (addressLower.includes("gia lâm")) district = "gialam";
              else if (addressLower.includes("thanh xuân")) district = "thanhxuan";
              else if (addressLower.includes("cầu giấy")) district = "caugiay";
              else if (addressLower.includes("long biên")) district = "longbien";
              else if (addressLower.includes("bình thạnh")) district = "binhthanh";
              else if (addressLower.includes("quận 1") || addressLower.includes("q.1")) district = "quan1";
              else if (addressLower.includes("quận 5") || addressLower.includes("q.5")) district = "quan5";
              else if (addressLower.includes("sơn trà")) district = "sontra";
              else if (addressLower.includes("hải châu")) district = "haichau";

              // Determine amenities deterministically based on character codes of name / id
              const hasService = nameLower.includes("service") || nameLower.includes("dịch vụ") || (srId.charCodeAt(0) % 2 === 0);
              const hasCharging = !nameLower.includes("service") || ((srId.charCodeAt(1) || 0) % 2 === 0);
              const hasBatterySwap = (srId.charCodeAt(2) || 0) % 2 === 0;

              return {
                id: sr.id || sr.code || `sr-item-${idx}-${Math.random().toString(36).substring(2, 7)}`,
                name: sr.name || "Showroom VinFast",
                address: sr.address || "Địa chỉ đang cập nhật",
                phone: sr.hotline || sr.phone || "1900 2323 89",
                hours: `${sr.openTime || "08:00"} - ${sr.closeTime || "20:00"}`,
                isOpen: sr.isActive ?? true,
                city,
                district,
                hasCharging,
                hasService,
                hasBatterySwap,
                lat: sr.latitude || 10.7769,
                lng: sr.longitude || 106.7009
              };
            });
            setShowrooms(mappedShowrooms);
            setSelectedShowroom(mappedShowrooms[0]);
          }
        }
      } catch (err) {
        console.error("Lỗi khi kết nối API Showroom, đang sử dụng dữ liệu giả lập:", err);
      }
    };
    loadShowrooms();
  }, []);

  // Set initial city if URL parameter matches
  useEffect(() => {
    if (regionParam && ["hanoi", "hcm", "danang"].includes(regionParam)) {
      setSelectedCity(regionParam);
      setSelectedDistrict("all");
      const matchingSr = showrooms.find(s => s.city === regionParam);
      if (matchingSr) {
        setSelectedShowroom(matchingSr);
      }
    }
  }, [regionParam, showrooms]);

  // Handle city selection change
  const handleCityChange = (cityVal: string) => {
    setSelectedCity(cityVal);
    setSelectedDistrict("all");
  };

  // Filter logic
  const filteredShowrooms = useMemo(() => {
    return showrooms.filter((sr) => {
      if (selectedCity !== "all" && sr.city !== selectedCity) return false;
      if (selectedDistrict !== "all" && sr.district !== selectedDistrict) return false;
      if (filterCharging && !sr.hasCharging) return false;
      if (filterService && !sr.hasService) return false;
      if (filterBatterySwap && !sr.hasBatterySwap) return false;
      return true;
    });
  }, [showrooms, selectedCity, selectedDistrict, filterCharging, filterService, filterBatterySwap]);

  // Update selected showroom if current one gets filtered out
  useEffect(() => {
    if (filteredShowrooms.length > 0 && !filteredShowrooms.some(s => s.id === selectedShowroom.id)) {
      setSelectedShowroom(filteredShowrooms[0]);
    }
  }, [filteredShowrooms, selectedShowroom]);

  // Map panning & zoom calculations
  const mapCenter = useMemo(() => {
    return {
      lat: selectedShowroom?.lat ?? 10.776,
      lng: selectedShowroom?.lng ?? 106.696
    };
  }, [selectedShowroom]);

  const cityCenter = useMemo(() => {
    return CITY_CENTERS[selectedShowroom?.city ?? "hcm"] || CITY_CENTERS.hcm;
  }, [selectedShowroom]);

  // SVG background translation/scaling parameters
  const mapScale = useMemo(() => {
    return Math.pow(1.5, zoom - 12) * 600;
  }, [zoom]);

  const svgOffset = useMemo(() => {
    const dLat = mapCenter.lat - cityCenter.lat;
    const dLng = mapCenter.lng - cityCenter.lng;
    return {
      x: -dLng * mapScale,
      y: dLat * mapScale
    };
  }, [mapCenter, cityCenter, mapScale]);

  const mapPins = useMemo(() => {
    return filteredShowrooms.map(sr => {
      const dLat = sr.lat - mapCenter.lat;
      const dLng = sr.lng - mapCenter.lng;
      const left = 50 + dLng * mapScale;
      const top = 50 - dLat * mapScale;
      return {
        ...sr,
        left: `${left}%`,
        top: `${top}%`,
        isSelected: sr.id === selectedShowroom.id,
        isVisible: left >= -10 && left <= 110 && top >= -10 && top <= 110
      };
    });
  }, [filteredShowrooms, mapCenter, mapScale, selectedShowroom]);

  const zoomIn = () => setZoom(prev => Math.min(prev + 1, 16));
  const zoomOut = () => setZoom(prev => Math.max(prev - 1, 9));

  return (
    <main className="h-[calc(100vh-66px)] flex flex-col relative overflow-hidden bg-white font-sans">
      
      {/* ── Desktop/Mobile Split Main Content Wrapper ── */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT COLUMN: FILTER & SHOWROOM LIST (40% width on Desktop) */}
        <section 
          aria-label="Danh sách cửa hàng"
          className={`w-full lg:w-[40%] flex flex-col h-full bg-white border-r border-slate-100 overflow-hidden shrink-0 z-10 transition-all duration-300 ${
            showMobileMap ? "hidden lg:flex" : "flex"
          }`}
        >
          
          {/* Header block with search filter */}
          <div className="p-5 border-b border-slate-100 space-y-4 shrink-0 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
            <nav className="flex mb-1" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <li>
                  <Link href="/" className="hover:text-[#E30613] transition-colors">Trang chủ</Link>
                </li>
                <li className="flex items-center gap-1">
                  <svg className="h-3 w-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                  <span className="text-slate-500">Hệ thống showroom</span>
                </li>
              </ol>
            </nav>
            <div>
              <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">
                Hệ thống Showroom &amp; Trạm sạc VinFast
              </h1>
              <p className="text-[10px] text-slate-400 font-semibold mt-1.5 uppercase tracking-wide">
                Định vị điểm sạc, xưởng bảo dưỡng và dịch vụ pin toàn quốc
              </p>
            </div>

            {/* Region selectors */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label htmlFor="city-select" className="sr-only">Tỉnh/Thành phố</label>
                <select
                  id="city-select"
                  value={selectedCity}
                  onChange={(e) => handleCityChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:border-[#E30613] focus:bg-white outline-none transition-all cursor-pointer shadow-sm font-bold text-slate-700 hover:border-slate-300"
                >
                  {CITIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="district-select" className="sr-only">Quận/Huyện</label>
                <select
                  id="district-select"
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:border-[#E30613] focus:bg-white outline-none transition-all cursor-pointer shadow-sm font-bold text-slate-700 hover:border-slate-300"
                >
                  {(DISTRICTS_MAP[selectedCity] || DISTRICTS_MAP.all).map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Utility filters */}
            <div className="pt-1 flex flex-wrap gap-1.5">
              <button
                id="filter-charging"
                onClick={() => setFilterCharging(!filterCharging)}
                className={`inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-[10px] font-extrabold uppercase transition-all duration-200 border cursor-pointer ${
                  filterCharging
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300 ring-1 ring-emerald-100 shadow-sm"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                ⚡ Có trạm sạc
              </button>
              <button
                id="filter-service"
                onClick={() => setFilterService(!filterService)}
                className={`inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-[10px] font-extrabold uppercase transition-all duration-200 border cursor-pointer ${
                  filterService
                    ? "bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-100 shadow-sm"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                🔧 Xưởng dịch vụ
              </button>
              <button
                id="filter-battery-swap"
                onClick={() => setFilterBatterySwap(!filterBatterySwap)}
                className={`inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-[10px] font-extrabold uppercase transition-all duration-200 border cursor-pointer ${
                  filterBatterySwap
                    ? "bg-amber-50 text-amber-700 border-amber-300 ring-1 ring-amber-100 shadow-sm"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                🔋 Có đổi pin
              </button>
            </div>
          </div>
 
          {/* Scrollable list content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/40">
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold px-1 uppercase tracking-wider">
              <span>Đại lý đang hoạt động</span>
              <span>{filteredShowrooms.length} địa điểm tìm thấy</span>
            </div>

            {filteredShowrooms.length > 0 ? (
              filteredShowrooms.map((sr) => {
                const isSelected = selectedShowroom.id === sr.id;
                return (
                  <button
                    key={sr.id}
                    id={`showroom-card-${sr.id}`}
                    onClick={() => {
                      setSelectedShowroom(sr);
                    }}
                    className={`w-full text-left bg-white rounded-2xl border-2 p-4.5 shadow-sm transition-all duration-300 flex flex-col gap-3.5 cursor-pointer relative overflow-hidden group ${
                      isSelected
                        ? "border-[#E30613] shadow-md shadow-red-50"
                        : "border-slate-100 hover:border-slate-200 hover:shadow-md"
                    }`}
                  >
                    {/* Brand Red accent bar for selected showroom */}
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#E30613]" />
                    )}

                    <div className={isSelected ? "pl-1.5" : ""}>
                      <h3 className={`text-xs font-black leading-snug group-hover:text-[#E30613] transition-colors ${
                        isSelected ? "text-[#E30613]" : "text-slate-900"
                      }`}>
                        {sr.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1">
                        {sr.address}
                      </p>
                    </div>

                    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-slate-50 gap-2 ${
                      isSelected ? "pl-1.5" : ""
                    }`}>
                      <div className="text-[10px] font-semibold text-slate-400 space-y-0.5">
                        <p>Hotline: <span className="text-[#E30613] font-bold">{sr.phone}</span></p>
                        <p>{sr.hours} · <span className={sr.isOpen ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                          {sr.isOpen ? "Đang mở cửa" : "Tạm đóng cửa"}
                        </span></p>
                      </div>

                      {/* Small inline badge tags */}
                      <div className="flex flex-wrap gap-1">
                        {sr.hasCharging && (
                          <span className="rounded px-1.5 py-0.5 text-[8px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-100/50">
                            Trạm sạc
                          </span>
                        )}
                        {sr.hasService && (
                          <span className="rounded px-1.5 py-0.5 text-[8px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-100/50">
                            Sửa chữa
                          </span>
                        )}
                        {sr.hasBatterySwap && (
                          <span className="rounded px-1.5 py-0.5 text-[8px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-100/50">
                            Đổi pin
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="bg-white border border-dashed border-slate-200 rounded-2xl py-12 px-4 text-center space-y-3.5 shadow-sm">
                <div className="h-10 w-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto text-base">
                  📍
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Không tìm thấy địa điểm</h4>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                    Hãy xoá bộ lọc hoặc chọn khu vực thành phố lớn khác.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedCity("all");
                    setSelectedDistrict("all");
                    setFilterCharging(false);
                    setFilterService(false);
                    setFilterBatterySwap(false);
                  }}
                  className="rounded-full bg-slate-900 px-5 py-2.5 text-[10px] font-extrabold text-white hover:bg-[#E30613] transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: MAP VIEWPORT (60% width on Desktop, full screen overlay on Mobile when active) */}
        <section 
          aria-label="Bản đồ trực quan"
          className={`w-full lg:w-[60%] h-full relative bg-[#ecebe8] z-20 ${
            showMobileMap ? "flex" : "hidden lg:block"
          }`}
        >
          {/* Map canvas containing mock vectors panned dynamically */}
          <div className="absolute inset-0 w-full h-full overflow-hidden select-none">
            
            {/* Dynamic Map Grid System and Roads */}
            <div 
              className="absolute w-[2000px] h-[2000px] top-1/2 left-1/2 transition-transform duration-300 ease-out origin-center"
              style={{
                transform: `translate(-50%, -50%) translate(${svgOffset.x}px, ${svgOffset.y}px) scale(${Math.pow(1.2, zoom - 12)})`
              }}
            >
              {/* Background Color & Styled Grid */}
              <div className="absolute inset-0 bg-[#f4f3f0]" />
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#a3a29e_1px,transparent_1px)] [background-size:24px_24px]" />

              {/* Hanoi Vector Mock Map Features */}
              {selectedShowroom?.city === "hanoi" && (
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 2000 2000">
                  {/* Red River (Sông Hồng) */}
                  <path d="M 300,0 Q 500,600 1200,1000 T 2000,1500" fill="none" stroke="#c0e0e9" strokeWidth="120" strokeLinecap="round" />
                  <path d="M 300,0 Q 500,600 1200,1000 T 2000,1500" fill="none" stroke="#a9d3e0" strokeWidth="80" strokeLinecap="round" />
                  {/* West Lake (Hồ Tây) */}
                  <circle cx="850" cy="800" r="140" fill="#c0e0e9" stroke="#a9d3e0" strokeWidth="6" />
                  <text x="850" y="805" fill="#5b8296" fontSize="13" fontWeight="bold" textAnchor="middle">HỒ TÂY</text>
                  {/* Truc Bach Lake */}
                  <circle cx="990" cy="880" r="35" fill="#c0e0e9" stroke="#a9d3e0" strokeWidth="2" />
                  {/* Hoan Kiem Lake */}
                  <ellipse cx="1025" cy="1020" rx="20" ry="38" fill="#c0e0e9" stroke="#a9d3e0" strokeWidth="3" />
                  <text x="1025" y="1024" fill="#5b8296" fontSize="9" fontWeight="bold" textAnchor="middle">HỒ HOÀN KIẾM</text>
                  {/* Parks */}
                  <rect x="860" y="960" width="80" height="60" rx="15" fill="#d0eed0" />
                  <text x="900" y="995" fill="#4d784d" fontSize="9" fontWeight="bold" textAnchor="middle">Bách Thảo</text>
                  <circle cx="1040" cy="1160" r="50" fill="#d0eed0" />
                  <text x="1040" y="1163" fill="#4d784d" fontSize="9" fontWeight="bold" textAnchor="middle">Thống Nhất</text>
                  {/* Roads Grid */}
                  <path d="M 0,900 L 2000,900" fill="none" stroke="#ffffff" strokeWidth="16" />
                  <path d="M 1000,0 L 1000,2000" fill="none" stroke="#ffffff" strokeWidth="18" />
                  <path d="M 1000,0 L 1000,2000" fill="none" stroke="#eae8e4" strokeWidth="12" />
                  <path d="M 975,815 Q 1030,880 1025,975" fill="none" stroke="#fce4b3" strokeWidth="10" />
                  <path d="M 850,940 L 1200,940" fill="none" stroke="#ffffff" strokeWidth="12" />
                  <path d="M 600,1100 Q 1000,1050 1400,1200" fill="none" stroke="#ffffff" strokeWidth="14" />
                  <path d="M 600,1100 Q 1000,1050 1400,1200" fill="none" stroke="#eae8e4" strokeWidth="8" />
                  <path d="M 950,880 L 980,1000" fill="none" stroke="#ffffff" strokeWidth="8" />
                  {/* Landmark Marks */}
                  <text x="900" y="920" fill="#9c9a96" fontSize="10" fontWeight="bold">Lăng Bác</text>
                  <text x="1100" y="970" fill="#9c9a96" fontSize="10" fontWeight="bold">Nhà Hát Lớn</text>
                  <text x="760" y="1130" fill="#9c9a96" fontSize="10" fontWeight="bold">Ngã Tư Sở</text>
                </svg>
              )}

              {/* HCM Vector Mock Map Features */}
              {selectedShowroom?.city === "hcm" && (
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 2000 2000">
                  {/* Saigon River (Sông Sài Gòn) */}
                  <path d="M 200,0 C 500,400 400,600 900,700 C 1400,800 1300,1200 900,1300 C 600,1400 1000,1700 1200,2000" fill="none" stroke="#c0e0e9" strokeWidth="140" strokeLinecap="round" />
                  <path d="M 200,0 C 500,400 400,600 900,700 C 1400,800 1300,1200 900,1300 C 600,1400 1000,1700 1200,2000" fill="none" stroke="#a9d3e0" strokeWidth="100" strokeLinecap="round" />
                  {/* Thu Thiem Green Core */}
                  <path d="M 950,780 C 1200,800 1250,1100 1050,1220 Z" fill="#d0eed0" opacity="0.8" />
                  <text x="1120" y="1000" fill="#4d784d" fontSize="12" fontWeight="bold" textAnchor="middle">THỦ THIÊM</text>
                  {/* Vinhomes Central Park */}
                  <rect x="1150" y="650" width="100" height="90" rx="10" fill="#d0eed0" />
                  <text x="1200" y="700" fill="#4d784d" fontSize="8" fontWeight="bold" textAnchor="middle">CV Landmark</text>
                  {/* Tao Dan Park */}
                  <rect x="760" y="1030" width="70" height="70" rx="10" fill="#d0eed0" />
                  <text x="795" y="1070" fill="#4d784d" fontSize="9" fontWeight="bold" textAnchor="middle">Tao Đàn</text>
                  {/* Main Roads */}
                  <path d="M 0,1000 L 2000,1000" fill="none" stroke="#ffffff" strokeWidth="20" />
                  <path d="M 0,1000 L 2000,1000" fill="none" stroke="#eae8e4" strokeWidth="14" />
                  <path d="M 850,0 L 850,2000" fill="none" stroke="#ffffff" strokeWidth="16" />
                  <path d="M 850,0 L 850,2000" fill="none" stroke="#eae8e4" strokeWidth="10" />
                  {/* Võ Văn Kiệt highway along river */}
                  <path d="M 300,1220 Q 800,1150 1500,1400" fill="none" stroke="#fce4b3" strokeWidth="12" />
                  <path d="M 700,880 L 1300,880" fill="none" stroke="#ffffff" strokeWidth="10" />
                  {/* Landmark labels */}
                  <text x="910" y="950" fill="#9c9a96" fontSize="10" fontWeight="bold">Chợ Bến Thành</text>
                  <text x="930" y="910" fill="#9c9a96" fontSize="9" fontWeight="bold">Nhà Thờ Đức Bà</text>
                  <text x="690" y="1150" fill="#9c9a96" fontSize="10" fontWeight="bold">Q.5 An Đông</text>
                </svg>
              )}

              {/* Da Nang Vector Mock Map Features */}
              {selectedShowroom?.city === "danang" && (
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 2000 2000">
                  {/* Ocean (Bển Đông) on the right */}
                  <rect x="1450" y="0" width="550" height="2000" fill="#c0e0e9" />
                  <path d="M 1450,0 Q 1400,600 1480,1200 T 1420,2000" fill="#c0e0e9" />
                  <path d="M 1450,0 Q 1400,600 1480,1200 T 1420,2000" fill="none" stroke="#a9d3e0" strokeWidth="15" />
                  <text x="1750" y="1000" fill="#5b8296" fontSize="18" fontWeight="bold" textAnchor="middle" letterSpacing="4">BIỂN ĐÔNG</text>
                  {/* Han River (Sông Hàn) */}
                  <path d="M 1000,2000 L 980,600 Q 940,300 800,200" fill="none" stroke="#c0e0e9" strokeWidth="100" strokeLinecap="round" />
                  <path d="M 1000,2000 L 980,600 Q 940,300 800,200" fill="none" stroke="#a9d3e0" strokeWidth="70" strokeLinecap="round" />
                  <text x="940" y="1400" fill="#5b8296" fontSize="11" fontWeight="bold" textAnchor="middle" transform="rotate(-88, 940, 1400)">SÔNG HÀN</text>
                  {/* Son Tra Peninsula */}
                  <path d="M 1200,0 C 1300,100 1600,0 1800,250 C 2000,500 1600,600 1400,450 Z" fill="#d0eed0" />
                  <text x="1600" y="250" fill="#4d784d" fontSize="14" fontWeight="bold" textAnchor="middle">SƠN TRÀ</text>
                  {/* Bridges */}
                  <line x1="970" y1="1050" x2="1030" y2="1050" stroke="#f59e0b" strokeWidth="10" strokeLinecap="round" /> {/* Dragon Bridge */}
                  <text x="1050" y="1053" fill="#b45309" fontSize="9" fontWeight="bold">Cầu Rồng</text>
                  <line x1="965" y1="850" x2="1025" y2="850" stroke="#ffffff" strokeWidth="8" /> {/* Han Bridge */}
                  <text x="1040" y="853" fill="#6b7280" fontSize="9" fontWeight="bold">Cầu Sông Hàn</text>
                  {/* Main Roads */}
                  <path d="M 0,1050 L 2000,1050" fill="none" stroke="#ffffff" strokeWidth="18" />
                  <path d="M 0,1050 L 2000,1050" fill="none" stroke="#eae8e4" strokeWidth="12" />
                  <path d="M 1200,0 L 1200,2000" fill="none" stroke="#ffffff" strokeWidth="14" />
                  <path d="M 1200,0 L 1200,2000" fill="none" stroke="#eae8e4" strokeWidth="8" />
                  {/* Coastal Road (Võ Nguyên Giáp) */}
                  <path d="M 1410,350 Q 1380,1000 1400,2000" fill="none" stroke="#fce4b3" strokeWidth="14" />
                  {/* Landmarks */}
                  <text x="1270" y="1200" fill="#9c9a96" fontSize="10" fontWeight="bold">Mỹ Khê Beach</text>
                  <text x="800" y="980" fill="#9c9a96" fontSize="10" fontWeight="bold">Sân Bay Đà Nẵng</text>
                </svg>
              )}
            </div>

            {/* Inactive map pinpoints rendered relative to map center */}
            {mapPins.map((pin) => {
              if (!pin.isVisible || pin.isSelected) return null;
              return (
                <button
                  key={`inactive-pin-${pin.id}`}
                  onClick={() => setSelectedShowroom(pin)}
                  style={{ left: pin.left, top: pin.top }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer group/pin flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
                >
                  {/* Gray/Dark pin for secondary shops */}
                  <div className="h-7 w-7 rounded-full bg-slate-800 hover:bg-[#E30613] border-2 border-white shadow-md flex items-center justify-center transition-colors duration-300">
                    <span className="text-[9px] text-white font-extrabold leading-none">V</span>
                  </div>
                  <span className="absolute bottom-full mb-2 bg-slate-900/90 text-[10px] font-bold text-white px-2.5 py-1 rounded shadow-md border border-slate-800 opacity-0 pointer-events-none group-hover/pin:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    {pin.name}
                  </span>
                </button>
              );
            })}

            {/* Central ACTIVE/SELECTED Pinpoint (Centered at 50%, 50%) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex items-center justify-center">
              
              {/* Pulse waves */}
              <div className="absolute h-10 w-10 rounded-full bg-[#E30613]/20 animate-ping origin-center pointer-events-none" />
              <div className="absolute h-16 w-16 rounded-full bg-[#E30613]/10 animate-pulse origin-center pointer-events-none" />

              {/* Red Map Pin Button */}
              <button 
                id="active-map-pin"
                className="cursor-pointer filter drop-shadow-xl active:scale-90 transition-transform duration-200"
              >
                <svg className="h-11 w-11 text-[#E30613]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </button>

              {/* Info Popup Window (Popup Map) directly above the center pin */}
              <div className="absolute bottom-[44px] left-1/2 -translate-x-1/2 z-40 bg-white rounded-2xl border border-slate-100 p-4 shadow-[0_10px_35px_-5px_rgba(0,0,0,0.15)] w-64 text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-1.5">
                    <span className="text-[11px] font-black text-slate-900 line-clamp-1 leading-snug flex-1">
                      {selectedShowroom.name}
                    </span>
                    <span className={`text-[8px] font-extrabold uppercase shrink-0 px-1.5 py-0.5 rounded ${
                      selectedShowroom.isOpen ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    }`}>
                      {selectedShowroom.isOpen ? "Mở" : "Đóng"}
                    </span>
                  </div>
                  
                  <p className="text-[9px] text-slate-500 font-medium leading-relaxed line-clamp-2">
                    {selectedShowroom.address}
                  </p>

                  <div className="flex flex-wrap gap-1 pt-1.5 border-t border-slate-100">
                    {selectedShowroom.hasCharging && (
                      <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[7px] font-bold uppercase">Sạc LFP</span>
                    )}
                    {selectedShowroom.hasService && (
                      <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[7px] font-bold uppercase">Xưởng dịch vụ</span>
                    )}
                    {selectedShowroom.hasBatterySwap && (
                      <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[7px] font-bold uppercase">Đổi pin</span>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 text-[9px] font-extrabold">
                    <a href={`tel:${selectedShowroom.phone.replace(/\s+/g, "")}`} className="text-[#E30613] hover:underline flex items-center gap-0.5">
                      📞 Hotline: {selectedShowroom.phone}
                    </a>
                    <a
                      href={`https://maps.google.com/?q=${selectedShowroom.lat},${selectedShowroom.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-600 hover:text-slate-900 inline-flex items-center gap-0.5"
                    >
                      Bản đồ
                      <svg className="h-2.5 w-2.5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                      </svg>
                    </a>
                  </div>
                </div>
                {/* Pointy down triangle */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.08)]" />
              </div>
            </div>

            {/* Map Controls Group (Zoom & Layer indicators) */}
            <div className="absolute bottom-6 right-6 flex flex-col gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.1)] rounded-xl overflow-hidden border border-slate-200/60 bg-white/95 backdrop-blur-sm z-30">
              <button 
                id="map-zoom-in"
                onClick={zoomIn} 
                className="h-9 w-9 hover:bg-slate-50 active:bg-slate-100 flex items-center justify-center font-bold text-slate-800 text-sm transition-colors border-b border-slate-100 cursor-pointer"
                title="Phóng to"
              >
                ＋
              </button>
              <button 
                id="map-zoom-out"
                onClick={zoomOut} 
                className="h-9 w-9 hover:bg-slate-50 active:bg-slate-100 flex items-center justify-center font-bold text-slate-800 text-sm transition-colors cursor-pointer"
                title="Thu nhỏ"
              >
                －
              </button>
            </div>

            {/* Bottom-left Map Metadata Tag */}
            <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm px-3.5 py-2 rounded-xl text-[9px] text-slate-500 font-extrabold uppercase tracking-widest border border-slate-200/50 shadow-sm z-30 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#E30613] animate-pulse" />
              🗺️ VinFast O2O Live Maps
            </div>

            {/* Floating detail glassmorphism panel (Desktop only) */}
            <div className="hidden sm:block absolute top-6 left-6 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-150 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.12)] w-72 z-30 max-w-[calc(100vw-48px)] transition-all duration-300">
              <div>
                <span className="text-[9px] font-extrabold uppercase bg-red-50 text-[#E30613] border border-red-100/50 rounded-lg px-2.5 py-1 tracking-widest inline-block leading-none">
                  Chi tiết địa điểm
                </span>
                <h3 className="text-sm font-black text-slate-900 leading-snug mt-3">{selectedShowroom.name}</h3>
                <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-1.5">{selectedShowroom.address}</p>
              </div>

              <div className="border-t border-slate-100 pt-3.5 mt-3.5 flex flex-wrap justify-between items-center gap-1.5 text-[10px] font-bold">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Đường dây nóng</span>
                  <a href={`tel:${selectedShowroom.phone}`} className="text-[#E30613] hover:underline mt-0.5 block font-black">{selectedShowroom.phone}</a>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Trạng thái</span>
                  <span className={`inline-block mt-0.5 font-bold ${selectedShowroom.isOpen ? "text-emerald-600" : "text-amber-600"}`}>
                    {selectedShowroom.isOpen ? "Đang mở cửa" : "Tạm đóng cửa"}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3.5 mt-3.5 flex gap-2">
                <a
                  href={`https://maps.google.com/?q=${selectedShowroom.lat},${selectedShowroom.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center rounded-lg bg-slate-900 hover:bg-slate-800 text-[10px] font-bold text-white py-2.5 transition-colors cursor-pointer shadow-sm"
                >
                  Chỉ đường
                </a>
                <Link
                  href="/dat-coc"
                  className="flex-1 text-center rounded-lg bg-[#E30613] hover:bg-[#b8040d] text-[10px] font-black text-white py-2.5 transition-colors shadow-sm"
                >
                  Đặt cọc xe máy
                </Link>
              </div>
            </div>

          </div>
        </section>

      </div>

      {/* ── Floating Toggle Switch (Mobile view only) ── */}
      <button
        id="mobile-view-toggle"
        onClick={() => setShowMobileMap(!showMobileMap)}
        className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-full px-5 py-3 text-xs font-black shadow-xl flex items-center gap-2 hover:bg-black active:scale-95 transition-all duration-200 cursor-pointer"
      >
        {showMobileMap ? (
          <>
            <svg className="h-4 w-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <span>Hiện danh sách</span>
          </>
        ) : (
          <>
            <svg className="h-4 w-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0z" />
            </svg>
            <span>Xem bản đồ</span>
          </>
        )}
      </button>

    </main>
  );
}

export default function Showrooms() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-8 h-8 border-4 border-[#E30613] border-t-transparent rounded-full" />
          <p className="text-sm font-semibold text-slate-500">Đang tải...</p>
        </div>
      </div>
    }>
      <ShowroomsContent />
    </Suspense>
  );
}
