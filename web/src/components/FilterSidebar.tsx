"use client";

import type { BatteryTypeFilter, BatteryOptionFilter } from "./ProductShowcase";

// ─── Props ─────────────────────────────────────────────────────────────────
interface FilterSidebarProps {
  selectedTypes: string[];
  onTypeChange: (type: string) => void;
  selectedCategories: string[];
  onCategoryChange: (category: string) => void;
  priceFilters: {
    under15M: boolean;
    between15And30M: boolean;
    over30M: boolean;
  };
  onPriceFilterChange: (filterKey: "under15M" | "between15And30M" | "over30M") => void;
  inStockOnly: boolean;
  onInStockOnlyChange: () => void;
  batteryTypeFilters: BatteryTypeFilter[];
  onBatteryTypeChange: (type: BatteryTypeFilter) => void;
  batteryOptionFilters: BatteryOptionFilter[];
  onBatteryOptionChange: (option: BatteryOptionFilter) => void;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  onClearAll: () => void;
}

// ─── Reusable Checkbox Row ─────────────────────────────────────────────────
function CheckboxRow({
  id,
  label,
  checked,
  onChange,
  badge,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
  badge?: string;
}) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-3 cursor-pointer group py-1.5 select-none"
    >
      {/* Custom Checkbox */}
      <div className="relative flex-shrink-0">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={onChange}
          className="sr-only"
        />
        <div
          className={`h-4 w-4 rounded border-2 transition-all duration-200 flex items-center justify-center ${
            checked
              ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
              : "border-neutral-300 bg-white group-hover:border-[var(--color-primary)]"
          }`}
        >
          {checked && (
            <svg
              className="h-2.5 w-2.5 text-white"
              fill="none"
              viewBox="0 0 12 12"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
            </svg>
          )}
        </div>
      </div>

      {/* Label + Optional Badge */}
      <span
        className={`text-sm font-medium transition-colors duration-200 ${
          checked
            ? "text-[var(--color-primary)]"
            : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text-base)]"
        }`}
      >
        {label}
      </span>

      {badge && (
        <span className="ml-auto inline-flex items-center rounded-full bg-[var(--color-primary-light)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-primary)]">
          {badge}
        </span>
      )}
    </label>
  );
}

// ─── Reusable Toggle Switch (dùng cho Trạng thái & Khoảng giá) ─────────────
function Switch({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  id: string;
}) {
  return (
    <label htmlFor={id} className="flex items-center justify-between cursor-pointer py-2 group select-none">
      <span className="text-sm font-medium text-[var(--color-text-base)] group-hover:text-[var(--color-primary)] transition-colors duration-200">
        {label}
      </span>
      <div className="relative">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={onChange}
          className="sr-only"
        />
        {/* Track */}
        <div
          className={`block w-11 h-6 rounded-full transition-colors duration-300 ${
            checked ? "bg-[var(--color-primary)] shadow-[var(--shadow-brand)]" : "bg-neutral-200"
          }`}
        />
        {/* Thumb */}
        <div
          className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-md transition-transform duration-300 ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </div>
    </label>
  );
}

// ─── Section Divider ──────────────────────────────────────────────────────
function Divider() {
  return <hr className="border-[var(--color-border)]" />;
}

// ─── Group Heading ────────────────────────────────────────────────────────
function GroupHeading({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[var(--color-primary)]">{icon}</span>
      <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-subtle)]">
        {children}
      </h3>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────
