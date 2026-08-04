"use client";

import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

// ─── Data ───────────────────────────────────────────────────────────────────

interface MegaCategory {
  heading: string;
  href: string;
  icon: React.ReactNode;
  items: { label: string; href: string; badge?: string; sub?: string }[];
}

const megaCategories: MegaCategory[] = [
  {
    heading: "Xe máy điện",
    href: "/products?category=xe-may-dien",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
      </svg>
    ),
    items: [
      { label: "VinFast Evo200", href: "/products/vinfast-evo200", sub: "Pin LFP · 205 km / sạc", badge: "Mới" },
      { label: "VinFast Feliz S", href: "/products/vinfast-feliz-s", sub: "Pin LFP · 198 km / sạc" },
      { label: "VinFast Vento S", href: "/products/vinfast-vento-s", sub: "Pin LFP · 220 km / sạc", badge: "Hot" },
      { label: "VinFast Klara S", href: "/products/vinfast-klara-s", sub: "Pin LFP · 194 km / sạc" },
      { label: "VinFast Impes",   href: "/products/vinfast-impes",   sub: "Pin Li-ion · 70 km / sạc" },
    ],
  },
  {
    heading: "Xe máy 50cc",
    href: "/products?category=xe-50cc",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
    items: [
      { label: "VinFast Ludo",    href: "/products?category=xe-50cc",    sub: "Động cơ 49.5cc · Tiết kiệm" },
      { label: "VinFast Theon S", href: "/products?category=xe-50cc",    sub: "Động cơ 49.5cc · Thể thao" },
      { label: "VinFast Zipp",    href: "/products?category=xe-50cc",    sub: "Động cơ 49.5cc · Năng động" },
    ],
  },
  {
    heading: "Phụ tùng & Phụ kiện",
    href: "/phu-tung",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l5.654-4.654m5.896-3.054a1.5 1.5 0 0 0-2.121 2.121" />
      </svg>
    ),
    items: [
      { label: "Pin & Sạc",       href: "/phu-tung?type=pin-sac",     sub: "Chính hãng VinFast" },
      { label: "Lốp & Bánh xe",   href: "/phu-tung?type=lop-banh-xe", sub: "Đủ kích cỡ, giá tốt" },
      { label: "Đèn & Điện",      href: "/phu-tung?type=den-dien",    sub: "LED, đèn pha, xi nhan" },
      { label: "Phụ kiện bảo hộ", href: "/phu-tung?type=phu-kien",    sub: "Mũ, găng tay, áo giáp" },
    ],
  },
];

interface NavItem {
  label: string;
  href: string;
  hasMega?: boolean;
  hasNewsDropdown?: boolean;
  hasSupportDropdown?: boolean;
  hasShowroomDropdown?: boolean;
  children?: { label: string; href: string; badge?: string }[];
}

const navItems: NavItem[] = [
  { label: "Sản phẩm", href: "#", hasMega: true },
  { label: "Showroom", href: "/showroom", hasShowroomDropdown: true },
  { label: "Tin tức",  href: "/tin-tuc", hasNewsDropdown: true },
  { label: "Hỗ trợ",  href: "/ho-tro", hasSupportDropdown: true },
];

