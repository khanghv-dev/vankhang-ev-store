"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

interface SlideData {
  title: string;
  brand: string;
  badge: string;
  description: string;
  image: string;
  ctaText: string;
  ctaHref: string;
  secondaryCtaText: string;
  secondaryCtaHref: string;
}

const SLIDE_ITEMS: SlideData[] = [
  {
    brand: "VinFast",
    title: "NỀN TẢNG O2O THẾ HỆ MỚI",
    badge: "Xu hướng tương lai",
    description: "Trải nghiệm mua sắm xe máy điện trực tuyến vượt trội — đặt cọc giữ chỗ nhanh chóng, xuất kho tức thì tại hệ thống showroom ủy quyền toàn quốc.",
    image: "/images/products/evo200-lite.png",
    ctaText: "Đặt cọc ngay",
    ctaHref: "/dat-coc",
    secondaryCtaText: "Xem Swagger API",
    secondaryCtaHref: "/swagger",
  },
  {
    brand: "VinFast Feliz S",
    title: "BỨT PHÁ MỌI GIỚI HẠN DI CHUYỂN",
    badge: "Bán chạy nhất",
    description: "Trang bị pin LFP tiên tiến mang đến quãng đường di chuyển vượt trội lên tới 198 km / sạc, động cơ mạnh mẽ 3000W và khả năng chống nước IP67 siêu việt.",
    image: "/images/products/feliz-s.png",
    ctaText: "Khám phá Feliz S",
    ctaHref: "/products/vinfast-feliz-s",
    secondaryCtaText: "Đăng ký lái thử",
    secondaryCtaHref: "/showroom",
  },
  {
    brand: "VinFast Evo200",
    title: "XE MÁY ĐIỆN QUỐC DÂN THẾ HỆ MỚI",
    badge: "Kỷ nguyên xanh",
    description: "Nhỏ gọn, thời thượng và tối ưu chi phí vận hành. Quãng đường kỷ lục lên tới 205 km chỉ với 1 lần sạc đầy. Phù hợp cho cuộc sống năng động đô thị.",
    image: "/images/products/klara-s.png",
    ctaText: "Đặt mua Evo200",
    ctaHref: "/dat-coc",
    secondaryCtaText: "Xem chi tiết xe",
    secondaryCtaHref: "/products/vinfast-evo200",
  },
  {
    brand: "Trạm Sạc Toàn Quốc",
    title: "PHỦ SÓNG TOÀN DIỆN KHẮP 63 TỈNH THÀNH",
    badge: "Hạ tầng vượt trội",
    description: "VinFast tự hào xây dựng hệ sinh thái giao thông xanh bền vững với hàng ngàn trạm sạc nhanh công cộng hiện đại trải dài từ đô thị đến các quốc lộ huyết mạch.",
    image: "/images/products/evo300-turbo.png",
    ctaText: "Tìm kiếm showroom",
    ctaHref: "/showroom",
    secondaryCtaText: "Chính sách thuê pin",
    secondaryCtaHref: "/ho-tro/thue-doi-pin",
  },
];

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % SLIDE_ITEMS.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + SLIDE_ITEMS.length) % SLIDE_ITEMS.length);
  }, []);

  // Set up autoplay smoothly without interval recreations
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 5000); // Rotate every 5 seconds

    return () => clearInterval(interval);
  }, [nextSlide, isPaused]);

  return (
    <section 
      className="relative overflow-hidden w-full h-[550px] group bg-neutral-900"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Red accent stripe at top */}
      <div className="absolute left-0 top-0 h-1 w-full bg-[#E30613] z-20" />

      {/* Slides Container */}
      <div className="relative w-full h-full">
        {SLIDE_ITEMS.map((slide, idx) => {
          const isActive = idx === currentSlide;
          return (
            <div
              key={idx}
              className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                isActive 
                  ? "opacity-100 z-10" 
                  : "opacity-0 z-0 invisible pointer-events-none"
              }`}
            >
              {/* Background Slide Image */}
              <div className="absolute inset-0">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  className="object-cover transition-transform duration-[5000ms] ease-out scale-100 group-hover:scale-105"
                  unoptimized
                />
                {/* Visual shade overlay */}
                <div className="absolute inset-0 bg-black/40" />
              </div>

              {/* Foreground Content */}
              <div className="relative mx-auto max-w-7xl h-full px-6 flex flex-col justify-center lg:px-8 text-white z-20">
                <div 
                  className={`max-w-2xl space-y-5 transition-all duration-700 ease-out delay-200 ${
                    isActive 
                      ? "opacity-100 translate-y-0" 
                      : "opacity-0 translate-y-8"
                  }`}
                >
                  
                  {/* Badge */}
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-[#E30613] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm ring-1 ring-white/10">
                      {slide.badge}
                    </span>
                  </div>

                  {/* Brand & Main Title */}
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight font-sans text-white leading-none">
                    {slide.brand} <br />
                    <span className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-100 mt-1 block">
                      {slide.title}
                    </span>
                  </h1>

                  {/* Description text */}
                  <p className="text-sm sm:text-base text-neutral-200 leading-relaxed font-medium font-sans drop-shadow-sm max-w-xl">
                    {slide.description}
                  </p>

                  {/* Action Buttons */}
                  <div className="pt-2 flex flex-wrap gap-4">
                    <Link
                      href={slide.ctaHref}
                      className="inline-flex items-center gap-2 rounded-full bg-[#E30613] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-500/20 transition-all duration-200 hover:bg-[#c0000f] hover:scale-105"
                    >
                      {slide.ctaText}
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                      </svg>
                    </Link>
                    <Link
                      href={slide.secondaryCtaHref}
                      className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-md px-6 py-3 text-sm font-bold text-white transition-all duration-200 hover:border-white/50 hover:bg-white/15"
                    >
                      {slide.secondaryCtaText}
                    </Link>
                  </div>

                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
        {SLIDE_ITEMS.map((_, idx) => {
          const isActive = idx === currentSlide;
          return (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2.5 rounded-full transition-all duration-300 ease-out cursor-pointer ${
                isActive 
                  ? "bg-[#E30613] w-7 shadow-sm shadow-[#E30613]/50" 
                  : "bg-white/50 w-2.5 hover:bg-white"
              }`}
              aria-label={`Đi tới slide ${idx + 1}`}
            />
          );
        })}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-black/25 text-white/70 border border-white/10 backdrop-blur-md transition-all hover:bg-black/55 hover:text-white hover:scale-105 opacity-0 group-hover:opacity-100 cursor-pointer"
        aria-label="Slide trước"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-black/25 text-white/70 border border-white/10 backdrop-blur-md transition-all hover:bg-black/55 hover:text-white hover:scale-105 opacity-0 group-hover:opacity-100 cursor-pointer"
        aria-label="Slide tiếp theo"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </section>
  );
}
