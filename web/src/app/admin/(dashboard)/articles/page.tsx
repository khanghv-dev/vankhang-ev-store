"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { API_CONFIG } from "@/config/apiConfig";

interface ArticleListItem {
  id: string;
  title: string;
  slug: string;
  content: string;
  imageThumbnail: string | null;
  status: string;
  viewCount: number;
  authorId: string;
  createdAt: string;
  updatedAt: string | null;
}

export default function AdminArticlesListPage() {
  const { adminUser, adminToken } = useAdminAuth();
  const router = useRouter();

  // View Mode: "grid" (Dạng Lưới Thẻ Card) hoặc "table" (Dạng Bảng)
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchArticles = useCallback(async () => {
    if (!adminToken) return;
    setIsLoading(true);
    setErrorMsg("");
    try {
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
      const statusParam = statusFilter ? `&status=${encodeURIComponent(statusFilter)}` : "";

      const response = await fetch(
        `${API_CONFIG.ORDER_URL}/api/admin/articles?page=${page}&pageSize=${pageSize}${searchParam}${statusParam}`,
        {
          headers: {
            "Authorization": `Bearer ${adminToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setArticles(data.items || []);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        setErrorMsg("Không thể tải danh sách bài viết CMS.");
      }
    } catch (err) {
      console.error("Lỗi tải danh sách bài viết:", err);
      setArticles([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, statusFilter, adminToken]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleDeleteArticle = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn XÓA bài viết '${title}' khỏi hệ thống CMS?`)) return;
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const response = await fetch(`${API_CONFIG.ORDER_URL}/api/admin/articles/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${adminToken || ""}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMsg(`✓ ${data.message || "Xóa bài viết thành công!"}`);
        fetchArticles();
      } else {
        setErrorMsg(data.message || "Không thể xóa bài viết.");
      }
    } catch (err) {
      console.error("Lỗi xóa bài:", err);
      setErrorMsg("Lỗi kết nối API.");
    }
  };

  // Strip HTML tags for clean text preview
  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>?/gm, "").trim();
  };

  if (!adminUser) return null;

  return (
    <div className="min-h-screen bg-[#F5F7FB] font-sans text-[#374151] p-4 sm:p-8 select-none">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Panel */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)] relative overflow-hidden gap-4">
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/admin/dashboard")}
                className="text-[#6B7280] hover:text-[#111827] transition-colors text-xs font-semibold"
              >
                ◀ Trang chủ Admin
              </button>
              <span className="text-[#D1D5DB]">/</span>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#111827] flex items-center gap-2">
                <span>📰</span> Quản Lý Bài Viết & Content Marketing CMS
              </h1>
            </div>
            <p className="text-xs text-[#6B7280] mt-1">
              Hệ thống quản trị nội dung bài viết tin tức, khuyến mãi và đánh giá xe điện VinFast O2O.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Switcher Toggle */}
            <div className="flex items-center bg-[#F9FAFB] p-1 rounded-xl border border-[#E5E7EB]">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === "grid"
                    ? "bg-[#E11D2E] text-white shadow-sm"
                    : "text-[#6B7280] hover:text-[#111827]"
                }`}
                title="Hiển thị dạng lưới thẻ Card"
              >
                <span>🔲</span> Lưới Thẻ Card
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === "table"
                    ? "bg-[#E11D2E] text-white shadow-sm"
                    : "text-[#6B7280] hover:text-[#111827]"
                }`}
                title="Hiển thị dạng Bảng dữ liệu"
              >
                <span>☰</span> Bảng Dữ Liệu
              </button>
            </div>

            <button
              onClick={() => router.push("/admin/articles/create")}
              className="px-5 py-2.5 bg-[#E11D2E] hover:bg-[#C8102E] text-white rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center gap-2"
            >
              <span>✍️</span> Đăng Bài Viết Mới
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-[#10B981] text-xs flex items-center justify-between shadow-sm">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg("")} className="text-emerald-600 font-bold">✕</button>
          </div>
        )}
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-[#EF4444] text-xs flex items-center justify-between shadow-sm">
            <span>⚠️ {errorMsg}</span>
            <button onClick={() => setErrorMsg("")} className="text-red-600 font-bold">✕</button>
          </div>
        )}

        {/* Dynamic Filter Bar */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)] grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">Tìm theo tiêu đề / slug</label>
            <div className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { setSearchQuery(searchInput); setPage(1); } }}
                placeholder="Nhập tiêu đề hoặc slug..."
                className="w-full bg-white border border-[#E5E7EB] text-[#111827] rounded-xl pl-4 pr-10 py-2.5 text-xs outline-none focus:border-[#E11D2E] transition-colors"
              />
              <button
                onClick={() => { setSearchQuery(searchInput); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#E11D2E]"
              >
                🔍
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">Trạng thái xuất bản</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full bg-white border border-[#E5E7EB] text-[#111827] rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#E11D2E] transition-colors"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="Published">Đã xuất bản (Published)</option>
              <option value="Draft">Bản nháp (Draft)</option>
            </select>
          </div>
        </div>

        {/* ── MAIN CONTENT DISPLAY (GRID CARD VIEW VS TABLE VIEW) ──────────────── */}
        {isLoading ? (
          <div className="p-20 text-center text-[#6B7280] flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-red-200 border-t-[#E11D2E] rounded-full animate-spin"></div>
            <span className="text-xs font-medium">Đang tải danh sách bài viết CMS...</span>
          </div>
        ) : articles.length === 0 ? (
          <div className="p-16 text-center text-[#6B7280] text-xs bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
            Không tìm thấy bài viết nào phù hợp với bộ lọc.
          </div>
        ) : viewMode === "grid" ? (
          
          /* 1. DẠNG LƯỚI THẺ CARD (GRID CARD VIEW DÀNH CHO MARKETING BAO QUÁT UI KHÁCH HÀNG) */
          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#E11D2E] animate-ping"></span>
                Xem Trước Giao Diện Bài Viết Khách Hàng ({totalCount} Bài viết)
              </h2>
              <span className="text-xs text-[#6B7280] font-mono">Trang {page} / {totalPages}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {articles.map((art) => (
                <div 
                  key={art.id}
                  className="group bg-white border border-[#E5E7EB] hover:border-[#E11D2E] rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Thumbnail Image Container */}
                  <div className="relative aspect-video w-full overflow-hidden bg-[#F9FAFB]">
                    <img
                      src={art.imageThumbnail || "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80"}
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Status Badge Overlay */}
                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-sm ${
                        art.status === "Published" 
                          ? "bg-emerald-500 text-white border border-emerald-400" 
                          : "bg-amber-500 text-white border border-amber-400"
                      }`}>
                        {art.status === "Published" ? "Published" : "Draft"}
                      </span>
                    </div>

                    {/* View Count Overlay */}
                    <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-xl bg-white/90 backdrop-blur-md text-[10px] font-bold font-mono text-[#10B981] border border-[#E5E7EB]">
                      👁️ {art.viewCount.toLocaleString("vi-VN")} lượt xem
                    </div>
                  </div>

                  {/* Card Content Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-bold text-[#111827] text-sm line-clamp-2 leading-snug group-hover:text-[#E11D2E] transition-colors">
                        {art.title}
                      </h3>
                      <p className="text-[11px] text-[#2563EB] font-mono mt-1 font-medium">
                        /tin-tuc/{art.slug}
                      </p>
                      <p className="text-xs text-[#6B7280] line-clamp-2 mt-2.5 leading-relaxed">
                        {stripHtml(art.content)}
                      </p>
                    </div>

                    {/* Footer Actions & Timestamp */}
                    <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between gap-2 mt-auto">
                      <span className="text-[10px] font-mono text-[#6B7280]">
                        {new Date(art.createdAt).toLocaleDateString("vi-VN")}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => window.open(`http://localhost:3000/tin-tuc/${art.slug}`, "_blank")}
                          className="px-2.5 py-1 bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#374151] rounded-lg text-[10px] font-bold transition-colors"
                          title="Xem giao diện người dùng"
                        >
                          🔗 Xem
                        </button>

                        <button
                          onClick={() => handleDeleteArticle(art.id, art.title)}
                          className="px-2 py-1 bg-red-50 hover:bg-red-100 text-[#EF4444] rounded-lg text-[10px] font-bold transition-colors border border-red-200"
                          title="Xóa bài viết"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>

        ) : (

          /* 2. DẠNG BẢNG DỮ LIỆU (TABLE VIEW DÀNH CHO QUẢN TRỊ VIÊN BẢO TRÌ BẢN GHI) */
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[#111827] uppercase tracking-wider">
                Bảng Báo Cáo Dữ Liệu Bài Viết ({totalCount})
              </h2>
              <span className="text-xs text-[#6B7280] font-mono">Trang {page} / {totalPages}</span>
            </div>

            <div className="overflow-x-auto border border-[#E5E7EB] rounded-xl bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#4B5563] font-semibold uppercase tracking-wider">
                    <th className="p-4 w-16 text-center">Ảnh</th>
                    <th className="p-4">Tiêu Đề & Slug SEO</th>
                    <th className="p-4 w-28 text-center">Lượt Xem</th>
                    <th className="p-4 w-32 text-center">Trạng Thái</th>
                    <th className="p-4 w-36">Ngày Tạo</th>
                    <th className="p-4 text-center w-36">Hành Động Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {articles.map((art) => (
                    <tr key={art.id} className="hover:bg-[#F3F4F6] transition-colors">
                      <td className="p-4 text-center">
                        <img
                          src={art.imageThumbnail || "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=100&auto=format&fit=crop&q=80"}
                          alt={art.title}
                          className="w-12 h-12 object-cover rounded-xl border border-[#E5E7EB] mx-auto"
                        />
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-[#111827] text-sm max-w-md">{art.title}</div>
                        <div className="text-[11px] text-[#2563EB] font-mono mt-1">/tin-tuc/{art.slug}</div>
                      </td>
                      <td className="p-4 text-center font-mono font-bold text-[#10B981]">
                        👁️ {art.viewCount.toLocaleString("vi-VN")}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          art.status === "Published" ? "bg-emerald-50 text-[#10B981] border border-emerald-200" : "bg-amber-50 text-[#F59E0B] border border-amber-200"
                        }`}>
                          {art.status === "Published" ? "Đã xuất bản" : "Bản nháp"}
                        </span>
                      </td>
                      <td className="p-4 text-[#6B7280] font-mono text-[11px]">
                        {new Date(art.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDeleteArticle(art.id, art.title)}
                          className="p-2 bg-red-50 hover:bg-red-100 text-[#EF4444] border border-red-200 rounded-xl text-xs transition-all font-semibold"
                        >
                          🗑️ Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#E5E7EB]">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1 || isLoading}
              className="px-4 py-2 bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              ◀ Trang trước
            </button>
            
            <span className="text-xs text-[#6B7280] font-medium">
              Trang <span className="text-[#E11D2E] font-bold">{page}</span> / {totalPages}
            </span>

            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page >= totalPages || isLoading}
              className="px-4 py-2 bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              Trang sau ▶
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
