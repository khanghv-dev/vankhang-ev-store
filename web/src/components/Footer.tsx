"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NewsletterForm from "@/components/NewsletterForm";

// ─── Icon SVGs ──────────────────────────────────────────────────────────────
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const YoutubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const TiktokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
  </svg>
);

const LinkedinIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

// ─── Types ─────────────────────────────────────────────────────────────────
interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

// ─── Data ──────────────────────────────────────────────────────────────────
const footerColumns: FooterColumn[] = [
  {
    title: "Sản phẩm",
    links: [
      { label: "VinFast VF 3", href: "/products/vf3" },
      { label: "VinFast VF 5", href: "/products/vf5" },
      { label: "VinFast VF 6", href: "/products/vf6" },
      { label: "VinFast VF 7", href: "/products/vf7" },
      { label: "VinFast VF 8", href: "/products/vf8" },
      { label: "VinFast VF 9", href: "/products/vf9" },
      { label: "Xe máy điện", href: "/products?category=xe-may-dien" },
      { label: "Phụ kiện & Dịch vụ", href: "/products?category=phu-kien" },
    ],
  },
  {
    title: "Về chúng tôi",
    links: [
      { label: "Giới thiệu VinFast", href: "/ho-tro/gioi-thieu-vinfast" },
      { label: "Tầm nhìn & Sứ mệnh", href: "/ho-tro/tam-nhin-su-menh" },
      { label: "Ban lãnh đạo", href: "/ho-tro/ban-lanh-dao" },
      { label: "Tin tức & Sự kiện", href: "/tin-tuc" },
      { label: "Tuyển dụng", href: "/ho-tro/tuyen-dung" },
      { label: "Hệ thống Showroom", href: "/showroom" },
      { label: "Liên hệ hỗ trợ", href: "/ho-tro" },
    ],
  },
  {
    title: "Chính sách trả góp",
    links: [
      { label: "Điều kiện vay mua xe", href: "/ho-tro/mua-hang-tra-gop" },
      { label: "Tính lãi suất trả góp", href: "/ho-tro/mua-hang-tra-gop" },
      { label: "Hồ sơ thủ tục vay", href: "/ho-tro/mua-hang-tra-gop" },
      { label: "Ngân hàng đối tác", href: "/ho-tro/mua-hang-tra-gop" },
      { label: "Chính sách đặt cọc", href: "/ho-tro/su-dung-xe" },
      { label: "Chính sách bảo hành", href: "/ho-tro/bao-hanh" },
      { label: "Dịch vụ bảo dưỡng", href: "/ho-tro/su-dung-xe" },
    ],
  },
  {
    title: "Điều khoản pháp lý",
    links: [
      { label: "Điều khoản sử dụng", href: "/ho-tro/dieu-khoan-su-dung" },
      { label: "Chính sách bảo mật", href: "/ho-tro/chinh-sach-bao-mat" },
      { label: "Quy định đặt mua xe", href: "/ho-tro/quy-dinh-dat-mua" },
      { label: "Cookie & Tracking", href: "/ho-tro/cookie-tracking" },
      { label: "Giải quyết tranh chấp", href: "/ho-tro/giai-quyet-tranh-chap" },
      { label: "Pháp lý doanh nghiệp", href: "/ho-tro/phap-ly-doanh-nghiep" },
    ],
  },
];

const socialLinks = [
  { label: "Facebook", href: "https://www.facebook.com/VinFastVietnam", icon: <FacebookIcon /> },
  { label: "YouTube", href: "https://www.youtube.com/@VinFastVietnam", icon: <YoutubeIcon /> },
  { label: "TikTok", href: "https://www.tiktok.com/@vinfastvietnam", icon: <TiktokIcon /> },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/vinfastauto", icon: <LinkedinIcon /> },
];

// ─── Newsletter Subscribe ──────────────────────────────────────────────────
function NewsletterBar() {
  return (
    <div className="border-b border-[#E5E7EB]">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#111827]">
              Đăng ký nhận thông tin ưu đãi
            </h3>
            <p className="mt-1 text-sm text-[#374151]">
              Cập nhật mẫu xe mới, chương trình khuyến mãi & sự kiện VinFast
            </p>
          </div>
          <NewsletterForm />
        </div>
      </div>
    </div>
  );
}

// ─── Main Footer ──────────────────────────────────────────────────────────
export default function Footer() {
  const pathname = usePathname();

  if (pathname && pathname.startsWith("/showroom")) {
    return null;
  }

  return (
    <footer
      className="bg-[#F8F9FA] border-t border-[#E5E7EB] text-[#374151]"
      aria-label="Chân trang website VinFast O2O"
    >
      {/* Newsletter */}
      <NewsletterBar />

      {/* Main 4-column grid */}
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <div className="xl:grid xl:grid-cols-5 xl:gap-10">
          {/* Brand block — hidden on md grids, visible on xl */}
          <div className="mb-12 xl:col-span-1 xl:mb-0">
            {/* Logo */}
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 group"
              aria-label="VinFast O2O — Trang chủ"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary)] shadow-[var(--shadow-brand)] transition-transform duration-200 group-hover:scale-105">
                <span className="text-base font-black text-white leading-none">V</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-sm font-black text-[#111827] tracking-wide">VinFast</span>
                <span className="text-xs text-[var(--color-primary)] font-semibold tracking-widest uppercase">O2O</span>
              </div>
            </Link>

            <p className="mt-4 text-sm text-[#374151] leading-relaxed max-w-xs">
              Nền tảng O2O chính thức — đặt cọc trực tuyến, xuất kho tại showroom,
              kích hoạt bảo hành điện tử ngay tại quầy.
            </p>

            {/* Hotline */}
            <div className="mt-5 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#6B7280]">
                Hỗ trợ khách hàng
              </p>
              <a
                href="tel:18001260"
                className="inline-flex items-center gap-1.5 text-base font-bold text-[#111827] hover:text-[#E60012] transition-colors"
                aria-label="Gọi hotline 1800 1260"
              >
                <svg className="h-4 w-4 text-[#E60012]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 6.75Z" />
                </svg>
                1800 1260
              </a>
              <p className="text-xs text-[#6B7280]">Miễn phí · 8:00 – 22:00 hàng ngày</p>
            </div>

            {/* Social links */}
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#6B7280] mb-3">
                Mạng xã hội
              </p>
              <div className="flex gap-3">
                {socialLinks.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#374151] transition-all duration-200 hover:border-[#E60012] hover:text-[#E60012] hover:-translate-y-0.5"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* 4 columns navigation */}
          <div className="xl:col-span-4">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {footerColumns.map((col) => (
                <FooterColumn key={col.title} column={col} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Column sub-component ─────────────────────────────────────────────────
function FooterColumn({ column }: { column: FooterColumn }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-[#111827] tracking-wide">
        {column.title}
      </h4>
      {/* Red accent underline */}
      <div className="mt-2 mb-4 h-0.5 w-8 rounded-full bg-[#E60012]" />
      <ul role="list" className="space-y-2.5">
        {column.links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="group inline-flex items-center gap-1.5 text-sm text-[#374151] transition-colors duration-150 hover:text-[#E60012]"
            >
              <span className="h-1 w-1 flex-shrink-0 rounded-full bg-[#D1D5DB] transition-colors duration-150 group-hover:bg-[#E60012]" aria-hidden="true" />
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
