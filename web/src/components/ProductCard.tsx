"use client";

import { useState } from "react";
import Link from "next/link";

export interface Product {
  id: string;
  name: string;
  category: string;
  image: string;
  price: number;
  originalPrice?: number;
  discountText?: string;
  specs?: string[];
  isNew?: boolean;
}

interface ProductCardProps {
  product: Product;
}

/**
 * Standardize product image URLs to local project directory paths (/images/products/).
 */
function getProductImagePath(product: Product): string {
  if (product.image && (product.image.startsWith("http://") || product.image.startsWith("https://") || product.image.startsWith("/uploads/"))) {
    return product.image;
  }

  const name = product.name.toLowerCase();
  const id = product.id.toLowerCase();

  if (name.includes("evo200") || id.includes("evo200")) return "/images/products/evo200-lite.png";
  if (name.includes("evo300") || id.includes("evo300") || name.includes("vento") || id.includes("vento")) return "/images/products/evo300-turbo.png";
  if (name.includes("feliz") || id.includes("feliz")) return "/images/products/feliz-s.png";
  if (name.includes("klara") || id.includes("klara")) return "/images/products/klara-s.png";
  if (name.includes("impes") || id.includes("impes")) return "/images/products/impes.png";
  if (name.includes("ludo") || id.includes("ludo")) return "/images/products/ludo.png";
  if (name.includes("theon") || id.includes("theon")) return "/images/products/theon-s.png";
  if (name.includes("zipp") || id.includes("zipp")) return "/images/products/zipp.png";

  if (id.includes("bat") || name.includes("battery")) return "/images/products/battery-pack.png";
  if (id.includes("tire") || name.includes("tire")) return "/images/products/tire.png";
  if (id.includes("mot") || name.includes("motor")) return "/images/products/motor.png";

  return product.image || "/images/products/default-product.png";
}

export default function ProductCard({ product }: ProductCardProps) {
  const {
    name,
    category,
    price,
    originalPrice,
    discountText,
    specs,
    isNew,
  } = product;

  const [imageError, setImageError] = useState<boolean>(false);
  const resolvedImage = getProductImagePath(product);

  // Format currency in VND
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  return (
    <div className="group relative flex flex-col h-full overflow-hidden rounded-2xl bg-white border border-[var(--color-border)] shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 ease-out">
      {/* ── Badges container ── */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        {discountText && (
          <span className="inline-flex items-center rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-bold text-white shadow-[var(--shadow-brand)]">
            {discountText}
          </span>
        )}
        {isNew && (
          <span className="inline-flex items-center rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow-md">
            Mới
          </span>
        )}
      </div>

      {/* ── Visual Section: Soft Backdrop & Bike Image / Fallback UI ── */}
      <Link href={`/products/${product.id}`} className="relative flex items-center justify-center h-60 w-full overflow-hidden bg-neutral-50/50 cursor-pointer">
        {/* Soft decorative circle behind the product */}
        <div 
          className="absolute h-44 w-44 rounded-full bg-rose-100/70 border border-rose-200/20 mix-blend-multiply filter blur-[1px] transition-all duration-700 ease-out group-hover:scale-110 group-hover:bg-rose-200/60"
          style={{ transformOrigin: "center" }}
        />

        {/* Dynamic decorative glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-100/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Product Image or Fallback UI */}
        {imageError || !resolvedImage ? (
          <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-4 text-center bg-gray-100/90 select-none transition-all duration-300">
            <div className="flex items-center justify-center w-12 h-12 mb-2 rounded-full bg-gray-200/80 text-gray-500">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 17a3 3 0 100-6 3 3 0 000 6zm8 0a3 3 0 100-6 3 3 0 000 6zM5 14h2.5l2-4h5.5l1.5 4H19M12 4v4m-3-4h6" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-gray-500 tracking-tight">
              Hình ảnh xe đang cập nhật...
            </span>
          </div>
        ) : (
          <div className="relative z-10 w-48 h-48 flex items-center justify-center transition-all duration-500 ease-out group-hover:scale-105 group-hover:-translate-y-2">
            <img
              src={resolvedImage}
              alt={name}
              onError={() => setImageError(true)}
              className="max-w-full max-h-full object-contain"
              loading="lazy"
            />
          </div>
        )}
      </Link>

      {/* ── Info & Metadata Section ── */}
      <div className="flex flex-col flex-1 p-6">
        {/* Category */}
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-subtle)]">
          {category}
        </span>

        {/* Title — min-h ensures consistent height across all cards */}
        <Link href={`/products/${product.id}`}>
          <h3 className="mt-2 min-h-[3.5rem] text-base font-bold text-[var(--color-text-base)] group-hover:text-[var(--color-primary)] transition-colors duration-300 line-clamp-2 hover:underline leading-snug">
            {name}
          </h3>
        </Link>

        {/* Specs List / Feature Pills */}
        {specs && specs.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {specs.map((spec, index) => (
              <span
                key={index}
                className="spec-pill product-feature-tag inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[12px] sm:text-[12.5px] font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 leading-tight transition-colors hover:bg-slate-200/80"
              >
                {spec}
              </span>
            ))}
          </div>
        )}

        {/* Pricing Area */}
        <div className="mt-5 flex items-baseline gap-2">
          {/* Highlighted Red Price */}
          <span className="text-xl font-extrabold text-[var(--color-primary)] tracking-tight">
            {formatPrice(price)}
          </span>
          {originalPrice && (
            <span className="text-xs text-[var(--color-text-subtle)] line-through font-medium">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>

        {/* Bottom CTA Button */}
        <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
          <Link
            href={`/dat-coc?bike=${product.id}`}
            className="inline-flex w-full items-center justify-center rounded-full bg-[var(--color-neutral-900)] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-300 hover:bg-[var(--color-primary)] hover:shadow-[var(--shadow-brand)] group-hover:translate-x-0"
          >
            Đặt cọc ngay
            <svg 
              className="ml-1.5 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

