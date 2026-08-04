"use client";

import { useState } from "react";
import Link from "next/link";

interface RentalPlan {
  name: string;
  price: number;
  limit: string;
  surcharge: string;
  suitable: string;
  isPopular: boolean;
  perks: string[];
}

const PLANS: RentalPlan[] = [
  {
    name: "GÓI LINH HOẠT",
    price: 190000,
    limit: "Quãng đường dưới 500 km / tháng",
    surcharge: "250đ / km phụ trội khi vượt ngưỡng",
    suitable: "Phù hợp cho khách hàng di chuyển ít, đi học hoặc đi làm cự ly gần hàng ngày.",
    isPopular: false,
    perks: [
      "Tiết kiệm chi phí vận hành tối đa",
      "Bảo dưỡng định kỳ pin miễn phí",
      "Thay thế pin lỗi, chai hỏng hoàn toàn miễn phí",
    ],
  },
  {
    name: "GÓI CỐ ĐỊNH",
    price: 350000,
    limit: "Không giới hạn số kilomet di chuyển",
    surcharge: "Không phát sinh chi phí phụ trội",
    suitable:
      "Phù hợp cho người di chuyển nhiều, thường xuyên đi phượt hoặc kinh doanh dịch vụ giao vận.",
    isPopular: true,
    perks: [
      "Thoải mái đi lại không lo giới hạn km",
      "Ưu tiên đổi pin nhanh tại trạm sạc công cộng",
      "Hỗ trợ bảo hành pin LFP trọn đời xe",
    ],
  },
];

interface Station {
  id: string;
  name: string;
  address: string;
  province: string;
  district: string;
  status: "Hoạt động" | "Bảo trì" | "Đầy tải";
  batteryFull: number;
  batteryTotal: number;
  hours: string;
  distance: string;
}

const STATIONS: Station[] = [
  { id: "HN-001", name: "Trạm VinFast Cầu Giấy", address: "17 Trần Duy Hưng", province: "Hà Nội", district: "Cầu Giấy", status: "Hoạt động", batteryFull: 18, batteryTotal: 24, hours: "06:00 – 22:00", distance: "1.2 km" },
  { id: "HN-002", name: "Trạm VinFast Hoàn Kiếm", address: "5 Đinh Tiên Hoàng", province: "Hà Nội", district: "Hoàn Kiếm", status: "Hoạt động", batteryFull: 6, batteryTotal: 20, hours: "00:00 – 24:00", distance: "3.4 km" },
  { id: "HN-003", name: "Trạm VinFast Đống Đa", address: "62 Phạm Ngọc Thạch", province: "Hà Nội", district: "Đống Đa", status: "Đầy tải", batteryFull: 0, batteryTotal: 16, hours: "07:00 – 21:00", distance: "2.8 km" },
  { id: "HN-004", name: "Trạm VinFast Hai Bà Trưng", address: "105 Bà Triệu", province: "Hà Nội", district: "Hai Bà Trưng", status: "Hoạt động", batteryFull: 14, batteryTotal: 20, hours: "00:00 – 24:00", distance: "4.1 km" },
  { id: "HN-005", name: "Trạm VinFast Tây Hồ", address: "30 Xuân La, Tây Hồ", province: "Hà Nội", district: "Tây Hồ", status: "Bảo trì", batteryFull: 0, batteryTotal: 12, hours: "08:00 – 20:00", distance: "6.7 km" },
  { id: "HCM-001", name: "Trạm VinFast Quận 1", address: "10 Nguyễn Huệ, Q.1", province: "TP. HCM", district: "Quận 1", status: "Hoạt động", batteryFull: 22, batteryTotal: 24, hours: "00:00 – 24:00", distance: "0.5 km" },
  { id: "HCM-002", name: "Trạm VinFast Bình Thạnh", address: "120 Đinh Bộ Lĩnh", province: "TP. HCM", district: "Bình Thạnh", status: "Hoạt động", batteryFull: 9, batteryTotal: 20, hours: "06:00 – 23:00", distance: "3.2 km" },
  { id: "HCM-003", name: "Trạm VinFast Gò Vấp", address: "45 Quang Trung, Gò Vấp", province: "TP. HCM", district: "Gò Vấp", status: "Hoạt động", batteryFull: 16, batteryTotal: 20, hours: "06:00 – 22:00", distance: "7.4 km" },
  { id: "HCM-004", name: "Trạm VinFast Quận 7", address: "88 Nguyễn Thị Thập", province: "TP. HCM", district: "Quận 7", status: "Đầy tải", batteryFull: 0, batteryTotal: 16, hours: "07:00 – 21:00", distance: "9.1 km" },
  { id: "DN-001", name: "Trạm VinFast Hải Châu", address: "85 Trần Phú, Đà Nẵng", province: "Đà Nẵng", district: "Hải Châu", status: "Hoạt động", batteryFull: 11, batteryTotal: 16, hours: "06:00 – 22:00", distance: "2.0 km" },
  { id: "DN-002", name: "Trạm VinFast Sơn Trà", address: "17 Mỹ An, Sơn Trà", province: "Đà Nẵng", district: "Sơn Trà", status: "Hoạt động", batteryFull: 7, batteryTotal: 12, hours: "07:00 – 21:00", distance: "5.3 km" },
  { id: "CT-001", name: "Trạm VinFast Ninh Kiều", address: "12 Phan Đình Phùng", province: "Cần Thơ", district: "Ninh Kiều", status: "Hoạt động", batteryFull: 10, batteryTotal: 16, hours: "06:00 – 22:00", distance: "1.8 km" },
];

