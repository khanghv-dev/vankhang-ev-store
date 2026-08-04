"use client";

interface SortBarProps {
  totalCount: number;
  sortBy: string;
  onSortByChange: (val: string) => void;
  searchQuery?: string;
  onSearchQueryChange?: (val: string) => void;
}

export default function SortBar({
  totalCount,
  sortBy,
  onSortByChange,
  searchQuery,
  onSearchQueryChange,
}: SortBarProps) {
  return (
    <div className="w-full bg-[var(--color-primary)] text-white px-6 py-4 rounded-2xl shadow-[var(--shadow-brand)] flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between transition-all duration-300">
      {/* ── Status & Item Count ── */}
      <div className="flex items-center gap-2 shrink-0">
        <svg className="h-5 w-5 text-red-100 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
        </svg>
        <span className="text-sm font-semibold tracking-wide text-white">
          Tìm thấy <span className="underline underline-offset-4 decoration-2 font-extrabold">{totalCount}</span> sản phẩm
        </span>
      </div>

      {/* ── Search Bar Input ── */}
      {onSearchQueryChange && (
        <div className="relative flex-1 max-w-md w-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="h-4 w-4 text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery || ""}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Tìm theo tên xe, từ khóa (ví dụ: Evo, Klara, Feliz)..."
            className="w-full rounded-full bg-red-600/60 hover:bg-red-600 border border-red-400/40 py-2 pl-9 pr-8 text-xs font-semibold text-white placeholder-red-200/80 focus:bg-red-700 focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchQueryChange("")}
              className="absolute inset-y-0 right-2.5 flex items-center text-red-200 hover:text-white"
              title="Xóa từ khóa"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* ── Sorting Options Dropdown ── */}
      <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
        <label htmlFor="sort-select" className="text-xs font-bold uppercase tracking-wider text-red-100">
          Sắp xếp:
        </label>
        <div className="relative">
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="appearance-none bg-red-600/50 hover:bg-red-600 border border-red-400/30 text-white text-xs font-semibold px-4 py-2 pr-8 rounded-full focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer transition-colors duration-200"
          >
            <option value="newest" className="bg-red-700 text-white">Mới nhất</option>
            <option value="price-asc" className="bg-red-700 text-white">Giá: Thấp đến Cao</option>
            <option value="price-desc" className="bg-red-700 text-white">Giá: Cao đến Thấp</option>
          </select>
          {/* Custom chevron icon */}
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white/80">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