export default function FilterSidebar({
  selectedTypes,
  onTypeChange,
  selectedCategories,
  onCategoryChange,
  priceFilters,
  onPriceFilterChange,
  inStockOnly,
  onInStockOnlyChange,
  batteryTypeFilters,
  onBatteryTypeChange,
  batteryOptionFilters,
  onBatteryOptionChange,
  searchQuery,
  onSearchQueryChange,
  onClearAll,
}: FilterSidebarProps) {
  const categoriesList = [
    "Klara",
    "Amio",
    "Evo Grand",
    "Feliz",
    "Impes",
    "Evo200",
    "Zgoo",
    "Flazz",
    "Kinet",
    "Kyo",
    "Viper",
    "Vento S",
    "Theon S",
    "Ludo",
    "Zipp",
  ];

  const hasActiveFilters =
    (searchQuery && searchQuery.trim().length > 0) ||
    selectedTypes.length > 0 ||
    selectedCategories.length > 0 ||
    priceFilters.under15M ||
    priceFilters.between15And30M ||
    priceFilters.over30M ||
    inStockOnly ||
    batteryTypeFilters.length > 0 ||
    batteryOptionFilters.length > 0;

  // Đếm số filter đang bật
  const activeCount =
    (searchQuery && searchQuery.trim().length > 0 ? 1 : 0) +
    selectedTypes.length +
    selectedCategories.length +
    (priceFilters.under15M ? 1 : 0) +
    (priceFilters.between15And30M ? 1 : 0) +
    (priceFilters.over30M ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    batteryTypeFilters.length +
    batteryOptionFilters.length;

  // Hide battery filters for 50cc gasoline motorcycles
  const showBatteryFilters = !selectedTypes.includes("xe-50cc") || selectedTypes.includes("xe-may-dien");

  return (
    <aside className="w-full bg-white border border-[var(--color-border)] rounded-2xl shadow-[var(--shadow-card)] overflow-hidden">
      {/* ── Sidebar Header ── */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)]">
        <div className="flex items-center gap-2.5">
          {/* Filter icon */}
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-primary-light)]">
            <svg
              className="h-3.5 w-3.5 text-[var(--color-primary)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12"
              />
            </svg>
          </div>
          <h2 className="text-sm font-bold text-[var(--color-text-base)] tracking-tight">
            Bộ lọc thông minh
          </h2>
          {activeCount > 0 && (
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1 text-xs font-semibold text-[var(--color-text-subtle)] hover:text-[var(--color-primary)] transition-colors duration-200"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
            Xoá tất cả
          </button>
        )}
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* ── Search Input Box ── */}
        {onSearchQueryChange && (
          <div>
            <GroupHeading
              icon={
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
                </svg>
              }
            >
              Tìm kiếm từ khóa
            </GroupHeading>
            <div className="relative">
              <input
                type="text"
                value={searchQuery || ""}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder="Nhập tên xe hoặc từ khóa..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50/80 py-2 pl-3.5 pr-8 text-xs font-medium text-gray-800 placeholder-gray-400 focus:border-[var(--color-primary)] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchQueryChange("")}
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
        )}

        {onSearchQueryChange && <Divider />}
        {/* ── 0. Phân loại xe ── */}
        <div>
          <GroupHeading
            icon={
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.992a7.72 7.72 0 0 1 0-.254c.007-.379-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            }
          >
            Phân loại
          </GroupHeading>
          <div className="space-y-0.5">
            <CheckboxRow
              id="type-dien"
              label="Xe máy điện"
              checked={selectedTypes.includes("xe-may-dien")}
              onChange={() => onTypeChange("xe-may-dien")}
            />
            <CheckboxRow
              id="type-50cc"
              label="Xe máy 50cc"
              checked={selectedTypes.includes("xe-50cc")}
              onChange={() => onTypeChange("xe-50cc")}
            />
            <CheckboxRow
              id="type-phutung"
              label="Phụ tùng"
              checked={selectedTypes.includes("phu-tung")}
              onChange={() => onTypeChange("phu-tung")}
            />
          </div>
        </div>

        <Divider />

        {/* ── 1. Dòng xe máy ── */}
        <div>
          <GroupHeading
            icon={
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
            }
          >
            Dòng xe máy
          </GroupHeading>
          <div className="space-y-0.5">
            {categoriesList.map((cat) => (
              <CheckboxRow
                key={cat}
                id={`cat-${cat.toLowerCase()}`}
                label={`VinFast ${cat}`}
                checked={selectedCategories.includes(cat)}
                onChange={() => onCategoryChange(cat)}
              />
            ))}
          </div>
        </div>

        <Divider />

        {/* ── 2. Khoảng giá ── */}
        <div>
          <GroupHeading
            icon={
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            }
          >
            Khoảng giá
          </GroupHeading>
          <div className="space-y-0.5">
            <Switch
              id="price-under15M"
              label="Dưới 15 triệu"
              checked={priceFilters.under15M}
              onChange={() => onPriceFilterChange("under15M")}
            />
            <Switch
              id="price-15to30M"
              label="Từ 15 – 30 triệu"
              checked={priceFilters.between15And30M}
              onChange={() => onPriceFilterChange("between15And30M")}
            />
            <Switch
              id="price-over30M"
              label="Trên 30 triệu"
              checked={priceFilters.over30M}
              onChange={() => onPriceFilterChange("over30M")}
            />
          </div>
        </div>

        {showBatteryFilters && (
          <>
            <Divider />
            {/* ── 3. Loại pin ─ MỚI ── */}
            <div>
              <GroupHeading
                icon={
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                  </svg>
                }
              >
                Loại pin
              </GroupHeading>
              <div className="space-y-0.5">
                <CheckboxRow
                  id="battery-lfp"
                  label="Pin LFP thế hệ mới"
                  checked={batteryTypeFilters.includes("lfp")}
                  onChange={() => onBatteryTypeChange("lfp")}
                  badge="Mới"
                />
                <CheckboxRow
                  id="battery-lithium"
                  label="Pin Lithium-ion"
                  checked={batteryTypeFilters.includes("lithium-ion")}
                  onChange={() => onBatteryTypeChange("lithium-ion")}
                />
              </div>
            </div>

            <Divider />
            {/* ── 4. Phương án pin ─ MỚI ── */}
            <div>
              <GroupHeading
                icon={
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5V18M15 7.5V18M3 16.811V8.69c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061A1.125 1.125 0 0 1 3 16.811Z" />
                  </svg>
                }
              >
                Phương án pin
              </GroupHeading>
              <div className="space-y-0.5">
                <CheckboxRow
                  id="option-rent"
                  label="Thuê pin tối ưu"
                  checked={batteryOptionFilters.includes("rent")}
                  onChange={() => onBatteryOptionChange("rent")}
                  badge="Tiết kiệm"
                />
                <CheckboxRow
                  id="option-buy"
                  label="Mua đứt pin"
                  checked={batteryOptionFilters.includes("buy")}
                  onChange={() => onBatteryOptionChange("buy")}
                />
              </div>
            </div>
          </>
        )}

        <Divider />

        {/* ── 5. Trạng thái kho ── */}
        <div>
          <GroupHeading
            icon={
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            }
          >
            Trạng thái
          </GroupHeading>
          <div className="space-y-0.5">
            <Switch
              id="stock-instock"
              label="Còn hàng trong kho"
              checked={inStockOnly}
              onChange={onInStockOnlyChange}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