const PROVINCES = ["Tất cả", "Hà Nội", "TP. HCM", "Đà Nẵng", "Cần Thơ"];
const STATUS_FILTERS = ["Tất cả", "Hoạt động", "Bảo trì", "Đầy tải"];

function BatteryBar({ full, total }: { full: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((full / total) * 100);
  const color =
    pct >= 60 ? "bg-emerald-500" : pct >= 25 ? "bg-amber-400" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
        <span>
          {full} / {total} pin đầy
        </span>
        <span>{pct}%</span>
      </div>
    </div>
  );
}

const SWAP_STEPS = [
  {
    step: "01",
    icon: "🗺️",
    title: "Đến trạm gần nhất",
    desc: "Mở ứng dụng VinFast hoặc tra cứu bên dưới để tìm trạm đổi pin đang hoạt động gần bạn nhất trong thời gian thực.",
    accent: "from-blue-50 to-white border-blue-100",
    badge: "bg-blue-600",
  },
  {
    step: "02",
    icon: "📱",
    title: "Quét mã QR trên tủ",
    desc: "Dùng điện thoại quét mã QR hiển thị trên màn hình tủ đổi pin để ứng dụng xác thực tài khoản và mở hộc pin trống.",
    accent: "from-amber-50 to-white border-amber-100",
    badge: "bg-amber-500",
  },
  {
    step: "03",
    icon: "🔋",
    title: "Đút pin cũ, nhận pin mới",
    desc: "Đặt viên pin cạn vào hộc sạc trống. Hệ thống tự động đẩy một viên pin LFP đã sạc đầy 100% ra hộc tiếp nhận.",
    accent: "from-emerald-50 to-white border-emerald-100",
    badge: "bg-emerald-600",
  },
];

