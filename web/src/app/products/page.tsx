"use client";

import { Suspense } from "react";
import ProductShowcase from "@/components/ProductShowcase";
import Link from "next/link";

function ProductShowcaseWrapper() {
  return <ProductShowcase />;
}

export default function ProductsPage() {
  return (
    <div className="bg-[var(--color-surface)] min-h-screen py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-subtle)] uppercase tracking-wider mb-8">
          <Link href="/" className="hover:text-[var(--color-primary)] transition-colors duration-200">
            Trang chủ
          </Link>
          <span>/</span>
          <span className="text-[var(--color-primary)]">Sản phẩm</span>
        </nav>

        <div className="mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary)]">
            Hệ sinh thái di chuyển xanh
          </span>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[var(--color-text-base)] sm:text-4xl">
            Danh mục sản phẩm
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)] max-w-xl">
            Khám phá và so sánh các dòng xe máy điện, xe máy 50cc của VinFast với công nghệ hiện đại, thân thiện môi trường và tiết kiệm chi phí tối đa.
          </p>
        </div>

        <Suspense fallback={
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
            <p className="mt-2 text-sm text-gray-500">Đang tải danh sách sản phẩm...</p>
          </div>
        }>
          <ProductShowcaseWrapper />
        </Suspense>
      </div>
    </div>
  );
}
