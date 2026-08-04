"use client";

import { useState, useEffect, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import FilterSidebar from "./FilterSidebar";
import SortBar from "./SortBar";
import ProductCard from "./ProductCard";
import type { Product } from "./ProductCard";
import { API_CONFIG } from "@/config/apiConfig";

interface ShowcaseProduct extends Product {
  inStock: boolean;
  batteryType?: "lfp" | "lithium-ion" | null;
  batteryOption?: "rent" | "buy" | null;
  description?: string;
}

// ─── Skeleton Loader ─────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="border border-[var(--color-border)] rounded-2xl p-6 bg-white space-y-4 animate-pulse">
      <div className="h-44 bg-neutral-100 rounded-xl w-full" />
      <div className="h-3 bg-neutral-200 rounded w-1/4" />
      <div className="h-6 bg-neutral-200 rounded w-3/4" />
      <div className="flex gap-2">
        <div className="h-4 bg-neutral-100 rounded w-12" />
        <div className="h-4 bg-neutral-100 rounded w-16" />
      </div>
      <div className="h-5 bg-neutral-200 rounded w-1/2 pt-2" />
      <div className="border-t border-[var(--color-border)] pt-4">
        <div className="h-10 bg-neutral-200 rounded-full w-full" />
      </div>
    </div>
  );
}

// ─── Types for new filters ───────────────────────────────────────
export type BatteryTypeFilter = "lfp" | "lithium-ion";
export type BatteryOptionFilter = "rent" | "buy";

// ─── Main Component ──────────────────────────────────────────────
function ProductShowcaseContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const urlSearchParam = searchParams.get("q") || searchParams.get("search") || "";

  // ── Filter & Search States ──────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState(urlSearchParam);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Sync URL query params into search state
  useEffect(() => {
    if (urlSearchParam !== searchQuery) {
      setSearchQuery(urlSearchParam);
    }
  }, [urlSearchParam]);

  // Pre-filter / Sync state from URL category parameter
  useEffect(() => {
    if (categoryParam === "xe-may-dien" || categoryParam === "xe-dien") {
      setSelectedTypes(["xe-may-dien"]);
      setSelectedCategories([]);
    } else if (categoryParam === "xe-50cc" || categoryParam === "xe-may-50cc") {
      setSelectedTypes(["xe-50cc"]);
      setSelectedCategories([]);
    } else if (categoryParam === "phu-tung") {
      setSelectedTypes(["phu-tung"]);
      setSelectedCategories([]);
    }
  }, [categoryParam]);

  const [priceFilters, setPriceFilters] = useState({
    under15M: false,
    between15And30M: false,
    over30M: false,
  });
  const [inStockOnly, setInStockOnly] = useState(false);
  const [batteryTypeFilters, setBatteryTypeFilters] = useState<BatteryTypeFilter[]>([]);
  const [batteryOptionFilters, setBatteryOptionFilters] = useState<BatteryOptionFilter[]>([]);
  const [sortBy, setSortBy] = useState("newest");

  // ── Pagination States ──────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // ── Display & Loading States ───────────────────────────────────
  const [rawProducts, setRawProducts] = useState<ShowcaseProduct[]>([]);
  const [displayProducts, setDisplayProducts] = useState<ShowcaseProduct[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isSimulatedLoading, setIsSimulatedLoading] = useState(false);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const isLoading = isPending || isSimulatedLoading || isApiLoading;

  const totalPages = Math.ceil(displayProducts.length / itemsPerPage);
  const paginatedProducts = displayProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

