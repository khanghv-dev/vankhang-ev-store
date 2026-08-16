"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface PartItem {
  id: string;
  name: string;
  type: "pin-sac" | "lop-banh-xe" | "den-dien" | "phu-kien";
  typeName: string;
  price: number;
  originalPrice?: number;
  image: string;
  specs: string[];
  description: string;
}

const PARTS_DATABASE: PartItem[] = [
  {
    id: "pin-lfp-48ah",
    name: "Pin LFP 48Ah cao cấp",
    type: "pin-sac",
    typeName: "Pin & Sạc",
    price: 19900000,
    originalPrice: 22000000,
    image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&auto=format&fit=crop&q=80",
    specs: ["Dung lượng 48Ah", "Chu kỳ 2000 lần", "Chống nước IP67"],
    description: "Bộ pin LFP công nghệ mới nhất của VinFast, tương thích dòng xe Feliz S và Evo200, cho độ bền và hiệu suất hoạt động cực cao.",
  },
  {
    id: "bo-sac-the-he-moi",
    name: "Bộ sạc thế hệ mới 1000W",
    type: "pin-sac",
    typeName: "Pin & Sạc",
    price: 2500000,
    image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=400&auto=format&fit=crop&q=80",
    specs: ["Công suất 1000W", "Tự ngắt khi đầy", "Sạc nhanh 4h"],
    description: "Thiết bị sạc nhanh thông minh, tự động điều chỉnh dòng sạc giúp kéo dài tuổi thọ của pin lithium-ion và LFP.",
  },
  {
    id: "lop-maxxis-feliz",
    name: "Lốp không săm Maxxis Feliz",
    type: "lop-banh-xe",
    typeName: "Lốp & Bánh xe",
    price: 850000,
    originalPrice: 950000,
    image: "https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=400&auto=format&fit=crop&q=80",
    specs: ["Kích thước 90/90-14", "Không săm", "Độ bám đường cao"],
    description: "Lốp chính hãng Maxxis sản xuất riêng cho dòng xe Feliz S, mang lại khả năng bám đường vượt trội trong điều kiện trơn trượt.",
  },
  {
    id: "den-pha-led-klara",
    name: "Cụm đèn pha LED Klara cao cấp",
    type: "den-dien",
    typeName: "Đèn & Điện",
    price: 1800000,
    image: "https://images.unsplash.com/photo-1615887023516-9b6bcd559e87?w=400&auto=format&fit=crop&q=80",
    specs: ["Công nghệ Full LED", "Tuổi thọ 30.000 giờ", "Chế độ chiếu xa/gần"],
    description: "Đèn pha thay thế chính hãng cho dòng Klara S, độ sáng cao hơn 50% so với đèn halogen thông thường.",
  },
  {
    id: "mu-bao-hiem-half-face",
    name: "Mũ bảo hiểm nửa đầu VinFast Premium",
    type: "phu-kien",
    typeName: "Phụ kiện bảo hộ",
    price: 450000,
    originalPrice: 550000,
    image: "https://images.unsplash.com/photo-1558981852-426c6c22a060?w=400&auto=format&fit=crop&q=80",
    specs: ["Chất liệu nhựa ABS", "Kính chống chói", "Chứng nhận CR"],
    description: "Mũ bảo hiểm thời trang cao cấp với tông màu logo VinFast tinh tế, bảo vệ an toàn tối đa cho mọi chuyến hành trình xanh.",
  },
];