export default function BatteryRentalPolicy() {
  const [selectedPlan, setSelectedPlan] = useState<string>("GÓI CỐ ĐỊNH");
  const [provinceFilter, setProvinceFilter] = useState("Tất cả");
  const [districtFilter, setDistrictFilter] = useState("Tất cả");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");

  const availableDistricts = [
    "Tất cả",
    ...Array.from(
      new Set(
        STATIONS.filter(
          (s) => provinceFilter === "Tất cả" || s.province === provinceFilter
        ).map((s) => s.district)
      )
    ),
  ];

  const filteredStations = STATIONS.filter((s) => {
    const matchProvince =
      provinceFilter === "Tất cả" || s.province === provinceFilter;
    const matchDistrict =
      districtFilter === "Tất cả" || s.district === districtFilter;
    const matchStatus =
      statusFilter === "Tất cả" || s.status === statusFilter;
    const matchSearch =
      searchQuery.trim() === "" ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchProvince && matchDistrict && matchStatus && matchSearch;
  });

  const statusBadgeClass = (status: Station["status"]) => {
    if (status === "Hoạt động")
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (status === "Bảo trì")
      return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-red-50 text-red-700 border-red-200";
  };

  const statusDot = (status: Station["status"]) => {
    if (status === "Hoạt động") return "bg-emerald-500";
    if (status === "Bảo trì") return "bg-amber-400";
    return "bg-red-500";
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl bg-white font-sans">

      {/* Breadcrumbs */}
      <nav className="mb-6 flex" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <li>
            <Link href="/" className="hover:text-[#E30613] transition-colors">
              Trang chủ
            </Link>
          </li>
          <li className="flex items-center gap-1.5">
            <svg
              className="h-3 w-3 text-slate-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
            <Link
              href="/ho-tro"
              className="hover:text-[#E30613] transition-colors"
            >
              Hỗ trợ
            </Link>
          </li>
          <li className="flex items-center gap-1.5">
            <svg
              className="h-3 w-3 text-slate-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
            <span className="text-slate-500 font-medium">
              Chính sách thuê &amp; đổi pin
            </span>
          </li>
        </ol>
      </nav>

      {/* Main Title */}
      <header className="mb-10 space-y-3">
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none uppercase">
          Chính Sách Thuê Pin &amp; Gói Cước Xe Máy Điện
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 font-semibold uppercase tracking-wider">
          Tối ưu chi phí vận hành phương tiện với giải pháp thuê pin LFP thông
          minh từ VinFast
        </p>
      </header>

      {/* Rental Plan Cards */}
      <section
        aria-label="Các gói cước thuê pin"
        className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10"
      >
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`bg-white rounded-3xl border p-6 sm:p-8 flex flex-col justify-between relative transition-all duration-300 hover:shadow-lg ${
              plan.isPopular
                ? "border-[#E30613] shadow-md shadow-red-50/50"
                : "border-slate-200"
            }`}
          >
            {plan.isPopular && (
              <span className="absolute top-4 right-4 bg-[#E30613] text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider">
                Khuyên dùng
              </span>
            )}

            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {plan.name}
                </h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-950">
                    {plan.price.toLocaleString("vi-VN")}đ
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    / tháng
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5 space-y-3.5 text-xs font-semibold text-slate-600">
                <div className="flex gap-2 items-center">
                  <span className="text-emerald-500 text-sm">✓</span>
                  <span>{plan.limit}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-emerald-500 text-sm">✓</span>
                  <span className="text-slate-900 font-bold">
                    {plan.surcharge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  {plan.suitable}
                </p>

                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Tiện ích đi kèm:
                  </span>
                  {plan.perks.map((perk, i) => (
                    <div
                      key={i}
                      className="flex gap-2 items-start text-[11px] text-slate-500 font-bold"
                    >
                      <span className="text-red-500 shrink-0">•</span>
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedPlan(plan.name)}
              className={`w-full rounded-2xl text-xs font-black uppercase text-center py-3.5 mt-8 transition-all border-2 cursor-pointer ${
                selectedPlan === plan.name
                  ? "bg-[#E30613] border-[#E30613] text-white shadow-md"
                  : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
              }`}
            >
              {selectedPlan === plan.name ? "Đang chọn gói này" : "Đăng ký gói"}
            </button>
          </div>
        ))}
      </section>

      {/* Deposit Warning */}
      <section aria-label="Quy định đặt cọc pin" className="mb-16">
        <div className="bg-red-50 p-5 rounded-2xl border-l-4 border-red-600 shadow-sm">
          <div className="flex gap-3.5 items-start">
            <span className="text-lg leading-none shrink-0 mt-0.5">⚠️</span>
            <div className="space-y-1.5">
              <span className="font-black uppercase tracking-wider text-red-800 text-xs block">
                Quy định đặt cọc pin ban đầu
              </span>
              <p className="text-xs font-semibold text-red-900/90 leading-relaxed">
                Chi phí đặt cọc pin ban đầu là{" "}
                <span className="font-black text-red-700">
                  2.000.000đ / viên pin
                </span>
                . Số tiền ký quỹ đặt cọc này sẽ được hoàn trả lại 100% cho
                khách hàng sau khi chấm dứt hợp đồng dịch vụ thuê pin và bàn
                trả lại cụm pin nguyên vẹn tại các đại lý ủy quyền của VinFast.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Battery Swap 3-Step Process */}
      <section
        aria-label="Quy trình đổi pin tại trạm sạc"
        className="mb-16"
      >
        <div className="space-y-1.5 mb-8 text-center">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-tight">
            Quy Trình Đổi Pin Nhanh — Chỉ 3 Phút
          </h2>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Đổi pin cạn lấy pin đầy với hệ thống tủ sạc thông minh phủ sóng
            toàn quốc
          </p>
        </div>

        <div className="relative">
          {/* Decorative connecting line on desktop */}
          <div className="hidden lg:block absolute top-10 left-[calc(16.67%)] right-[calc(16.67%)] h-0.5 bg-gradient-to-r from-slate-200 via-[#E30613]/30 to-slate-200 z-0" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
            {SWAP_STEPS.map((item) => (
              <div
                key={item.step}
                className={`bg-gradient-to-b ${item.accent} border rounded-3xl p-6 flex flex-col items-center text-center gap-4 shadow-sm hover:shadow-md transition-shadow`}
              >
                <div
                  className={`w-8 h-8 rounded-full ${item.badge} text-white text-[11px] font-black flex items-center justify-center tracking-widest`}
                >
                  {item.step}
                </div>
                <span className="text-4xl leading-none">{item.icon}</span>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  {item.title}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl p-4">
          <span className="text-base">⚡</span>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
            Toàn bộ quy trình hoàn tất trong vòng{" "}
            <span className="text-[#E30613] font-black">dưới 3 phút</span> —
            nhanh hơn đổ xăng
          </p>
        </div>
      </section>

      {/* Real-time Station Finder */}
      <section aria-label="Tra cứu trạm đổi pin" className="space-y-6 pb-12">
        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-tight">
            Tra Cứu Trạm Đổi Pin Real-time
          </h2>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Kiểm tra số lượng pin đầy sẵn có tại từng trạm trước khi di chuyển
          </p>
        </div>

        {/* Filter Bar */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
              Tìm kiếm
            </label>
            <div className="relative">
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
              <input
                id="station-search"
                type="text"
                placeholder="Tên trạm, địa chỉ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#E30613]/30 focus:border-[#E30613] transition-all"
              />
            </div>
          </div>

          {/* Province */}
          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
              Tỉnh / Thành phố
            </label>
            <select
              id="province-filter"
              value={provinceFilter}
              onChange={(e) => {
                setProvinceFilter(e.target.value);
                setDistrictFilter("Tất cả");
              }}
              className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#E30613]/30 focus:border-[#E30613] transition-all cursor-pointer"
            >
              {PROVINCES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* District */}
          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
              Quận / Huyện
            </label>
            <select
              id="district-filter"
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#E30613]/30 focus:border-[#E30613] transition-all cursor-pointer"
            >
              {availableDistricts.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
              Trạng thái
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#E30613]/30 focus:border-[#E30613] transition-all cursor-pointer"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results count + legend */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Hiển thị{" "}
            <span className="text-slate-900">{filteredStations.length}</span>{" "}
            trạm
          </p>
          <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-wider text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Hoạt động
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              Bảo trì
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              Đầy tải
            </span>
          </div>
        </div>

        {/* Station Grid */}
        {filteredStations.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-200 rounded-3xl">
            <span className="text-4xl block mb-4">🔍</span>
            <p className="text-sm font-bold text-slate-500">
              Không tìm thấy trạm phù hợp
            </p>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStations.map((station) => (
              <div
                key={station.id}
                className={`bg-white border rounded-2xl p-5 space-y-4 hover:shadow-md transition-all duration-200 ${
                  station.status === "Bảo trì"
                    ? "opacity-70 border-amber-200"
                    : station.status === "Đầy tải"
                    ? "border-red-200"
                    : "border-slate-200"
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <h3 className="text-xs font-black text-slate-900 leading-snug truncate">
                      {station.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold truncate">
                      {station.address}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center gap-1 border text-[9px] font-black uppercase px-2 py-1 rounded-lg ${statusBadgeClass(
                      station.status
                    )}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${statusDot(
                        station.status
                      )}`}
                    />
                    {station.status}
                  </span>
                </div>

                {/* Battery bar */}
                <BatteryBar
                  full={station.batteryFull}
                  total={station.batteryTotal}
                />

                {/* Meta */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-300 block">
                      Giờ hoạt động
                    </span>
                    <span className="text-[10px] font-bold text-slate-600">
                      {station.hours}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-300 block">
                      Khoảng cách
                    </span>
                    <span className="text-[10px] font-bold text-slate-600">
                      {station.distance}
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(
                    station.address
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block w-full text-center rounded-xl text-[10px] font-black uppercase py-2.5 tracking-wider transition-all ${
                    station.status === "Hoạt động"
                      ? "bg-slate-900 hover:bg-[#E30613] text-white"
                      : "bg-slate-100 text-slate-400 pointer-events-none"
                  }`}
                >
                  {station.status === "Hoạt động"
                    ? "Xem trên bản đồ →"
                    : "Không khả dụng"}
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 items-start">
          <span className="text-base shrink-0 mt-0.5">ℹ️</span>
          <p className="text-[10.5px] text-blue-800 font-semibold leading-relaxed">
            Số lượng pin đầy tại mỗi trạm được cập nhật{" "}
            <strong>mỗi 5 phút</strong> từ hệ thống IoT thực tế. Dữ liệu mang
            tính tham khảo, có thể thay đổi tùy thời điểm. Để tra cứu chính
            xác nhất, vui lòng sử dụng ứng dụng <strong>VinFast</strong> trên
            điện thoại.
          </p>
        </div>
      </section>
    </main>
  );
}