// ─── Static Catalog Fallback ────────────────────────────────────
const STATIC_PRODUCTS_CATALOG: ShowcaseProduct[] = [
  // ── Xe thật từ VinFast CarOn ───────────────────────────────────
  {
    id: "vinfast-feliz-2025",
    name: "VinFast Feliz 2025",
    category: "Xe máy điện",
    image: "/products/feliz-2025-den.jpg",
    price: 26000000,
    originalPrice: 29000000,
    discountText: "Giảm 10%",
    inStock: true,
    batteryType: "lfp",
    batteryOption: "rent",
    specs: ["Pin LFP", "198 km / sạc", "Tốc độ 80 km/h"],
    description: "VinFast Feliz 2025 - bestseller, màu đen sang trọng thanh lịch.",
  },
  {
    id: "vinfast-evo-grand",
    name: "VinFast Evo Grand",
    category: "Xe máy điện",
    image: "/products/evo-grand-2.jpg",
    price: 22500000,
    originalPrice: 25000000,
    discountText: "Giảm 10%",
    inStock: true,
    batteryType: "lfp",
    batteryOption: "rent",
    specs: ["Pin LFP", "205 km / sạc", "Thiết kế thể thao"],
    description: "VinFast Evo Grand sở hữu diện mạo hiện đại mạnh mẽ.",
  },
  {
    id: "vinfast-evo-grand-lite",
    name: "VinFast Evo Grand Lite",
    category: "Xe máy điện",
    image: "/products/evo-grand-lite-1.jpg",
    price: 16500000,
    originalPrice: 19000000,
    discountText: "Giảm 13%",
    inStock: true,
    batteryType: "lfp",
    batteryOption: "rent",
    specs: ["Pin LFP", "180 km / sạc", "Gọn nhẹ tiết kiệm"],
    description: "VinFast Evo Grand Lite phiên bản phổ thông giá tốt.",
  },
  {
    id: "vinfast-kinet",
    name: "VinFast Kinet",
    category: "Xe máy điện",
    image: "/products/kinet.jpg",
    price: 40000000,
    originalPrice: 44000000,
    discountText: "Giảm 9%",
    inStock: true,
    batteryType: "lfp",
    batteryOption: "rent",
    specs: ["Pin LFP", "150 km / sạc", "Công nghệ thông minh"],
    description: "VinFast Kinet kết nối định vị thông minh.",
  },
  {
    id: "vinfast-kyo",
    name: "VinFast Kyo",
    category: "Xe máy điện",
    image: "/products/kyo.jpg",
    price: 30000000,
    originalPrice: 33000000,
    discountText: "Giảm 9%",
    inStock: true,
    batteryType: "lithium-ion",
    batteryOption: "rent",
    specs: ["Pin Lithium", "90 km / sạc", "Trẻ trung năng động"],
    description: "VinFast Kyo trẻ trung năng động.",
  },
  {
    id: "vinfast-evo200",
    name: "VinFast Evo",
    category: "Xe máy điện",
    image: "/products/vinfast-evo-1.png",
    price: 18800000,
    originalPrice: 21000000,
    discountText: "Giảm 10%",
    inStock: true,
    batteryType: "lfp",
    batteryOption: "rent",
    specs: ["Pin LFP", "205 km / sạc", "Tốc độ 70 km/h"],
    description: "VinFast Evo thế hệ mới thiết kế châu Âu hiện đại.",
  },
  {
    id: "vinfast-amio",
    name: "VinFast Amio",
    category: "Xe máy điện",
    image: "/products/amio-white.webp",
    price: 11600000,
    originalPrice: 13500000,
    discountText: "Giảm 14%",
    inStock: true,
    batteryType: "lithium-ion",
    batteryOption: "rent",
    specs: ["Pin Lithium", "100 km / sạc", "Nhỏ gọn linh hoạt"],
    description: "VinFast Amio siêu gọn nhẹ dành riêng cho đô thị đông đúc.",
  },
  {
    id: "vinfast-feliz-ii",
    name: "VinFast Feliz II",
    category: "Xe máy điện",
    image: "/products/vinfast-feliz-ii-1.jpg",
    price: 23000000,
    originalPrice: 26000000,
    discountText: "Giảm 11%",
    inStock: true,
    batteryType: "lfp",
    batteryOption: "rent",
    specs: ["Pin LFP", "195 km / sạc", "Tốc độ 78 km/h"],
    description: "VinFast Feliz II phiên bản nâng cấp sang trọng.",
  },
  {
    id: "vinfast-viper",
    name: "VinFast Viper",
    category: "Xe máy điện",
    image: "/products/vinfast-viper-1.jpg",
    price: 35000000,
    originalPrice: 39000000,
    discountText: "Giảm 10%",
    inStock: true,
    batteryType: "lfp",
    batteryOption: "rent",
    specs: ["Pin LFP kép", "180 km / sạc", "Phân khối lớn"],
    description: "VinFast Viper phân khối lớn uy lực mạnh mẽ.",
  },
  {
    id: "vinfast-zgoo",
    name: "VinFast ZGoo",
    category: "Xe máy điện",
    image: "/products/zgoo-1.jpg",
    price: 13300000,
    originalPrice: 15500000,
    discountText: "Giảm 14%",
    inStock: true,
    batteryType: "lithium-ion",
    batteryOption: "rent",
    specs: ["Pin Lithium", "80 km / sạc", "Thể thao học sinh"],
    description: "VinFast ZGoo phong cách thể thao cá tính.",
  },
  {
    id: "vinfast-flazz",
    name: "VinFast Flazz",
    category: "Xe máy điện",
    image: "/products/flazz-1.jpg",
    price: 14200000,
    originalPrice: 16500000,
    discountText: "Giảm 14%",
    inStock: true,
    batteryType: "lfp",
    batteryOption: "rent",
    specs: ["Pin LFP", "120 km / sạc", "Cá tính độc đáo"],
    description: "VinFast Flazz đường nét sắc sảo độc đáo.",
  },
  {
    id: "vinfast-klara-s-2026",
    name: "VinFast Klara S",
    category: "Xe máy điện",
    image: "/products/klara-s-white.png",
    price: 35000000,
    originalPrice: 39900000,
    discountText: "Giảm 12%",
    inStock: true,
    batteryType: "lfp",
    batteryOption: "rent",
    specs: ["Pin LFP", "194 km / sạc", "Tốc độ 78 km/h"],
    description: "VinFast Klara S thế hệ mới sang trọng phong cách Ý.",
  },
];



