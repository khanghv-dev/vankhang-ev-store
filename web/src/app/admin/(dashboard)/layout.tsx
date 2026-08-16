"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AdminRouteGuard from "@/components/AdminRouteGuard";
import { useAdminAuth } from "@/context/AdminAuthContext";

interface SidebarLink {
  label: string;
  href: string;
  icon: string;
  badge?: string;
}

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { adminUser, logoutAdmin } = useAdminAuth();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch real order notifications from Backend API
  useEffect(() => {
    async function fetchNotifications() {
      try {
        const token = localStorage.getItem("adminAccessToken");
        const res = await fetch("http://localhost:5022/api/admin/orders?page=1&pageSize=5", {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.items)) {
            setNotifications(data.items);
          }
        }
      } catch (e) {
        console.error("Error fetching admin notifications:", e);
      }
    }
    fetchNotifications();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target as Node)) {
        setIsNotificationPanelOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks: SidebarLink[] = [
    { label: "Bảng điều khiển", href: "/admin", icon: "📊" },
    { label: "Quản lý sản phẩm", href: "/admin/products", icon: "🚗" },
    { label: "Quản lý đơn hàng", href: "/admin/orders", icon: "📦" },
    { label: "Quản lý Showroom", href: "/admin/showroom", icon: "🏢" },
    { label: "Hệ thống Pin", href: "/admin/battery", icon: "⚡", badge: "Live" },
    { label: "Quản lý bài viết", href: "/admin/articles", icon: "📰" },
    { label: "Hỏi đáp FAQ CMS", href: "/admin/faqs", icon: "💬" },
    { label: "Tồn kho xe", href: "/admin/inventory", icon: "🏬" },
    { label: "Nhật ký hệ thống", href: "/admin/audit-logs", icon: "📜" },
  ];

  const handleLogout = () => {
    if (confirm("Bạn có chắc chắn muốn đăng xuất khỏi hệ thống Admin Panel?")) {
      logoutAdmin();
      router.push("/admin/login");
    }
  };

  // Dynamic Breadcrumbs Generator
  const getBreadcrumbs = () => {
    const paths = pathname.split("/").filter(Boolean);
    const breadcrumbs: { label: string; href: string }[] = [{ label: "Admin", href: "/admin" }];

    if (paths.length <= 1) {
      breadcrumbs.push({ label: "Bảng điều khiển", href: "/admin" });
      return breadcrumbs;
    }

    let currentPath = "/admin";
    for (let i = 1; i < paths.length; i++) {
      const segment = paths[i];
      currentPath += `/${segment}`;

      let label = segment;
      if (segment === "products") label = "Quản lý sản phẩm";
      else if (segment === "orders") label = "Quản lý đơn hàng";
      else if (segment === "showroom") label = "Quản lý Showroom";
      else if (segment === "battery") label = "Hệ thống Pin";
      else if (segment === "articles") label = "Quản lý bài viết";
      else if (segment === "create") label = "Thêm mới";
      else if (segment === "faqs") label = "Hỏi đáp FAQ CMS";
      else if (segment === "inventory") label = "Tồn kho xe";
      else if (segment.length > 20) label = "Chi tiết"; // UUID or Order ID

      breadcrumbs.push({ label, href: currentPath });
    }
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-[#F5F7FB] font-sans text-[#374151] flex overflow-hidden select-none">
        
        {/* MOBILE OVERLAY BACKDROP */}
        {isMobileSidebarOpen && (
          <div
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}

        {/* ── LEFT FIXED SIDEBAR ───────────────────────────────────────────── */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-[#E5E7EB] flex flex-col justify-between transition-transform duration-300 transform shadow-sm ${
            isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          {/* Sidebar Top Logo */}
          <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#E11D2E] to-[#C8102E] flex items-center justify-center font-black text-white text-base shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform">
                EV
              </div>
              <div>
                <div className="font-extrabold text-base tracking-tight text-[#111827] flex items-center gap-1.5">
                  EV O2O <span className="px-1.5 py-0.5 rounded-md bg-red-50 text-[#E11D2E] text-[10px] font-mono border border-red-200">Admin</span>
                </div>
                <div className="text-[10px] text-[#6B7280] font-mono">Platform Management Portal</div>
              </div>
            </Link>

            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden text-[#6B7280] hover:text-[#111827] font-bold p-1"
            >
              ✕
            </button>
          </div>

          {/* Sidebar Menu Links */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 custom-scrollbar">
            <div className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-wider text-[#6B7280]">
              Menu Quản Trị Hệ Thống
            </div>

            {navLinks.map((link) => {
              const isActive =
                link.href === "/admin"
                  ? pathname === "/admin" || pathname === "/admin/(dashboard)" || pathname === "/admin/dashboard"
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className={`group relative flex items-center justify-between px-4 py-3.5 rounded-xl text-xs transition-all duration-200 ${
                    isActive
                      ? "bg-[#FEE2E2] text-[#E11D2E] border-l-4 border-[#E11D2E] font-semibold shadow-sm"
                      : "text-[#374151] hover:bg-[#F9FAFB] hover:text-[#111827] font-medium"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-base transition-transform ${isActive ? "text-[#E11D2E]" : "text-[#6B7280] group-hover:text-[#111827]"}`}>
                      {link.icon}
                    </span>
                    <span>{link.label}</span>
                  </div>

                  {link.badge && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[9px] font-mono font-bold animate-pulse">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-[#E5E7EB] bg-[#F9FAFB] text-center">
            <span className="text-[10px] font-mono text-[#6B7280]">VinFast Enterprise O2O v2.5</span>
          </div>
        </aside>

        {/* ── RIGHT MAIN CONTENT CONTAINER ─────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-hidden">
          
          {/* ── TOPBAR HEADER TOOLBAR ──────────────────────────────────────── */}
          <header className="h-16 bg-white border-b border-[#E5E7EB] px-4 sm:px-8 flex items-center justify-between shrink-0 z-30 shadow-sm">
            
            {/* BÊN TRÁI: DYNAMIC BREADCRUMBS PHÂN CẤP */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden p-2 text-[#4B5563] hover:text-[#1F2937] rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] shrink-0"
              >
                ☰
              </button>

              <nav className="flex items-center gap-1.5 text-xs font-medium min-w-0 overflow-x-auto custom-scrollbar py-1">
                {breadcrumbs.map((bc, index) => {
                  const isLast = index === breadcrumbs.length - 1;
                  return (
                    <React.Fragment key={bc.href + index}>
                      {index > 0 && <span className="text-[#9CA3AF] select-none">/</span>}
                      {isLast ? (
                        <span className="font-extrabold text-[#1F2937] truncate px-2 py-0.5 bg-[#F3F4F6] rounded-lg border border-[#E5E7EB]">
                          {bc.label}
                        </span>
                      ) : (
                        <Link
                          href={bc.href}
                          className="text-[#6B7280] hover:text-[#E60012] transition-colors truncate"
                        >
                          {bc.label}
                        </Link>
                      )}
                    </React.Fragment>
                  );
                })}
              </nav>
            </div>

            {/* BÊN PHẢI: QUẢ CHUÔNG THÔNG BÁO & AVATAR HÌNH TRÒN DROPDOWN MENU */}
            <div className="flex items-center gap-3 shrink-0">
              
              {/* Nút 1: Thẻ Quả Chuông Thông Báo (Notification Bell) */}
              <div className="relative" ref={notificationDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsNotificationPanelOpen(!isNotificationPanelOpen)}
                  className="relative p-2.5 bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#4B5563] hover:text-[#1F2937] rounded-2xl border border-[#E5E7EB] transition-colors shadow-sm flex items-center justify-center"
                  title="Thông báo hệ thống"
                >
                  <span className="text-base">🔔</span>
                  {/* Badge số thông báo mới */}
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#E60012] text-white font-black text-[9px] rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {/* Dropdown Panel Thông Báo */}
                {isNotificationPanelOpen && (
                  <div className="absolute right-0 mt-3 w-80 bg-white border border-[#E5E7EB] rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.06)] p-4 space-y-3 z-50 animate-fadeIn">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
                      <h4 className="text-xs font-bold text-[#1F2937] uppercase tracking-wider flex items-center gap-1.5">
                        <span>🔔</span> Thông Báo Đơn Hàng Mới
                      </h4>
                      <span className="text-[10px] text-[#E60012] font-mono font-bold">
                        {notifications.length} mới
                      </span>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1 text-xs">
                      {notifications.length > 0 ? (
                        notifications.map((item: any, idx: number) => (
                          <div
                            key={item.orderId || item.id || idx}
                            onClick={() => {
                              router.push(`/admin/orders/${item.orderId || item.id}`);
                              setIsNotificationPanelOpen(false);
                            }}
                            className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] space-y-1 hover:border-red-300 hover:bg-red-50/50 transition-colors cursor-pointer"
                          >
                            <div className="font-bold text-[#1F2937] flex justify-between">
                              <span>🎉 Đơn cọc {item.items?.[0]?.productName || item.productName || "xe"} mới</span>
                              <span className="text-[10px] font-mono text-[#6B7280]">Mới</span>
                            </div>
                            <p className="text-[11px] text-[#4B5563]">
                              Khách {item.customerName || "hàng"} vừa đặt cọc {(item.depositAmount || 0).toLocaleString("vi-VN")}đ.
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-[#9CA3AF] font-semibold">
                          Chưa có thông báo đơn hàng mới
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="h-5 w-px bg-[#E5E7EB]"></div>

              {/* Nút 2: Avatar Hình Tròn Admin & Profile Dropdown Menu */}
              <div className="relative" ref={profileDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2.5 p-1 rounded-full hover:bg-[#F3F4F6] transition-colors border border-transparent hover:border-[#E5E7EB]"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#E60012] to-[#C80010] text-white font-extrabold flex items-center justify-center text-sm shadow-md ring-2 ring-red-500/20">
                    {adminUser?.username ? adminUser.username.charAt(0).toUpperCase() : "A"}
                  </div>
                  <span className="text-xs font-bold text-[#1F2937] hidden md:inline-block pr-1">
                    {adminUser?.username || "Admin"}
                  </span>
                  <span className="text-[10px] text-[#6B7280] hidden md:inline-block">▼</span>
                </button>

                {/* DROPDOWN MENU KHI CLICK AVATAR */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-white border border-[#E5E7EB] rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.06)] p-4 space-y-3 z-50 animate-fadeIn">
                    
                    {/* Header profile info */}
                    <div className="flex items-center gap-3 pb-3 border-b border-[#E5E7EB]">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#E60012] to-[#C80010] text-white font-bold flex items-center justify-center text-sm shadow-md">
                        {adminUser?.username ? adminUser.username.charAt(0).toUpperCase() : "A"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-[#1F2937] truncate">{adminUser?.username || "Super Admin"}</div>
                        <div className="text-[10px] text-[#6B7280] font-mono truncate">{adminUser?.email || "admin@evo2o.vn"}</div>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded bg-red-50 text-[#E60012] text-[9px] font-bold uppercase border border-red-200">
                          {adminUser?.roles?.[0] || "Administrator"}
                        </span>
                      </div>
                    </div>

                    {/* Menu links */}
                    <div className="space-y-1 text-xs font-semibold">
                      <button
                        onClick={() => { setIsProfileMenuOpen(false); router.push("/admin"); }}
                        className="w-full text-left px-3 py-2 rounded-xl text-[#374151] hover:bg-[#F3F4F6] hover:text-[#1F2937] transition-colors flex items-center gap-2"
                      >
                        <span>👤</span> Trang Cá Nhân
                      </button>
                      <button
                        onClick={() => { setIsProfileMenuOpen(false); router.push("/doi-mat-khau"); }}
                        className="w-full text-left px-3 py-2 rounded-xl text-[#374151] hover:bg-[#F3F4F6] hover:text-[#1F2937] transition-colors flex items-center gap-2"
                      >
                        <span>🔑</span> Đổi Mật Khẩu
                      </button>
                    </div>

                    {/* NÚT ĐĂNG XUẤT */}
                    <div className="pt-2 border-t border-[#E5E7EB]">
                      <button
                        type="button"
                        onClick={() => { setIsProfileMenuOpen(false); handleLogout(); }}
                        className="w-full text-left px-3 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-[#EF4444] font-bold transition-colors flex items-center gap-2 border border-red-200"
                      >
                        <span>🚪</span> Đăng Xuất Hệ Thống
                      </button>
                    </div>

                  </div>
                )}
              </div>

            </div>

          </header>

          {/* Independent Child Route Content Area */}
          <main className="flex-1 overflow-y-auto bg-[#F5F7FA]">
            {children}
          </main>

        </div>

      </div>
    </AdminRouteGuard>
  );
}
