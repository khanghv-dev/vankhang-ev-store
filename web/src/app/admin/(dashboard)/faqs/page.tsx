"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string | null;
}

export default function AdminFaqsPage() {
  const { adminUser, adminToken } = useAdminAuth();
  const router = useRouter();

  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [openFaqIds, setOpenFaqIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Edit / Create Modal State
  const [selectedFaqForEdit, setSelectedFaqForEdit] = useState<FaqItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [questionInput, setQuestionInput] = useState("");
  const [answerInput, setAnswerInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("Bảo hành");
  const [displayOrderInput, setDisplayOrderInput] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchFaqs = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const categoryParam = activeCategory !== "ALL" ? `?category=${encodeURIComponent(activeCategory)}` : "";
      const response = await fetch(`http://localhost:5022/api/admin/faqs${categoryParam}`, {
        headers: {
          "Authorization": `Bearer ${adminToken || ""}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFaqs(data || []);
        if (data.length > 0 && openFaqIds.length === 0) {
          setOpenFaqIds([data[0].id]);
        }
      } else {
        setErrorMsg("Không thể tải danh sách câu hỏi thường gặp.");
      }
    } catch (err) {
      console.error("Lỗi tải FAQ:", err);
      // Fallback mock data showcase
      const mockData: FaqItem[] = [
        {
          id: "f0000000-0000-0000-0000-000000000001",
          question: "Thời gian bảo hành xe ô tô điện VinFast là bao lâu?",
          answer: "VinFast áp dụng chính sách bảo hành chính hãng lên tới 10 năm hoặc 200.000 km (tùy điều kiện nào đến trước) cho các dòng xe ô tô điện cao cấp. Đối với các dòng xe máy điện, thời gian bảo hành chính hãng lên tới 5 năm không giới hạn km.",
          category: "Bảo hành",
          displayOrder: 1,
          createdAt: new Date().toISOString(),
          updatedAt: null
        },
        {
          id: "f0000000-0000-0000-0000-000000000002",
          question: "Thủ tục mua xe trả góp cần chuẩn bị những giấy tờ gì?",
          answer: "Quý khách chỉ cần chuẩn bị Căn cước công dân (CCCD gắn chip) và chứng minh thu nhập hàng tháng. VinFast hỗ trợ vay tối đa 80% giá trị xe với lãi suất ưu đãi đặc biệt 0% trong 2 năm đầu tiên.",
          category: "Trả góp",
          displayOrder: 2,
          createdAt: new Date().toISOString(),
          updatedAt: null
        },
        {
          id: "f0000000-0000-0000-0000-000000000003",
          question: "Gói thuê pin LFP thế hệ mới khác gì so với mua đứt pin?",
          answer: "Gói thuê pin giúp giảm chi phí mua xe ban đầu đáng kể (lên đến hàng trăm triệu đồng). Đồng thời, VinFast sẽ chịu toàn bộ rủi ro về chai pin và thực hiện sửa chữa hoặc thay thế bộ pin mới hoàn toàn miễn phí khi dung lượng pin tối đa xuống dưới 70%.",
          category: "Pin",
          displayOrder: 3,
          createdAt: new Date().toISOString(),
          updatedAt: null
        }
      ];
      setFaqs(mockData);
      if (openFaqIds.length === 0) setOpenFaqIds([mockData[0].id]);
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory, adminToken, openFaqIds.length]);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  // Accordion toggle handler
  const toggleAccordion = (id: string) => {
    setOpenFaqIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Reorder Handler (Tăng/Giảm thứ tự ưu tiên)
  const handleReorder = async (id: string, currentOrder: number, direction: "up" | "down") => {
    const newOrder = direction === "up" ? Math.max(1, currentOrder - 1) : currentOrder + 1;
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const response = await fetch(`http://localhost:5022/api/admin/faqs/${id}/reorder`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken || ""}`,
        },
        body: JSON.stringify({ newDisplayOrder: newOrder }),
      });

      if (response.ok) {
        setSuccessMsg(`✓ Đã cập nhật thứ tự hiển thị thành ${newOrder}`);
        fetchFaqs();
      } else {
        setErrorMsg("Không thể cập nhật thứ tự.");
      }
    } catch (err) {
      console.error("Lỗi đổi vị trí:", err);
      // Fallback local update for showcase
      setFaqs((prev) =>
        prev.map((item) => (item.id === id ? { ...item, displayOrder: newOrder } : item))
      );
    }
  };

  // Open Edit Modal
  const openEditModal = (faq: FaqItem) => {
    setSelectedFaqForEdit(faq);
    setQuestionInput(faq.question);
    setAnswerInput(faq.answer);
    setCategoryInput(faq.category);
    setDisplayOrderInput(faq.displayOrder);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFaqForEdit) return;
    setIsSubmitting(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const response = await fetch(`http://localhost:5022/api/admin/faqs/${selectedFaqForEdit.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken || ""}`,
        },
        body: JSON.stringify({
          question: questionInput,
          answer: answerInput,
          category: categoryInput,
          displayOrder: displayOrderInput,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMsg("✓ Cập nhật nội dung câu chữ FAQ thành công!");
        setSelectedFaqForEdit(null);
        fetchFaqs();
      } else {
        setErrorMsg(data.message || "Lỗi khi cập nhật.");
      }
    } catch (err) {
      console.error("Lỗi cập nhật:", err);
      setErrorMsg("Lỗi kết nối API.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Create Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const response = await fetch("http://localhost:5022/api/admin/faqs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken || ""}`,
        },
        body: JSON.stringify({
          question: questionInput,
          answer: answerInput,
          category: categoryInput,
          displayOrder: displayOrderInput,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMsg("🎉 Thêm câu hỏi thường gặp FAQ mới thành công!");
        setShowCreateModal(false);
        setQuestionInput("");
        setAnswerInput("");
        fetchFaqs();
      } else {
        setErrorMsg(data.message || "Lỗi khi tạo FAQ.");
      }
    } catch (err) {
      console.error("Lỗi tạo FAQ:", err);
      setErrorMsg("Lỗi kết nối API.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete FAQ
  const handleDeleteFaq = async (id: string, question: string) => {
    if (!confirm(`Bạn có chắc chắn muốn XÓA câu hỏi '${question}'?`)) return;
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const response = await fetch(`http://localhost:5022/api/admin/faqs/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${adminToken || ""}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMsg(`✓ ${data.message || "Đã xóa câu hỏi thành công!"}`);
        fetchFaqs();
      } else {
        setErrorMsg(data.message || "Lỗi khi xóa.");
      }
    } catch (err) {
      console.error("Lỗi xóa FAQ:", err);
      setErrorMsg("Lỗi kết nối API.");
    }
  };

  if (!adminUser) return null;

  const categories = [
    { id: "ALL", label: "Tất cả danh mục", icon: "❓" },
    { id: "Bảo hành", label: "Bảo hành", icon: "🛡️" },
    { id: "Trả góp", label: "Trả góp", icon: "💳" },
    { id: "Pin", label: "Pin & Trạm Sạc", icon: "⚡" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FB] font-sans text-[#374151] p-4 sm:p-8 select-none">
      <div className="max-w-6xl mx-auto space-y-6">
        
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
                <span>💬</span> Quản Lý Câu Hỏi Thường Gặp (FAQ Accordion)
              </h1>
            </div>
            <p className="text-xs text-[#6B7280] mt-1">
              Quản lý các thắc mắc về bảo hành xe, trả góp và thuê pin LFP với giao diện hộc xổ xuống Accordion trực quan.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setQuestionInput("");
                setAnswerInput("");
                setCategoryInput("Bảo hành");
                setDisplayOrderInput(faqs.length + 1);
                setShowCreateModal(true);
              }}
              className="px-5 py-2.5 bg-[#E11D2E] hover:bg-[#C8102E] text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-2"
            >
              <span>➕</span> Thêm Câu Hỏi Mới
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

        {/* Category Switcher Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 border shadow-sm ${
                  isActive
                    ? "bg-[#FEE2E2] text-[#E11D2E] border-[#E11D2E] font-semibold"
                    : "bg-white text-[#374151] border-[#E5E7EB] hover:bg-[#F9FAFB]"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* ACCORDION LIST CONTAINER */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
            <h2 className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping"></span>
              Danh Sách Câu Hỏi ({faqs.length})
            </h2>
            <span className="text-[11px] text-[#6B7280]">Click vào câu hỏi để xổ xuống xem câu trả lời</span>
          </div>

          {isLoading ? (
            <div className="p-16 text-center text-[#6B7280] flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-red-200 border-t-[#E11D2E] rounded-full animate-spin"></div>
              <span className="text-xs font-medium">Đang tải danh sách FAQ...</span>
            </div>
          ) : faqs.length === 0 ? (
            <div className="p-16 text-center text-[#6B7280] text-xs bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
              Không có câu hỏi FAQ nào trong danh mục này.
            </div>
          ) : (
            <div className="space-y-3 shadow-sm">
              {faqs.map((faq) => {
                const isOpen = openFaqIds.includes(faq.id);
                return (
                  <div
                    key={faq.id}
                    className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                      isOpen
                        ? "bg-[#F9FAFB] border-[#E11D2E] shadow-sm"
                        : "bg-white border-[#E5E7EB] hover:border-[#D1D5DB] hover:bg-[#F9FAFB]"
                    }`}
                  >
                    {/* ACCORDION HEADER (Clickable Question Row) */}
                    <div
                      onClick={() => toggleAccordion(faq.id)}
                      className="p-4 cursor-pointer flex items-center justify-between gap-4 select-none"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="w-7 h-7 rounded-lg bg-red-50 border border-red-200 text-[#E11D2E] font-bold text-xs flex items-center justify-center shrink-0">
                          #{faq.displayOrder}
                        </span>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                          faq.category === "Bảo hành" ? "bg-cyan-50 text-cyan-700 border border-cyan-200" :
                          faq.category === "Trả góp" ? "bg-purple-50 text-purple-700 border border-purple-200" :
                          "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {faq.category}
                        </span>

                        <h3 className={`text-xs sm:text-sm font-bold transition-colors ${
                          isOpen ? "text-[#E11D2E]" : "text-[#111827]"
                        }`}>
                          {faq.question}
                        </h3>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Control Buttons (Nút sửa nhanh & đổi vị trí) */}
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {/* Reorder Up */}
                          <button
                            type="button"
                            onClick={() => handleReorder(faq.id, faq.displayOrder, "up")}
                            className="w-7 h-7 bg-white hover:bg-[#F3F4F6] text-[#374151] rounded-lg text-xs font-bold flex items-center justify-center border border-[#D1D5DB] transition-colors shadow-sm"
                            title="Đổi vị trí lên trước"
                          >
                            ▲
                          </button>
                          {/* Reorder Down */}
                          <button
                            type="button"
                            onClick={() => handleReorder(faq.id, faq.displayOrder, "down")}
                            className="w-7 h-7 bg-white hover:bg-[#F3F4F6] text-[#374151] rounded-lg text-xs font-bold flex items-center justify-center border border-[#D1D5DB] transition-colors shadow-sm"
                            title="Đổi vị trí xuống sau"
                          >
                            ▼
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(faq)}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#2563EB] border border-blue-200 rounded-xl text-[11px] font-bold transition-colors flex items-center gap-1"
                            title="Sửa nhanh nội dung"
                          >
                            <span>✏️</span> Sửa
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteFaq(faq.id, faq.question)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-[#EF4444] rounded-xl text-[11px] transition-colors border border-red-200"
                            title="Xóa câu hỏi"
                          >
                            🗑️
                          </button>
                        </div>

                        {/* Accordion Arrow Icon */}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[#6B7280] text-xs transition-transform duration-300 ${
                          isOpen ? "rotate-180 text-[#E11D2E]" : ""
                        }`}>
                          ▼
                        </div>
                      </div>
                    </div>

                    {/* ACCORDION COLLAPSIBLE CONTENT (Hộc nội dung câu trả lời xổ xuống) */}
                    {isOpen && (
                      <div className="px-5 pb-5 pt-2 border-t border-[#E5E7EB] bg-white text-xs leading-relaxed text-[#374151] space-y-2">
                        <div className="flex items-start gap-2 text-[#10B981] font-bold text-[11px] uppercase tracking-wider mb-1">
                          <span>💡</span> Câu Trả Lời Chi Tiết:
                        </div>
                        <p className="pl-6 text-[#374151] leading-normal font-sans">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* EDIT MODAL */}
      {selectedFaqForEdit && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 max-w-lg w-full shadow-[0_4px_16px_rgba(0,0,0,0.1)] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
              <h3 className="text-base font-bold text-[#111827] flex items-center gap-2">
                <span>✏️</span> Chỉnh Sửa Nhanh FAQ
              </h3>
              <button type="button" onClick={() => setSelectedFaqForEdit(null)} className="text-[#6B7280] hover:text-[#111827] font-bold">✕</button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">Câu hỏi (Question)</label>
                <input
                  type="text"
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  required
                  className="w-full bg-white border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs outline-none focus:border-[#E11D2E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">Câu trả lời chi tiết (Answer)</label>
                <textarea
                  value={answerInput}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  rows={4}
                  required
                  className="w-full bg-white border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs outline-none focus:border-[#E11D2E] leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">Danh mục</label>
                  <select
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    className="w-full bg-white border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs outline-none focus:border-[#E11D2E]"
                  >
                    <option value="Bảo hành">Bảo hành</option>
                    <option value="Trả góp">Trả góp</option>
                    <option value="Pin">Pin & Trạm Sạc</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">Thứ tự hiển thị (Order)</label>
                  <input
                    type="number"
                    min={1}
                    value={displayOrderInput}
                    onChange={(e) => setDisplayOrderInput(parseInt(e.target.value) || 1)}
                    className="w-full bg-white border border-[#E5E7EB] text-[#111827] font-mono rounded-xl p-3 text-xs outline-none focus:border-[#E11D2E]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedFaqForEdit(null)}
                  className="px-4 py-2 bg-white border border-[#E5E7EB] text-[#374151] rounded-xl text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-[#E11D2E] hover:bg-[#C8102E] text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? "Đang lưu..." : "Lưu Thay Đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 max-w-lg w-full shadow-[0_4px_16px_rgba(0,0,0,0.1)] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
              <h3 className="text-base font-bold text-[#111827] flex items-center gap-2">
                <span>➕</span> Thêm Câu Hỏi Thường Gặp Mới
              </h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-[#6B7280] hover:text-[#111827] font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">Câu hỏi (Question) *</label>
                <input
                  type="text"
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  placeholder="Ví dụ: Thời gian sạc pin VF 8 tại trạm sạc siêu nhanh là bao lâu?"
                  required
                  className="w-full bg-white border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs outline-none focus:border-[#E11D2E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">Câu trả lời chi tiết (Answer) *</label>
                <textarea
                  value={answerInput}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  placeholder="Nhập câu trả lời chi tiết giải đáp thắc mắc khách hàng..."
                  rows={4}
                  required
                  className="w-full bg-white border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs outline-none focus:border-[#E11D2E] leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">Danh mục</label>
                  <select
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    className="w-full bg-white border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs outline-none focus:border-[#E11D2E]"
                  >
                    <option value="Bảo hành">Bảo hành</option>
                    <option value="Trả góp">Trả góp</option>
                    <option value="Pin">Pin & Trạm Sạc</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">Thứ tự hiển thị (Order)</label>
                  <input
                    type="number"
                    min={1}
                    value={displayOrderInput}
                    onChange={(e) => setDisplayOrderInput(parseInt(e.target.value) || 1)}
                    className="w-full bg-white border border-[#E5E7EB] text-[#111827] font-mono rounded-xl p-3 text-xs outline-none focus:border-[#E11D2E]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-white border border-[#E5E7EB] text-[#374151] rounded-xl text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-[#E11D2E] hover:bg-[#C8102E] text-white font-extrabold rounded-xl text-xs shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? "Đang thêm..." : "Tạo Mới FAQ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