// ─── Fetch products dynamically from .NET Backend API ───────────
  useEffect(() => {
    const fetchProducts = async () => {
      setIsApiLoading(true);
      setApiError(null);
      try {
        let url = `${API_CONFIG.INVENTORY_URL}/api/products`;
        if (selectedTypes.length === 1) {
          url += `?category=${selectedTypes[0]}`;
        }
        const response = await fetch(url, { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            // Merge API products with static CarOn models to ensure ALL vehicles are displayed
            const existingIds = new Set(data.map((p: any) => p.id));
            const merged = [
              ...data,
              ...STATIC_PRODUCTS_CATALOG.filter((p) => !existingIds.has(p.id)),
            ];
            setRawProducts(merged);
            return;
          }
        }
      } catch {
        // Fallback silently to full catalog
      } finally {
        setIsApiLoading(false);
      }
      setRawProducts(STATIC_PRODUCTS_CATALOG);
    };

    fetchProducts();
  }, [selectedTypes]);

  // ── Handlers ───────────────────────────────────────────────────
  const handleSearchQueryChange = (query: string) => {
    setIsSimulatedLoading(true);
    setSearchQuery(query);
  };

  const handleTypeChange = (type: string) => {
    setIsSimulatedLoading(true);
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleCategoryChange = (category: string) => {
    setIsSimulatedLoading(true);
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const handlePriceFilterChange = (filterKey: "under15M" | "between15And30M" | "over30M") => {
    setIsSimulatedLoading(true);
    setPriceFilters((prev) => ({ ...prev, [filterKey]: !prev[filterKey] }));
  };

  const handleInStockOnlyChange = () => {
    setIsSimulatedLoading(true);
    setInStockOnly((prev) => !prev);
  };

  const handleBatteryTypeChange = (type: BatteryTypeFilter) => {
    setIsSimulatedLoading(true);
    setBatteryTypeFilters((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleBatteryOptionChange = (option: BatteryOptionFilter) => {
    setIsSimulatedLoading(true);
    setBatteryOptionFilters((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  };

  const handleSortByChange = (val: string) => {
    setIsSimulatedLoading(true);
    setSortBy(val);
  };

  const handleClearAll = () => {
    setIsSimulatedLoading(true);
    setSearchQuery("");
    setSelectedTypes([]);
    setSelectedCategories([]);
    setPriceFilters({ under15M: false, between15And30M: false, over30M: false });
    setInStockOnly(false);
    setBatteryTypeFilters([]);
    setBatteryOptionFilters([]);
  };

  // ── Filtering & Sorting Logic ──────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        let result = [...rawProducts];

        // 0. Keyword Text Search Filter
        if (searchQuery && searchQuery.trim()) {
          const term = searchQuery.toLowerCase().trim();
          result = result.filter(
            (p) =>
              p.name.toLowerCase().includes(term) ||
              p.category.toLowerCase().includes(term) ||
              (p.description && p.description.toLowerCase().includes(term))
          );
        }

        // 1. Product Type Local Filter (in case multiple or none selected)
        if (selectedTypes.length > 0) {
          result = result.filter((p) => {
            if (p.category === "Phụ tùng") {
              return selectedTypes.includes("phu-tung");
            }
            // For vehicles, determine if it is electric or gasoline
            const isElectric = p.batteryType !== null && p.batteryType !== undefined;
            if (isElectric) {
              return selectedTypes.includes("xe-may-dien");
            } else {
              return selectedTypes.includes("xe-50cc");
            }
          });
        }

        // 2. Category (Model Name) Filter
        if (selectedCategories.length > 0) {
          result = result.filter((p) => selectedCategories.includes(p.category));
        }

        // 3. Price Filter
        const anyPriceActive =
          priceFilters.under15M || priceFilters.between15And30M || priceFilters.over30M;
        if (anyPriceActive) {
          result = result.filter((p) => {
            if (priceFilters.under15M && p.price < 15000000) return true;
            if (priceFilters.between15And30M && p.price >= 15000000 && p.price <= 30000000)
              return true;
            if (priceFilters.over30M && p.price > 30000000) return true;
            return false;
          });
        }

        // 4. Stock Filter
        if (inStockOnly) {
          result = result.filter((p) => p.inStock);
        }

        // 5. Battery Type Filter (Loại pin)
        if (batteryTypeFilters.length > 0) {
          result = result.filter((p) => p.batteryType && batteryTypeFilters.includes(p.batteryType));
        }

        // 6. Battery Option Filter (Phương án pin)
        if (batteryOptionFilters.length > 0) {
          result = result.filter((p) => p.batteryOption && batteryOptionFilters.includes(p.batteryOption));
        }

        // 7. Sorting
        if (sortBy === "price-asc") {
          result.sort((a, b) => a.price - b.price);
        } else if (sortBy === "price-desc") {
          result.sort((a, b) => b.price - a.price);
        } else {
          result.sort((a, b) => {
            if (a.isNew && !b.isNew) return -1;
            if (!a.isNew && b.isNew) return 1;
            return a.id.localeCompare(b.id);
          });
        }

        setDisplayProducts(result);
        setCurrentPage(1);
        setIsSimulatedLoading(false);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [rawProducts, searchQuery, selectedTypes, selectedCategories, priceFilters, inStockOnly, batteryTypeFilters, batteryOptionFilters, sortBy]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
      {/* ── Left Sidebar: Filters ── */}
      <div className="lg:col-span-1">
        <FilterSidebar
          selectedTypes={selectedTypes}
          onTypeChange={handleTypeChange}
          selectedCategories={selectedCategories}
          onCategoryChange={handleCategoryChange}
          priceFilters={priceFilters}
          onPriceFilterChange={handlePriceFilterChange}
          inStockOnly={inStockOnly}
          onInStockOnlyChange={handleInStockOnlyChange}
          batteryTypeFilters={batteryTypeFilters}
          onBatteryTypeChange={handleBatteryTypeChange}
          batteryOptionFilters={batteryOptionFilters}
          onBatteryOptionChange={handleBatteryOptionChange}
          searchQuery={searchQuery}
          onSearchQueryChange={handleSearchQueryChange}
          onClearAll={handleClearAll}
        />
      </div>

      {/* ── Right Main Section: Sort Bar + Product Grid ── */}
      <div className="lg:col-span-3 space-y-6">
        <SortBar
          totalCount={displayProducts.length}
          sortBy={sortBy}
          onSortByChange={handleSortByChange}
          searchQuery={searchQuery}
          onSearchQueryChange={handleSearchQueryChange}
        />

        {apiError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm flex items-center gap-3 shadow-sm">
            <span className="text-lg">⚠️</span>
            <span className="font-medium">{apiError}</span>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : displayProducts.length > 0 ? (
          <div className="space-y-8">
            {/* Product Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* ── Pagination Controls ── */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-neutral-200">
                <div className="text-xs text-neutral-500 font-semibold">
                  Hiển thị <span className="font-bold text-neutral-800">{(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, displayProducts.length)}</span> trên tổng số <span className="font-bold text-[#E30613]">{displayProducts.length}</span> sản phẩm
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setCurrentPage((prev) => Math.max(prev - 1, 1));
                      window.scrollTo({ top: 350, behavior: "smooth" });
                    }}
                    disabled={currentPage === 1}
                    className="flex items-center justify-center h-9 px-3.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
                  >
                    ‹ Trang trước
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => {
                        setCurrentPage(pageNum);
                        window.scrollTo({ top: 350, behavior: "smooth" });
                      }}
                      className={`h-9 w-9 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm ${
                        currentPage === pageNum
                          ? "bg-[#E30613] text-white shadow-md shadow-red-500/20"
                          : "bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    onClick={() => {
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                      window.scrollTo({ top: 350, behavior: "smooth" });
                    }}
                    disabled={currentPage === totalPages}
                    className="flex items-center justify-center h-9 px-3.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
                  >
                    Trang tiếp ›
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center border border-dashed border-[var(--color-border)] rounded-2xl p-16 text-center bg-white space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-[var(--color-primary)]">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <div>
              <h4 className="text-md font-bold text-[var(--color-text-base)]">
                Không tìm thấy kết quả
              </h4>
              <p className="mt-1 text-sm text-[var(--color-text-subtle)]">
                Vui lòng đổi bộ lọc hoặc xoá các lựa chọn hiện tại để tìm sản phẩm.
              </p>
            </div>
            <button
              onClick={handleClearAll}
              className="rounded-full bg-[var(--color-neutral-900)] px-6 py-2 text-xs font-semibold text-white transition-all duration-200 hover:bg-[var(--color-primary)]"
            >
              Reset bộ lọc
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import { Suspense } from "react";

export default function ProductShowcase() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Đang tải sản phẩm...</div>}>
      <ProductShowcaseContent />
    </Suspense>
  );
}