function PartShowcase() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const typeParam = searchParams.get("type");
  const urlQ = searchParams.get("q") || searchParams.get("search") || "";

  const [searchQuery, setSearchQuery] = useState(urlQ);
  const [filteredParts, setFilteredParts] = useState<PartItem[]>(PARTS_DATABASE);

  useEffect(() => {
    let result = PARTS_DATABASE;
    if (typeParam) {
      result = result.filter((p) => p.type === typeParam);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.typeName.toLowerCase().includes(q) ||
          p.specs.some((spec) => spec.toLowerCase().includes(q))
      );
    }
    setFilteredParts(result);
  }, [typeParam, searchQuery]);

  const handleTypeSelect = (type: string | null) => {
    if (type) {
      router.push(`/phu-tung?type=${type}`);
    } else {
      router.push("/phu-tung");
    }
  };

  const tabs: { label: string; value: string | null }[] = [
    { label: "Tất cả phụ tùng", value: null },
    { label: "Pin & Sạc", value: "pin-sac" },
    { label: "Lốp & Bánh xe", value: "lop-banh-xe" },
    { label: "Đèn & Điện", value: "den-dien" },
    { label: "Phụ kiện bảo hộ", value: "phu-kien" },
  ];

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  return (
    <div className="space-y-8">
      {/* Search & Category Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-4">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const isActive = typeParam === tab.value;
            return (
              <button
                key={tab.label}
                onClick={() => handleTypeSelect(tab.value)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full transition-all duration-200 ${
                  isActive
                    ? "bg-[#E30613] text-white shadow-md shadow-red-500/10"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400 hover:text-black"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Input Box */}
        <div className="relative w-full sm:w-72">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm phụ tùng, sạc, lốp..."
            className="w-full rounded-full border border-gray-200 bg-white py-2 pl-9 pr-8 text-xs font-medium text-gray-800 placeholder-gray-400 focus:border-[#E30613] focus:outline-none focus:ring-1 focus:ring-[#E30613] shadow-sm transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-2.5 flex items-center text-gray-400 hover:text-gray-600"
              title="Xóa tìm kiếm"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Grid of Parts */}
      {filteredParts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredParts.map((part) => (
            <div
              key={part.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-red-200 hover:shadow-xl hover:shadow-red-500/5"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] w-full rounded-xl bg-neutral-50 overflow-hidden flex items-center justify-center p-4">
                <Image
                  src={part.image}
                  alt={part.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  unoptimized
                />
              </div>

              {/* Title / Type */}
              <div className="mt-4 flex-1 space-y-2">
                <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-[#E30613] ring-1 ring-red-100">
                  {part.typeName}
                </span>
                <h3 className="text-md font-bold text-gray-800 tracking-tight group-hover:text-[#E30613] transition-colors">
                  {part.name}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                  {part.description}
                </p>

                {/* Specs */}
                <div className="pt-2 flex flex-wrap gap-1.5">
                  {part.specs.map((spec, i) => (
                    <span
                      key={i}
                      className="spec-pill product-feature-tag inline-flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-md px-2.5 py-0.5 text-[12px] sm:text-[12.5px] font-semibold"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Pricing & CTA */}
              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-gray-800">
                    {formatPrice(part.price)}
                  </p>
                  {part.originalPrice && (
                    <p className="text-xs text-gray-400 line-through">
                      {formatPrice(part.originalPrice)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => alert(`Đặt mua ${part.name} thành công!`)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2 text-xs font-bold text-white transition-all duration-200 hover:bg-[#E30613] hover:scale-105 shadow-sm"
                >
                  Mua ngay
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-gray-200 rounded-2xl bg-white space-y-3">
          <p className="text-sm text-gray-500 font-medium">Không tìm thấy sản phẩm phụ tùng nào.</p>
          <button
            onClick={() => handleTypeSelect(null)}
            className="text-xs font-bold text-[#E30613] uppercase hover:underline"
          >
            Xem tất cả phụ tùng
          </button>
        </div>
      )}
    </div>
  );
}

export default function PhuTungPage() {
  return (
    <div className="bg-[var(--color-surface)] min-h-screen py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-subtle)] uppercase tracking-wider mb-8">
          <Link href="/" className="hover:text-[var(--color-primary)] transition-colors duration-200">
            Trang chủ
          </Link>
          <span>/</span>
          <span className="text-[var(--color-primary)]">Phụ tùng & Phụ kiện</span>
        </nav>

        <div className="mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary)]">
            Phụ tùng & Phụ kiện chính hãng
          </span>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[var(--color-text-base)] sm:text-4xl">
            Phụ tùng VinFast
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)] max-w-xl">
            Lựa chọn phụ tùng, phụ kiện chính hãng chất lượng cao giúp xe máy điện hoạt động êm ái, kéo dài tuổi thọ và bảo đảm an toàn trên mọi nẻo đường.
          </p>
        </div>

        <Suspense fallback={
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#E30613]"></div>
            <p className="mt-2 text-sm text-gray-500">Đang tải phụ tùng...</p>
          </div>
        }>
          <PartShowcase />
        </Suspense>
      </div>
    </div>
  );
}