// ─── Mega Menu Panel ────────────────────────────────────────────────────────
function MegaMenuPanel() {
  return (
    <div className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 translate-y-1 group-hover:translate-y-0">
      <div className="w-[720px] rounded-xl border border-gray-100 bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/60 px-6 py-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#E30613]">
            Danh mục sản phẩm
          </span>
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 transition-colors hover:text-[#E30613]"
          >
            Xem tất cả
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
        <div className="grid grid-cols-3 divide-x divide-gray-100 p-2">
          {megaCategories.map((cat) => (
            <div key={cat.heading} className="px-3 py-3">
              <Link
                href={cat.href}
                className="mb-3 flex items-center gap-2 px-2 hover:opacity-80 transition-opacity"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-red-50 text-[#E30613]">
                  {cat.icon}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700 hover:text-[#E30613] transition-colors">
                  {cat.heading}
                </span>
              </Link>
              <ul className="space-y-0.5">
                {cat.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="group/item flex items-start justify-between rounded-lg px-2 py-2 transition-colors hover:bg-gray-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800 transition-colors group-hover/item:text-[#E30613]">
                          {item.label}
                        </p>
                        {item.sub && (
                          <p className="mt-0.5 text-[11px] text-gray-400">{item.sub}</p>
                        )}
                      </div>
                      {item.badge && (
                        <span className="ml-2 mt-0.5 shrink-0 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-[#E30613] ring-1 ring-red-100">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 bg-gray-50/60 px-6 py-3">
          <Link
            href="/dat-coc"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 transition-colors hover:text-[#E30613]"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Đặt cọc trực tuyến ngay hôm nay — Nhanh chóng &amp; An toàn
          </Link>
        </div>
      </div>
    </div>
  );
}

interface NewsArticle {
  title: string;
  href: string;
  image: string;
  date: string;
  category: string;
}

const newsArticles: NewsArticle[] = [
  {
    title: "VinFast Evo200 LFP thế hệ mới: Đột phá cự ly di chuyển lên đến 205 km",
    href: "/tin-tuc/evo200-lfp",
    image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=150&auto=format&fit=crop&q=80",
    date: "15/06/2026",
    category: "Sản phẩm",
  },
  {
    title: "Hạ tầng trạm sạc VinFast phủ sóng rộng khắp 63 tỉnh thành cả nước",
    href: "/tin-tuc/tram-sac-toan-quoc",
    image: "https://images.unsplash.com/photo-1563720223185-11003d516935?w=150&auto=format&fit=crop&q=80",
    date: "12/06/2026",
    category: "Hạ tầng",
  },
  {
    title: "Chương trình đặt cọc sớm Feliz S nhận voucher phụ kiện trị giá 2 triệu đồng",
    href: "/tin-tuc/uu-dai-feliz-s",
    image: "https://images.unsplash.com/photo-1558981852-426c6c22a060?w=150&auto=format&fit=crop&q=80",
    date: "10/06/2026",
    category: "Ưu đãi",
  },
];

function NewsDropdownPanel() {
  return (
    <div className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 translate-y-1 group-hover:translate-y-0">
      <div className="w-[420px] rounded-xl border border-gray-100 bg-white p-4 shadow-xl">
        <div className="mb-3 border-b border-gray-100 pb-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#E30613]">
            Tin tức mới nhất
          </span>
        </div>
        <div className="space-y-3">
          {newsArticles.map((article, idx) => (
            <Link
              key={idx}
              href={article.href}
              className="group/article flex gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
            >
              <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md bg-gray-100">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  sizes="96px"
                  className="object-cover transition-transform duration-300 group-hover/article:scale-105"
                  unoptimized
                />
                <span className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white tracking-wider uppercase leading-none">
                  {article.category}
                </span>
              </div>
              <div className="flex flex-col justify-between py-0.5 flex-1">
                <h4 className="line-clamp-2 text-xs font-bold leading-normal text-gray-800 transition-colors group-hover/article:text-[#E30613]">
                  {article.title}
                </h4>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                  <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                  <span>{article.date}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-3 border-t border-gray-100 pt-3 text-center">
          <Link
            href="/tin-tuc"
            className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-[#E30613] hover:underline transition-colors decoration-2 underline-offset-4"
          >
            Xem tất cả tin tức
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

function SupportDropdownPanel() {
  return (
    <div className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 translate-y-1 group-hover:translate-y-0">
      <div className="w-[360px] rounded-xl border border-gray-100 bg-white shadow-xl overflow-hidden">
        <div className="p-2.5 space-y-1 bg-white">
          <Link
            href="/ho-tro/bao-hanh"
            className="group/item flex items-center gap-3.5 rounded-lg px-3.5 py-3 transition-all duration-200 hover:bg-gray-50"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#E30613] transition-colors group-hover/item:bg-[#E30613] group-hover/item:text-white">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l5.654-4.654m5.896-3.054a1.5 1.5 0 0 0-2.121 2.121" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 transition-colors group-hover/item:text-[#E30613]">
                Trung tâm bảo hành &amp; sửa chữa
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">Đặt lịch hẹn, dịch vụ sửa chữa lưu động</p>
            </div>
          </Link>

          <Link
            href="/ho-tro/mua-hang-tra-gop"
            className="group/item flex items-center gap-3.5 rounded-lg px-3.5 py-3 transition-all duration-200 hover:bg-gray-50"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#E30613] transition-colors group-hover/item:bg-[#E30613] group-hover/item:text-white">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <line x1="7" y1="15" x2="7.01" y2="15" strokeWidth={3} strokeLinecap="round" />
                <line x1="11" y1="15" x2="13" y2="15" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 transition-colors group-hover/item:text-[#E30613]">
                Hướng dẫn mua hàng &amp; trả góp
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">Thủ tục trả góp, lãi suất 0%, chính sách thanh toán</p>
            </div>
          </Link>

          <Link
            href="/ho-tro/thue-doi-pin"
            className="group/item flex items-center gap-3.5 rounded-lg px-3.5 py-3 transition-all duration-200 hover:bg-gray-50"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#E30613] transition-colors group-hover/item:bg-[#E30613] group-hover/item:text-white">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25v7.5A2.25 2.25 0 0 1 18.75 18H5.25A2.25 2.25 0 0 1 3 15.75v-7.5A2.25 2.25 0 0 1 5.25 6h13.5A2.25 2.25 0 0 1 21 8.25zM22.5 10.5v3" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9.75v4.5m3.75-4.5v4.5m3.75-4.5v4.5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 transition-colors group-hover/item:text-[#E30613]">
                Chính sách thuê &amp; đổi pin
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">Các gói thuê pin, địa điểm đổi pin trên toàn quốc</p>
            </div>
          </Link>

          <Link
            href="/ho-tro/tra-cuu"
            className="group/item flex items-center gap-3.5 rounded-lg px-3.5 py-3 transition-all duration-200 hover:bg-gray-50"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#E30613] transition-colors group-hover/item:bg-[#E30613] group-hover/item:text-white">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 transition-colors group-hover/item:text-[#E30613]">
                Tra cứu lịch sử sửa chữa/bảo hành
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">Theo dõi lịch sử bảo dưỡng &amp; tiến độ sửa chữa xe</p>
            </div>
          </Link>
        </div>

        {/* Rescue Hotline Footer block */}
        <div className="border-t border-gray-100 bg-gray-50 p-4">
          <a
            href="tel:1900232389"
            className="flex items-center justify-between rounded-xl border border-red-100 bg-white p-3 hover:bg-red-50/30 transition-colors duration-200 group/hotline"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-[#E30613] group-hover/hotline:animate-pulse">
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.802-5.14-4.117-6.94-6.94l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Cứu hộ 24/7</span>
                <span className="text-[11px] text-gray-500 font-medium leading-none mt-0.5">Gọi ngay khi gặp sự cố</span>
              </div>
            </div>
            <span className="text-sm font-black text-[#E30613] tracking-wide">1900 2323 89</span>
          </a>
        </div>
      </div>
    </div>
  );
}

function ShowroomDropdownPanel() {
  return (
    <div className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 translate-y-1 group-hover:translate-y-0">
      <div className="w-[450px] rounded-xl border border-gray-100 bg-white shadow-xl overflow-hidden">
        <div className="grid grid-cols-3 gap-4 p-5 bg-white">
          {/* Column 1: Miền Bắc */}
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-2.5 px-1">
              Miền Bắc
            </span>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/showroom?region=hanoi"
                  className="block rounded px-2 py-1.5 text-xs font-bold text-gray-700 hover:text-[#E30613] hover:bg-gray-50 transition-all"
                >
                  Hà Nội
                </Link>
              </li>
              <li>
                <Link
                  href="/showroom?region=haiphong"
                  className="block rounded px-2 py-1.5 text-xs font-bold text-gray-700 hover:text-[#E30613] hover:bg-gray-50 transition-all"
                >
                  Hải Phòng
                </Link>
              </li>
              <li>
                <Link
                  href="/showroom?region=quangninh"
                  className="block rounded px-2 py-1.5 text-xs font-bold text-gray-700 hover:text-[#E30613] hover:bg-gray-50 transition-all"
                >
                  Quảng Ninh
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Miền Trung */}
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-2.5 px-1">
              Miền Trung
            </span>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/showroom?region=danang"
                  className="block rounded px-2 py-1.5 text-xs font-bold text-gray-700 hover:text-[#E30613] hover:bg-gray-50 transition-all"
                >
                  Đà Nẵng
                </Link>
              </li>
              <li>
                <Link
                  href="/showroom?region=nghean"
                  className="block rounded px-2 py-1.5 text-xs font-bold text-gray-700 hover:text-[#E30613] hover:bg-gray-50 transition-all"
                >
                  Nghệ An
                </Link>
              </li>
              <li>
                <Link
                  href="/showroom?region=khanhhoa"
                  className="block rounded px-2 py-1.5 text-xs font-bold text-gray-700 hover:text-[#E30613] hover:bg-gray-50 transition-all"
                >
                  Khánh Hòa
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Miền Nam */}
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-2.5 px-1">
              Miền Nam
            </span>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/showroom?region=hcm"
                  className="block rounded px-2 py-1.5 text-xs font-bold text-gray-700 hover:text-[#E30613] hover:bg-gray-50 transition-all"
                >
                  TP. Hồ Chí Minh
                </Link>
              </li>
              <li>
                <Link
                  href="/showroom?region=binhduong"
                  className="block rounded px-2 py-1.5 text-xs font-bold text-gray-700 hover:text-[#E30613] hover:bg-gray-50 transition-all"
                >
                  Bình Dương
                </Link>
              </li>
              <li>
                <Link
                  href="/showroom?region=cantho"
                  className="block rounded px-2 py-1.5 text-xs font-bold text-gray-700 hover:text-[#E30613] hover:bg-gray-50 transition-all"
                >
                  Cần Thơ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Search Input footer block */}
        <div className="border-t border-gray-100 bg-gray-50 p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Nhập vị trí của bạn..."
              className="w-full bg-white border border-gray-200 rounded-lg pl-3.5 pr-9 py-2 text-xs outline-none focus:border-[#E30613] transition-all font-medium text-gray-700 placeholder:text-gray-400"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Simple dropdown (for non-mega items with children) ─────────────────────
function NavDropdown({
  items,
}: {
  items: { label: string; href: string; badge?: string }[];
}) {
  return (
    <div className="absolute left-1/2 top-full z-50 mt-2 w-48 -translate-x-1/2 rounded-xl border border-gray-100 bg-white shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 translate-y-1 group-hover:translate-y-0">
      <div className="p-1.5">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-[#E30613]"
          >
            {item.label}
            {item.badge && (
              <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-[#E30613]">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Mobile nav item ────────────────────────────────────────────────────────
function MobileNavItem({
  item,
  onClose,
}: {
  item: NavItem;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(false);

  if (item.hasMega) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between px-4 py-3 text-base font-medium text-gray-800 transition-colors hover:text-[#E30613]"
          aria-expanded={open}
        >
          {item.label}
          <svg
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {open && (
          <div className="bg-gray-50 border-t border-gray-100">
            {megaCategories.map((cat) => (
              <div key={cat.heading} className="border-b border-gray-100 last:border-0">
                <p className="flex items-center gap-2 px-6 py-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-red-50 text-[#E30613]">
                    {cat.icon}
                  </span>
                  {cat.heading}
                </p>
                {cat.items.map((child) => (
                  <Link
                    key={child.label}
                    href={child.href}
                    onClick={onClose}
                    className="flex items-center justify-between px-8 py-2 text-sm text-gray-600 transition-colors hover:text-[#E30613]"
                  >
                    {child.label}
                    {child.badge && (
                      <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-[#E30613]">
                        {child.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (item.hasShowroomDropdown) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between px-4 py-3 text-base font-medium text-gray-800 transition-colors hover:text-[#E30613]"
          aria-expanded={open}
        >
          {item.label}
          <svg
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {open && (
          <div className="bg-gray-50 border-t border-gray-100 p-3 space-y-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-2 mb-1">Miền Bắc</p>
              <div className="grid grid-cols-3 gap-1">
                <Link href="/showroom?region=hanoi" onClick={onClose} className="rounded bg-white p-2 text-center text-xs font-bold text-gray-700 shadow-sm border border-gray-100 hover:text-[#E30613] transition-all">Hà Nội</Link>
                <Link href="/showroom?region=haiphong" onClick={onClose} className="rounded bg-white p-2 text-center text-xs font-bold text-gray-700 shadow-sm border border-gray-100 hover:text-[#E30613] transition-all">Hải Phòng</Link>
                <Link href="/showroom?region=quangninh" onClick={onClose} className="rounded bg-white p-2 text-center text-xs font-bold text-gray-700 shadow-sm border border-gray-100 hover:text-[#E30613] transition-all">Quảng Ninh</Link>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-2 mb-1">Miền Trung</p>
              <div className="grid grid-cols-3 gap-1">
                <Link href="/showroom?region=danang" onClick={onClose} className="rounded bg-white p-2 text-center text-xs font-bold text-gray-700 shadow-sm border border-gray-100 hover:text-[#E30613] transition-all">Đà Nẵng</Link>
                <Link href="/showroom?region=nghean" onClick={onClose} className="rounded bg-white p-2 text-center text-xs font-bold text-gray-700 shadow-sm border border-gray-100 hover:text-[#E30613] transition-all">Nghệ An</Link>
                <Link href="/showroom?region=khanhhoa" onClick={onClose} className="rounded bg-white p-2 text-center text-xs font-bold text-gray-700 shadow-sm border border-gray-100 hover:text-[#E30613] transition-all">Khánh Hòa</Link>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-2 mb-1">Miền Nam</p>
              <div className="grid grid-cols-3 gap-1">
                <Link href="/showroom?region=hcm" onClick={onClose} className="rounded bg-white p-2 text-center text-xs font-bold text-gray-700 shadow-sm border border-gray-100 hover:text-[#E30613] transition-all">TP. HCM</Link>
                <Link href="/showroom?region=binhduong" onClick={onClose} className="rounded bg-white p-2 text-center text-xs font-bold text-gray-700 shadow-sm border border-gray-100 hover:text-[#E30613] transition-all">Bình Dương</Link>
                <Link href="/showroom?region=cantho" onClick={onClose} className="rounded bg-white p-2 text-center text-xs font-bold text-gray-700 shadow-sm border border-gray-100 hover:text-[#E30613] transition-all">Cần Thơ</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (item.hasSupportDropdown) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between px-4 py-3 text-base font-medium text-gray-800 transition-colors hover:text-[#E30613]"
          aria-expanded={open}
        >
          {item.label}
          <svg
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {open && (
          <div className="bg-gray-50 border-t border-gray-100 p-3 space-y-2">
            <Link
              href="/ho-tro/bao-hanh"
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg bg-white p-2.5 border border-gray-100 shadow-sm hover:text-[#E30613] transition-colors"
            >
              <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l5.654-4.654m5.896-3.054a1.5 1.5 0 0 0-2.121 2.121" />
              </svg>
              <span className="text-xs font-bold text-gray-800">Trung tâm bảo hành &amp; sửa chữa</span>
            </Link>
            <Link
              href="/ho-tro/mua-hang-tra-gop"
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg bg-white p-2.5 border border-gray-100 shadow-sm hover:text-[#E30613] transition-colors"
            >
              <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <line x1="7" y1="15" x2="7.01" y2="15" strokeWidth={3} strokeLinecap="round" />
                <line x1="11" y1="15" x2="13" y2="15" />
              </svg>
              <span className="text-xs font-bold text-gray-800">Hướng dẫn mua hàng &amp; trả góp</span>
            </Link>
            <Link
              href="/ho-tro/thue-doi-pin"
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg bg-white p-2.5 border border-gray-100 shadow-sm hover:text-[#E30613] transition-colors"
            >
              <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25v7.5A2.25 2.25 0 0 1 18.75 18H5.25A2.25 2.25 0 0 1 3 15.75v-7.5A2.25 2.25 0 0 1 5.25 6h13.5A2.25 2.25 0 0 1 21 8.25zM22.5 10.5v3" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9.75v4.5m3.75-4.5v4.5m3.75-4.5v4.5" />
              </svg>
              <span className="text-xs font-bold text-gray-800">Chính sách thuê &amp; đổi pin</span>
            </Link>
            <Link
              href="/ho-tro/tra-cuu"
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg bg-white p-2.5 border border-gray-100 shadow-sm hover:text-[#E30613] transition-colors"
            >
              <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
              </svg>
              <span className="text-xs font-bold text-gray-800">Tra cứu lịch sử sửa chữa/bảo hành</span>
            </Link>
            <a
              href="tel:1900232389"
              className="flex items-center justify-between rounded-lg bg-gray-100 p-3 shadow-inner hover:bg-gray-200 transition-colors"
            >
              <span className="text-[10px] uppercase font-bold text-gray-500">Hotline 24/7</span>
              <span className="text-xs font-black text-[#E30613]">1900 2323 89</span>
            </a>
          </div>
        )}
      </div>
    );
  }

  if (item.hasNewsDropdown) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between px-4 py-3 text-base font-medium text-gray-800 transition-colors hover:text-[#E30613]"
          aria-expanded={open}
        >
          {item.label}
          <svg
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {open && (
          <div className="bg-gray-50 border-t border-gray-100 p-3 space-y-3">
            {newsArticles.map((article, idx) => (
              <Link
                key={idx}
                href={article.href}
                onClick={onClose}
                className="flex gap-3 rounded-lg bg-white p-2 border border-gray-100 shadow-sm"
              >
                <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-md bg-gray-100">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    sizes="80px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex flex-col justify-between py-0.5 flex-1">
                  <h4 className="line-clamp-2 text-xs font-bold leading-snug text-gray-800">
                    {article.title}
                  </h4>
                  <span className="text-[9px] text-gray-400 font-medium">{article.date}</span>
                </div>
              </Link>
            ))}
            <div className="text-center pt-1">
              <Link
                href="/tin-tuc"
                onClick={onClose}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#E30613] hover:underline"
              >
                Xem tất cả tin tức
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between px-4 py-3 text-base font-medium text-gray-800 transition-colors hover:text-[#E30613]"
          aria-expanded={open}
        >
          {item.label}
          <svg
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {open && (
          <div className="bg-gray-50 border-t border-gray-100">
            {item.children.map((child) => (
              <Link
                key={child.label}
                href={child.href}
                onClick={onClose}
                className="flex items-center justify-between px-8 py-2.5 text-sm text-gray-600 transition-colors hover:text-[#E30613]"
              >
                {child.label}
                {child.badge && (
                  <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-[#E30613]">
                    {child.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onClose}
      className="block px-4 py-3 text-base font-medium text-gray-800 transition-colors hover:text-[#E30613]"
    >
      {item.label}
    </Link>
  );
}

// ─── Main Header ────────────────────────────────────────────────────────────
export default function Header() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(765); // 12m 45s
  const [globalSearch, setGlobalSearch] = useState("");
  const [myOrders, setMyOrders] = useState<any[]>([]);

  useEffect(() => {
    async function fetchMyOrders() {
      try {
        const res = await fetch("http://localhost:5022/api/orders/my-orders");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setMyOrders(data);
          }
        }
      } catch (err) {
        console.error("Lỗi nạp đơn cọc Header:", err);
      }
    }
    fetchMyOrders();
  }, []);

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      router.push(`/products?q=${encodeURIComponent(globalSearch.trim())}`);
    }
  };

  const handleLogout = () => {
    try {
      logout();
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes} phút ${seconds < 10 ? "0" : ""}${seconds} giây`;
  }, [timeLeft]);

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="h-0.5 w-full bg-[#E30613]" />
      <nav
        className="bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm"
        aria-label="Điều hướng chính"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 flex-shrink-0 group/logo"
              aria-label="VinFast O2O — Trang chủ"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E30613] shadow-md transition-transform duration-200 group-hover/logo:scale-105">
                <span className="text-base font-black text-white leading-none">V</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-sm font-black text-gray-900 tracking-wide">VinFast</span>
                <span className="text-[10px] text-[#E30613] font-bold tracking-[0.2em] uppercase">O2O Platform</span>
              </div>
            </Link>

            <div className="hidden lg:flex lg:items-center lg:space-x-8">
              {navItems.map((item) => {
                if (item.hasMega) {
                  return (
                    <div key={item.label} className="relative group">
                      <button
                        className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 tracking-wide transition-colors hover:text-black group-hover:text-black"
                        aria-haspopup="true"
                      >
                        {item.label}
                        <svg
                          className="h-3.5 w-3.5 text-gray-400 transition-transform group-hover:rotate-180 duration-200 group-hover:text-[#E30613]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>
                      <MegaMenuPanel />
                    </div>
                  );
                }

                if (item.hasNewsDropdown) {
                  return (
                    <div key={item.label} className="relative group">
                      <Link
                        href={item.href}
                        className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 tracking-wide transition-colors hover:text-black group-hover:text-black"
                      >
                        {item.label}
                        <svg
                          className="h-3.5 w-3.5 text-gray-400 transition-transform group-hover:rotate-180 duration-200 group-hover:text-black"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                      </Link>
                      <NewsDropdownPanel />
                    </div>
                  );
                }

                if (item.hasSupportDropdown) {
                  return (
                    <div key={item.label} className="relative group">
                      <Link
                        href={item.href}
                        className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 tracking-wide transition-colors hover:text-black group-hover:text-black"
                      >
                        {item.label}
                        <svg
                          className="h-3.5 w-3.5 text-gray-400 transition-transform group-hover:rotate-180 duration-200 group-hover:text-black"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                      </Link>
                      <SupportDropdownPanel />
                    </div>
                  );
                }

                if (item.hasShowroomDropdown) {
                  return (
                    <div key={item.label} className="relative group">
                      <Link
                        href={item.href}
                        className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 tracking-wide transition-colors hover:text-black group-hover:text-black"
                      >
                        {item.label}
                        <svg
                          className="h-3.5 w-3.5 text-gray-400 transition-transform group-hover:rotate-180 duration-200 group-hover:text-black"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                      </Link>
                      <ShowroomDropdownPanel />
                    </div>
                  );
                }

                if (item.children) {
                  return (
                    <div key={item.label} className="relative group">
                      <button className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 tracking-wide transition-colors hover:text-black">
                        {item.label}
                        <svg
                          className="h-3.5 w-3.5 text-gray-400 transition-transform group-hover:rotate-180 duration-200"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>
                      <NavDropdown items={item.children} />
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-sm font-medium text-gray-700 tracking-wide transition-colors hover:text-black"
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="hidden lg:flex lg:items-center lg:space-x-4">
              {/* Global Search Bar */}
              <form onSubmit={handleGlobalSearch} className="relative w-44 xl:w-56">
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Tìm xe, phụ tùng..."
                  className="w-full rounded-full border border-gray-200 bg-gray-50/90 py-1.5 pl-8 pr-3 text-xs text-gray-800 placeholder-gray-400 focus:border-[#E30613] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#E30613] transition-all shadow-inner"
                />
                <button
                  type="submit"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#E30613] transition-colors"
                  title="Tìm kiếm"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
                  </svg>
                </button>
              </form>

              {isAuthenticated ? (
                <div className="relative group">
                  <button className="flex items-center justify-center h-9 w-9 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 hover:shadow-sm transition-all focus:outline-none cursor-pointer">
                    <svg className="h-4.5 w-4.5 text-gray-600 transition-colors group-hover:text-[#E30613]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                  </button>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 top-full z-50 pt-2.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 translate-y-1 group-hover:translate-y-0">
                    <div className="w-60 rounded-xl border border-gray-100 bg-white p-1.5 shadow-2xl">
                      <div className="px-3.5 py-2.5 border-b border-gray-100 mb-1.5">
                        <p className="text-xs font-bold text-gray-900">Thành viên VinFast</p>
                        <p className="text-[10px] text-gray-400 font-semibold truncate">Tài khoản cá nhân</p>
                      </div>

                      <div className="space-y-0.5">
                        <Link
                          href="/user/theo-doi-don-hang"
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-[#E30613] transition-all group/item"
                        >
                          <svg className="h-4.5 w-4.5 text-gray-400 group-hover/item:text-[#E30613] transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125a1.125 1.125 0 0 0 1.125-1.125V9.75M3.75 14.25h16.5M3.75 14.25v-4.5m0 0A2.25 2.25 0 0 1 6 7.5h7.5a2.25 2.25 0 0 1 2.25 2.25v4.5m-12 0h12" />
                          </svg>
                          <div className="flex flex-col text-left">
                            <span className="leading-tight">Theo dõi đơn hàng xe</span>
                            <span className="text-[9px] text-gray-400 font-medium leading-tight">Xem tiến độ chuẩn bị xe</span>
                          </div>
                        </Link>

                        <Link
                          href="/user/lich-su-dat-coc"
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-[#E30613] transition-all group/item"
                        >
                          <svg className="h-4.5 w-4.5 text-gray-400 group-hover/item:text-[#E30613] transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
                          </svg>
                          <div className="flex flex-col text-left">
                            <span className="leading-tight">Lịch sử đặt cọc</span>
                            <span className="text-[9px] text-gray-400 font-medium leading-tight">Quản lý các đơn cọc</span>
                          </div>
                        </Link>

                        <Link
                          href="/user/lich-su-mua-hang"
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-[#E30613] transition-all group/item"
                        >
                          <svg className="h-4.5 w-4.5 text-gray-400 group-hover/item:text-[#E30613] transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                          </svg>
                          <div className="flex flex-col text-left">
                            <span className="leading-tight">Lịch sử mua hàng</span>
                            <span className="text-[9px] text-gray-400 font-medium leading-tight">Xem hóa đơn xe</span>
                          </div>
                        </Link>

                        <Link
                          href="/user/lich-su-tra-gop"
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-[#E30613] transition-all group/item"
                        >
                          <svg className="h-4.5 w-4.5 text-gray-400 group-hover/item:text-[#E30613] transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
                          </svg>
                          <div className="flex flex-col text-left">
                            <span className="leading-tight">Lịch sử trả góp</span>
                            <span className="text-[9px] text-gray-400 font-medium leading-tight">Xem lịch đóng tiền định kỳ</span>
                          </div>
                        </Link>

                        <Link
                          href="/doi-mat-khau"
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-[#E30613] transition-all group/item"
                        >
                          <svg className="h-4.5 w-4.5 text-gray-400 group-hover/item:text-[#E30613] transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                          </svg>
                          <div className="flex flex-col text-left">
                            <span className="leading-tight">Đổi mật khẩu</span>
                            <span className="text-[9px] text-gray-400 font-medium leading-tight">Bảo mật tài khoản</span>
                          </div>
                        </Link>
                      </div>

                      <div className="border-t border-gray-100 my-1.5"></div>

                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer text-left w-full group/item"
                      >
                        <svg className="h-4.5 w-4.5 text-gray-500 group-hover/item:text-red-600 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                        </svg>
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:text-[#E30613]"
                >
                  Đăng nhập
                </Link>
              )}

              {/* Dropdown Đơn cọc của tôi */}
              <div className="relative group">
                <button
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors cursor-pointer"
                  aria-haspopup="true"
                >
                  <span>Đơn cọc của tôi</span>
                  <span className="relative inline-flex items-center justify-center bg-[#E30613] text-white text-[11px] font-bold w-5 h-5 rounded-full -top-1">
                    {myOrders.length}
                  </span>
                  <svg
                    className="h-3.5 w-3.5 text-gray-400 transition-transform group-hover:rotate-180 group-hover:text-red-600 duration-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {/* Dropdown Panel */}
                <div className="absolute right-0 top-full z-50 pt-2.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 translate-y-1 group-hover:translate-y-0">
                  <div className="w-80 rounded-2xl border border-gray-150 bg-white p-4 shadow-xl">
                    <div className="mb-3 border-b border-gray-100 pb-2 flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Đơn cọc gần đây
                      </span>
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-[#E30613]">
                        {myOrders.length} Đơn hàng
                      </span>
                    </div>

                    <div className="space-y-3">
                      {myOrders.length > 0 ? (
                        myOrders.slice(0, 3).map((item: any, idx: number) => {
                          const rawId = item.id?.value || item.id || item.orderId || "";
                          const idStr = typeof rawId === "string" ? rawId : String(rawId || "");
                          const displayId = idStr ? `#${idStr.substring(0, 8).toUpperCase()}` : "";
                          return (
                            <div key={idStr || idx} className="rounded-xl border border-emerald-100 bg-emerald-50/20 p-3 text-left space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="text-xs font-black text-gray-900">{item.items?.[0]?.productName || "Xe VinFast"}</h4>
                                  <p className="text-[10px] text-emerald-700 font-bold mt-0.5 flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    {item.status === "Paid" ? "Đã thanh toán cọc" : item.status === "Ready" ? "Sẵn sàng bàn giao" : "Giữ chỗ thành công"}
                                  </p>
                                </div>
                                <span className="text-[9px] font-mono text-gray-400 font-medium">{displayId}</span>
                              </div>
                              <div className="text-[10px] text-gray-500 font-semibold space-y-0.5">
                                <p>Tiền cọc: <span className="font-bold text-[#E30613]">{(item.depositAmount || 0).toLocaleString("vi-VN")} đ</span></p>
                                <p>Ngày cọc: {item.createdAt ? new Date(item.createdAt).toLocaleDateString("vi-VN") : "Hôm nay"}</p>
                              </div>
                              <div className="pt-1 border-t border-emerald-100/50">
                                <Link
                                  href="/user/theo-doi-don-hang"
                                  className="block text-center rounded-lg bg-gray-50 hover:bg-gray-150 text-[10px] font-bold text-gray-700 py-1.5 transition-colors cursor-pointer"
                                >
                                  Chi tiết đơn cọc
                                </Link>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-6 text-center text-xs text-gray-500 space-y-2">
                          <div className="text-2xl">🚗</div>
                          <p className="font-bold text-gray-800">Bạn chưa có đơn cọc nào</p>
                          <p className="text-[11px] text-gray-400">Các đơn cọc thành công sẽ tự động xuất hiện tại đây.</p>
                          <Link href="/" className="inline-block mt-1 text-[#E30613] hover:underline font-bold text-[11px]">Đặt cọc xe VinFast ngay</Link>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="mt-3 border-t border-gray-100 pt-3 text-center">
                      <Link
                        href="/ho-tro/tra-cuu"
                        className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-[#E30613] hover:underline transition-colors decoration-2 underline-offset-4"
                      >
                        Tra cứu tất cả đơn cọc
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <Link
                href="/dat-coc"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#E30613] text-white px-5 py-2.5 font-semibold text-sm shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
              >
                <svg className="h-3.5 w-3.5 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Đặt cọc ngay
              </Link>
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors lg:hidden"
              aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div
            className="lg:hidden border-t border-gray-200 bg-white"
            id="mobile-menu"
          >
            <div className="divide-y divide-gray-100">
              {navItems.map((item) => (
                <MobileNavItem
                  key={item.label}
                  item={item}
                  onClose={() => setMobileOpen(false)}
                />
              ))}
            </div>

            <div className="border-t border-gray-200 p-4 space-y-2">
              <Link
                href="/dat-coc"
                onClick={() => setMobileOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#E30613] px-5 py-3 text-sm font-semibold text-white shadow-md"
              >
                Đặt cọc ngay
              </Link>
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileOpen(false);
                  }}
                  className="flex w-full items-center justify-center rounded-full border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 cursor-pointer"
                >
                  Đăng xuất
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex w-full items-center justify-center rounded-full border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700"
                >
                  Đăng nhập
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
