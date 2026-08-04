import { Suspense } from "react";
import Link from "next/link";
import ProductShowcase from "@/components/ProductShowcase";
import HeroSlider from "@/components/HeroSlider";


// ─── Main Page ───────────────────────────────────────────────
export default function Home() {
  return (
    <main className="flex-1">
      {/* ── Hero Slider ───────────────────────────────────────── */}
      <HeroSlider />

      {/* ── Product Showcase ───────────────────────────────── */}
      <section className="relative isolate mx-auto max-w-7xl px-6 pt-12 pb-20 lg:px-8">
        <div className="mb-12 text-center md:text-left md:flex md:items-end md:justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary)]">
              Xe máy điện thông minh
            </span>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-[var(--color-text-base)] sm:text-4xl">
              Sản phẩm nổi bật
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-muted)] max-w-xl">
              Khám phá các dòng xe máy điện VinFast thế hệ mới với công nghệ pin đột phá LFP, kiểu dáng thời thượng và khả năng vận hành vượt trội.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors duration-200"
            >
              Xem tất cả xe máy điện
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Dynamic Showcase Grid with Filter and Sorting */}
        <Suspense fallback={<div className="p-12 text-center text-slate-500">Đang tải danh sách xe...</div>}>
          <ProductShowcase />
        </Suspense>
      </section>
    </main>
  );
}
