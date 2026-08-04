"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";

interface AuditLogItem {
  id: string;
  timestamp: string;
  adminUsername: string;
  action: string;
  description: string;
  ipAddress: string;
  userAgent: string | null;
}

export default function AdminAuditLogsPage() {
  const { adminUser, adminToken } = useAdminAuth();
  const router = useRouter();

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchAuditLogs = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
      const response = await fetch(
        `http://localhost:5022/api/admin/audit-logs?page=${page}&pageSize=${pageSize}${searchParam}`,
        {
          headers: {
            "Authorization": `Bearer ${adminToken || ""}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setLogs(data.items || []);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        setErrorMsg("Không thể tải nhật ký hoạt động hệ thống.");
      }
    } catch (err) {
      console.error("Lỗi tải audit logs:", err);
      setLogs([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, adminToken]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

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
                <span>📜</span> Nhật Ký Hoạt Động Kiểm Toán Hệ Thống (Audit Logs)
              </h1>
            </div>
            <p className="text-xs text-[#6B7280] mt-1">
              Tra cứu bảo mật vận hành, lịch sử thao tác của tài khoản Admin và địa chỉ IP thực hiện khi xảy ra sự cố.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 bg-red-50 border border-red-200 text-[#E11D2E] rounded-xl text-xs font-mono font-bold flex items-center gap-1.5">
              <span>🔒</span> Security Audit Log Logged
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">Tìm kiếm lịch sử theo Admin, Hành động, Chi tiết hoặc IP</label>
          <div className="relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { setSearchQuery(searchInput); setPage(1); } }}
              placeholder="Nhập tên tài khoản (VD: admin_marketing), hành động (UPDATE_PRICE) hoặc địa chỉ IP..."
              className="w-full bg-white border border-[#E5E7EB] text-[#111827] rounded-xl pl-4 pr-24 py-2.5 text-xs outline-none focus:border-[#E11D2E] transition-colors"
            />
            <button
              onClick={() => { setSearchQuery(searchInput); setPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#E11D2E] font-bold text-xs"
            >
              🔍 Tìm Kiếm
            </button>
          </div>
        </div>

        {/* AUDIT LOGS TAILWIND TABLE */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E11D2E] animate-pulse"></span>
              Lịch Sử Thao Tác Kiểm Toán ({totalCount})
            </h2>
            <span className="text-xs text-[#6B7280] font-mono">Trang {page} / {totalPages}</span>
          </div>

          <div className="overflow-x-auto border border-[#E5E7EB] rounded-xl bg-white">
            {isLoading ? (
              <div className="p-16 text-center text-[#6B7280] flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-3 border-red-200 border-t-[#E11D2E] rounded-full animate-spin"></div>
                <span className="text-xs font-medium">Đang truy xuất nhật ký kiểm toán...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-16 text-center text-[#6B7280] text-xs">
                Không tìm thấy nhật ký thao tác nào phù hợp.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#4B5563] font-semibold uppercase tracking-wider">
                    <th className="p-4 w-44">Thời Gian Thao Tác</th>
                    <th className="p-4 w-40">Tài Khoản Admin</th>
                    <th className="p-4 w-48">Mã Hành Động</th>
                    <th className="p-4">Nội Dung Thực Hiện Chi Tiết</th>
                    <th className="p-4 w-40 text-right">Địa Chỉ IP Trích Xuất</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F3F4F6] transition-colors">
                      
                      {/* Timestamp */}
                      <td className="p-4 font-mono text-[#6B7280] text-[11px] whitespace-nowrap">
                        ⏰ {new Date(log.timestamp).toLocaleString("vi-VN")}
                      </td>

                      {/* Admin Username */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-red-50 border border-red-200 text-[#E11D2E] font-bold text-[10px] flex items-center justify-center">
                            {log.adminUsername.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-[#111827]">{log.adminUsername}</span>
                        </div>
                      </td>

                      {/* Action Code */}
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider ${
                          log.action.includes("PRICE") ? "bg-amber-50 text-[#F59E0B] border border-amber-200" :
                          log.action.includes("VIN") ? "bg-blue-50 text-[#2563EB] border border-blue-200" :
                          log.action.includes("REFUND") ? "bg-red-50 text-[#EF4444] border border-red-200" :
                          "bg-emerald-50 text-[#10B981] border border-emerald-200"
                        }`}>
                          {log.action}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="p-4 text-[#374151] font-medium leading-normal max-w-lg">
                        {log.description}
                      </td>

                      {/* IP Address */}
                      <td className="p-4 text-right font-mono text-[#2563EB] font-semibold text-[11px]">
                        <span className="px-2.5 py-1 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] inline-flex items-center gap-1">
                          🌐 {log.ipAddress}
                        </span>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

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
    </div>
  );
}
