"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import RichTextEditor from "@/components/RichTextEditor";

export default function CreateArticlePage() {
  const { adminUser, adminToken } = useAdminAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [imageThumbnail, setImageThumbnail] = useState("https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80");
  const [status, setStatus] = useState<"Draft" | "Published">("Published");
  const [content, setContent] = useState("<p>Hãy nhập nội dung chi tiết bài viết tin tức hoặc đánh giá xe điện tại đây...</p>");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!title.trim()) {
      setErrorMsg("Vui lòng nhập tiêu đề bài viết.");
      return;
    }
    if (!content.trim()) {
      setErrorMsg("Vui lòng nhập nội dung chi tiết bài viết.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:5022/api/admin/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken || ""}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim() || undefined,
          content: content,
          imageThumbnail: imageThumbnail.trim() || undefined,
          status: status,
          authorId: adminUser?.id || undefined,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMsg(`🎉 Tạo bài viết mới thành công! Slug: ${data.slug}`);
        setTimeout(() => {
          router.push("/admin/articles");
        }, 1500);
      } else {
        setErrorMsg(data.message || "Không thể tạo bài viết.");
      }
    } catch (err) {
      console.error("Lỗi đăng bài:", err);
      setErrorMsg("Lỗi kết nối Order Service API (Port 5022).");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!adminUser) return null;

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 p-4 sm:p-8 select-none">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Panel */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-2xl gap-4">
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/admin/articles")}
                className="text-slate-400 hover:text-white transition-colors text-xs font-semibold"
              >
                ◀ Danh sách bài viết
              </button>
              <span className="text-slate-700">/</span>
              <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                <span>✍️</span> Đăng Bài Viết Tin Tức Mới
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Trình biên soạn WYSIWYG hỗ trợ định dạng văn bản, chèn hình ảnh và nhúng video YouTube.
            </p>
          </div>
        </div>

        {/* Global Notifications */}
        {successMsg && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs shadow-lg">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs shadow-lg">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Article Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-2xl space-y-5">
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Tiêu đề bài viết (Title) *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: VinFast Khai Trương Trạm Sạc Siêu Nhanh 360kW Mới..."
                required
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-2xl p-4 text-sm font-semibold outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Đường dẫn SEO (Slug tùy chỉnh - Không bắt buộc)
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="Để trống hệ thống sẽ tự động tạo từ tiêu đề..."
                  className="w-full bg-slate-950 border border-slate-800 text-slate-300 font-mono rounded-xl p-3 text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Trạng thái bài viết
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-3 text-xs outline-none focus:border-blue-500"
                >
                  <option value="Published">🚀 Xuất bản ngay (Published)</option>
                  <option value="Draft">📝 Lưu bản nháp (Draft)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                URL Ảnh Đại Diện Thumbnail
              </label>
              <input
                type="url"
                value={imageThumbnail}
                onChange={(e) => setImageThumbnail(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full bg-slate-950 border border-slate-800 text-slate-300 font-mono rounded-xl p-3 text-xs outline-none focus:border-blue-500"
              />
            </div>

          </div>

          {/* Rich Text Editor Component Integration */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 px-1">
              Nội dung bài viết chi tiết (WYSIWYG Editor) *
            </label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Nội dung chi tiết bài viết..."
            />
          </div>

          {/* Form Submit Footer */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push("/admin/articles")}
              className="px-6 py-3 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-2xl text-xs font-semibold transition-colors"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-2xl text-xs tracking-wide shadow-xl hover:shadow-blue-500/25 transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Đang lưu bài..." : status === "Published" ? "🚀 Xuất Bản Bài Viết" : "📝 Lưu Bản Nháp"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
