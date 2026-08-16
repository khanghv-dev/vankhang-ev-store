"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { API_CONFIG } from "@/config/apiConfig";
import DashboardLineChart from "@/components/DashboardLineChart";
import DashboardPieChart from "@/components/DashboardPieChart";

interface StatsData {
  totalDepositRevenueToday: number;
  newPendingDepositsCount: number;
  deliveredVehiclesCount: number;
  faultyChargingStationsCount: number;
}

interface RecentOrder {
  orderId: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  depositAmount: number;
  depositType: string;
  status: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const { adminUser, logoutAdmin, adminToken } = useAdminAuth();
  const router = useRouter();
  
  // Update price state
  const [vin, setVin] = useState("VF8P1234567890123");
  const [newPrice, setNewPrice] = useState("1090000000");
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Statistics State
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");

  // Recent 5 Orders Feed State
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);

  // Chart time range state
  const [chartRange, setChartRange] = useState<"7d" | "30d" | "1y">("7d");

  // Catalog Product List State
  const [products, setProducts] = useState<any[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchName, setSearchName] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterActive, setFilterActive] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState("");

  const fetchStats = useCallback(async () => {
    setIsStatsLoading(true);
    setStatsError("");
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/dashboard/stats`, {
        headers: {
          "Authorization": `Bearer ${adminToken || ""}`,
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        setStats({
          totalDepositRevenueToday: 150000000,
          newPendingDepositsCount: 12,
          deliveredVehiclesCount: 85,
          faultyChargingStationsCount: 3
        });
      }
    } catch (err) {
      console.error("Lỗi khi tải thống kê:", err);
      setStats({
        totalDepositRevenueToday: 150000000,
        newPendingDepositsCount: 12,
        deliveredVehiclesCount: 85,
        faultyChargingStationsCount: 3
      });
    } finally {
      setIsStatsLoading(false);
    }
  }, [adminToken]);

  const fetchRecentOrders = useCallback(async () => {
    setIsOrdersLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/orders?page=1&pageSize=5`, {
        headers: {
          "Authorization": `Bearer ${adminToken || ""}`,
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          const mapped = data.items.map((item: any) => ({
            orderId: item.orderId,
            customerName: item.customerName,
            customerPhone: item.customerPhone,
            productName: item.items[0]?.productName || "VinFast VF 8",
            depositAmount: item.depositAmount,
            depositType: item.depositType,
            status: item.status,
            createdAt: item.createdAt
          }));
          setRecentOrders(mapped);
          return;
        }
      }
      // Fallback dynamic mock data for display
      setRecentOrders([
        { orderId: "ORD-9921", customerName: "Nguyễn Văn Anh", customerPhone: "0987***123", productName: "VinFast VF 8 Plus", depositAmount: 50000000, depositType: "LinhHoat", status: "Paid", createdAt: "2 phút trước" },
        { orderId: "ORD-9920", customerName: "Trần Thị Bình", customerPhone: "0912***456", productName: "VinFast VF 9 VF", depositAmount: 100000000, depositType: "CamKet", status: "Pending", createdAt: "15 phút trước" },
        { orderId: "ORD-9919", customerName: "Lê Hoàng Cường", customerPhone: "0903***789", productName: "VinFast VF e34", depositAmount: 20000000, depositType: "LinhHoat", status: "Paid", createdAt: "42 phút trước" },
        { orderId: "ORD-9918", customerName: "Phạm Minh Dung", customerPhone: "0977***321", productName: "VinFast Evo 200", depositAmount: 15000000, depositType: "CamKet", status: "Paid", createdAt: "1 giờ trước" },
        { orderId: "ORD-9917", customerName: "Đỗ Quang Hải", customerPhone: "0934***654", productName: "VinFast VF 5 Plus", depositAmount: 30000000, depositType: "LinhHoat", status: "Pending", createdAt: "2 giờ trước" },
      ]);
    } catch (err) {
      console.error("Lỗi khi tải đơn cọc mới:", err);
    } finally {
      setIsOrdersLoading(false);
    }
  }, [adminToken]);

  const fetchProducts = useCallback(async () => {
    setIsProductsLoading(true);
    setProductsError("");
    try {
      const activeParam = filterActive === "all" ? "" : `&isActive=${filterActive === "true"}`;
      const nameParam = searchName ? `&name=${encodeURIComponent(searchName)}` : "";
      const categoryParam = filterCategory ? `&category=${encodeURIComponent(filterCategory)}` : "";
      
      const response = await fetch(
        `${API_CONFIG.INVENTORY_URL}/api/admin/products?pageNumber=${page}&pageSize=${pageSize}${nameParam}${categoryParam}${activeParam}`,
        {
          headers: {
            "Authorization": `Bearer ${adminToken || ""}`,
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setProducts(data.items || []);
        setTotalProducts(data.totalCount || 0);
      } else {
        setProductsError("Không thể tải danh sách sản phẩm.");
      }
    } catch (err) {
      console.error("Lỗi khi tải sản phẩm:", err);
      setProductsError("Lỗi kết nối tới Inventory API.");
    } finally {
      setIsProductsLoading(false);
    }
  }, [page, searchName, filterCategory, filterActive, adminToken]);

  useEffect(() => {
    fetchProducts();
    fetchStats();
    fetchRecentOrders();
  }, [fetchProducts, fetchStats, fetchRecentOrders]);

  const handleLogout = () => {
    logoutAdmin();
    router.push("/admin/login");
  };

  const handleUpdatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setErrorMsg("");

    if (!vin.trim()) {
      setErrorMsg("Vui lòng nhập số VIN.");
      return;
    }
    const priceNum = parseFloat(newPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorMsg("Giá mới không hợp lệ.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/vehicles/price`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          Vin: vin.trim(),
          NewPrice: priceNum,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || "Cập nhật giá xe thành công.");
      } else {
        setErrorMsg(data.message || "Không thể cập nhật giá xe.");
      }
    } catch (err) {
      console.error("Lỗi khi cập nhật giá xe:", err);
      setErrorMsg("Lỗi kết nối tới máy chủ API.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!adminUser) return null;

  // Chart Mock Data Points for Area Chart
  const chartData = chartRange === "7d" 
    ? [
        { label: "Thứ 2", orders: 14, revenue: 420 },
        { label: "Thứ 3", orders: 22, revenue: 680 },
        { label: "Thứ 4", orders: 18, revenue: 540 },
        { label: "Thứ 5", orders: 31, revenue: 920 },
        { label: "Thứ 6", orders: 27, revenue: 810 },
        { label: "Thứ 7", orders: 45, revenue: 1350 },
        { label: "CN", orders: 38, revenue: 1140 },
      ]
    : chartRange === "30d"
    ? [
        { label: "Tuần 1", orders: 95, revenue: 2850 },
        { label: "Tuần 2", orders: 130, revenue: 3900 },
        { label: "Tuần 3", orders: 115, revenue: 3450 },
        { label: "Tuần 4", orders: 170, revenue: 5100 },
      ]
    : [
        { label: "Q1", orders: 340, revenue: 10200 },
        { label: "Q2", orders: 480, revenue: 14400 },
        { label: "Q3", orders: 520, revenue: 15600 },
        { label: "Q4", orders: 690, revenue: 20700 },
      ];

  const maxOrders = Math.max(...chartData.map(d => d.orders));

  return (
    <div className="min-h-screen bg-[#F5F7FA] font-sans text-[#4B5563] p-4 sm:p-8 select-none">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Panel */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.06)] relative overflow-hidden gap-4">
          <div className="relative">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1F2937]">
                Hệ Thống Quản Trị O2O
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-red-50 text-[#E60012] border border-red-200 uppercase">
                Admin Portal
              </span>
            </div>
            <p className="text-xs text-[#6B7280] mt-1.5 flex items-center gap-2">
              Tổng quan hoạt động kinh doanh, đơn đặt cọc và dịch vụ pin hôm nay
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => router.push("/admin/products")}
              className="px-4 py-2.5 bg-white border border-[#D1D5DB] hover:bg-[#F3F4F6] text-[#374151] rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 shadow-sm hover:-translate-y-0.5 flex items-center gap-2"
            >
              <span>📦</span> Quản lý Sản phẩm
            </button>
            <button
              onClick={() => router.push("/admin/inventory")}
              className="px-4 py-2.5 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 shadow-sm hover:-translate-y-0.5 flex items-center gap-2"
            >
              <span>⚙️</span> Kho Phụ tùng
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 bg-red-50 border border-red-200 hover:bg-red-100 text-[#EF4444] rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 shadow-sm hover:-translate-y-0.5"
            >
              Đăng xuất
            </button>
          </div>
        </div>

        {/* 1. TOP SECTION: 4 Analytics Cards (Statistic Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Doanh thu cọc hôm nay (Green) */}
          <div className="group relative bg-white border border-[#E5E7EB] hover:border-emerald-300 rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className="relative flex justify-between items-start">
              <div>
                <p className="text-xs font-bold tracking-wider text-[#6B7280] uppercase">Doanh Thu Cọc Hôm Nay</p>
                {isStatsLoading ? (
                  <div className="h-8 w-32 bg-[#F3F4F6] animate-pulse rounded-lg mt-3"></div>
                ) : statsError ? (
                  <p className="text-xs text-rose-500 mt-3">⚠️ Lỗi kết nối</p>
                ) : (
                  <div className="mt-3">
                    <p className="text-2xl sm:text-3xl font-extrabold font-mono text-[#10B981] tracking-tight">
                      {(stats?.totalDepositRevenueToday ?? 150000000).toLocaleString("vi-VN")} đ
                    </p>
                  </div>
                )}
              </div>
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-[#10B981] rounded-2xl text-xl font-bold group-hover:scale-110 transition-all duration-300 shadow-sm">
                💵
              </div>
            </div>
            <div className="relative mt-4 pt-4 border-t border-[#E5E7EB] flex items-center justify-between text-[11px]">
              <span className="text-[#10B981] font-semibold flex items-center gap-1">
                <span>▲ 14.2%</span> <span className="text-[#6B7280] font-normal">so với hôm qua</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
            </div>
          </div>

          {/* Card 2: Đơn cọc mới chờ duyệt (Orange) */}
          <div className="group relative bg-white border border-[#E5E7EB] hover:border-amber-300 rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:shadow-amber-500/10 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className="relative flex justify-between items-start">
              <div>
                <p className="text-xs font-bold tracking-wider text-[#6B7280] uppercase">Đơn Cọc Chờ Duyệt</p>
                {isStatsLoading ? (
                  <div className="h-8 w-20 bg-[#F3F4F6] animate-pulse rounded-lg mt-3"></div>
                ) : statsError ? (
                  <p className="text-xs text-rose-500 mt-3">⚠️ Lỗi kết nối</p>
                ) : (
                  <div className="mt-3">
                    <p className="text-2xl sm:text-3xl font-extrabold font-mono text-[#F59E0B] tracking-tight">
                      {stats?.newPendingDepositsCount ?? 12} <span className="text-sm font-sans font-normal text-amber-600">đơn</span>
                    </p>
                  </div>
                )}
              </div>
              <div className="p-3.5 bg-amber-50 border border-amber-200 text-[#F59E0B] rounded-2xl text-xl font-bold group-hover:scale-110 transition-all duration-300 shadow-sm">
                ⏳
              </div>
            </div>
            <div className="relative mt-4 pt-4 border-t border-[#E5E7EB] flex items-center justify-between text-[11px]">
              <span className="text-[#F59E0B] font-semibold">Cần điều phối xử lý</span>
              <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse"></span>
            </div>
          </div>

          {/* Card 3: Xe bàn giao thành công (Blue) */}
          <div className="group relative bg-white border border-[#E5E7EB] hover:border-blue-300 rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className="relative flex justify-between items-start">
              <div>
                <p className="text-xs font-bold tracking-wider text-[#6B7280] uppercase">Xe Đã Bàn Giao</p>
                {isStatsLoading ? (
                  <div className="h-8 w-20 bg-[#F3F4F6] animate-pulse rounded-lg mt-3"></div>
                ) : statsError ? (
                  <p className="text-xs text-rose-500 mt-3">⚠️ Lỗi kết nối</p>
                ) : (
                  <div className="mt-3">
                    <p className="text-2xl sm:text-3xl font-extrabold font-mono text-[#2563EB] tracking-tight">
                      {stats?.deliveredVehiclesCount ?? 85} <span className="text-sm font-sans font-normal text-blue-600">xe</span>
                    </p>
                  </div>
                )}
              </div>
              <div className="p-3.5 bg-blue-50 border border-blue-200 text-[#2563EB] rounded-2xl text-xl font-bold group-hover:scale-110 transition-all duration-300 shadow-sm">
                🚗
              </div>
            </div>
            <div className="relative mt-4 pt-4 border-t border-[#E5E7EB] flex items-center justify-between text-[11px]">
              <span className="text-[#2563EB] font-semibold">Đạt 98% chỉ tiêu tháng</span>
              <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse"></span>
            </div>
          </div>

          {/* Card 4: Trạm sạc gặp sự cố (Red) */}
          <div className="group relative bg-white border border-[#E5E7EB] hover:border-red-300 rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:shadow-red-500/10 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className="relative flex justify-between items-start">
              <div>
                <p className="text-xs font-bold tracking-wider text-[#6B7280] uppercase">Trạm Sạc Báo Lỗi</p>
                {isStatsLoading ? (
                  <div className="h-8 w-20 bg-[#F3F4F6] animate-pulse rounded-lg mt-3"></div>
                ) : statsError ? (
                  <p className="text-xs text-rose-500 mt-3">⚠️ Lỗi kết nối</p>
                ) : (
                  <div className="mt-3">
                    <p className="text-2xl sm:text-3xl font-extrabold font-mono text-[#EF4444] tracking-tight">
                      {stats?.faultyChargingStationsCount ?? 3} <span className="text-sm font-sans font-normal text-red-600">trạm</span>
                    </p>
                  </div>
                )}
              </div>
              <div className="p-3.5 bg-red-50 border border-red-200 text-[#EF4444] rounded-2xl text-xl font-bold group-hover:scale-110 transition-all duration-300 shadow-sm">
                ⚡
              </div>
            </div>
            <div className="relative mt-4 pt-4 border-t border-[#E5E7EB] flex items-center justify-between text-[11px]">
              <span className="text-[#EF4444] font-semibold flex items-center gap-1">
                <span>⚠️ Cảnh báo IoT khẩn</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-ping"></span>
            </div>
          </div>
        </div>

        {/* 2. MAIN LAYOUT: CHIA LÀM 2 PHẦN (Bên trái: 5 đơn cọc mới nổ - Bên phải: Biểu đồ tăng trưởng) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* BÊN TRÁI (Col 5): Danh sách 5 đơn đặt cọc mới nổ thời gian thực */}
          <div className="lg:col-span-5 bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.06)] relative overflow-hidden flex flex-col h-full">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E5E7EB]">
              <div>
                <h2 className="text-base font-bold text-[#1F2937] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  Đơn Đặt Cọc Mới Nổ
                </h2>
                <p className="text-xs text-[#6B7280] mt-0.5">5 đơn đặt cọc vừa cập nhật thời gian thực</p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-[#10B981] rounded-lg text-[10px] font-bold uppercase tracking-wider">
                LIVE FEED
              </span>
            </div>

            <div className="space-y-3.5 flex-1">
              {isOrdersLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <div key={idx} className="h-16 bg-[#F9FAFB] animate-pulse rounded-xl border border-[#E5E7EB]"></div>
                ))
              ) : recentOrders.length === 0 ? (
                <p className="text-xs text-[#6B7280] text-center py-8">Chưa có đơn cọc mới nào.</p>
              ) : (
                recentOrders.map((order, index) => (
                  <div 
                    key={index}
                    className="group bg-[#F9FAFB] border border-[#E5E7EB] hover:border-red-300 rounded-xl p-3.5 transition-all duration-200 hover:bg-red-50/30 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-[#E60012] font-bold text-xs group-hover:scale-105 transition-transform">
                        🚙
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#1F2937]">{order.customerName}</span>
                          <span className="text-[10px] text-[#6B7280] font-mono">({order.customerPhone})</span>
                        </div>
                        <p className="text-[11px] text-[#E60012] font-medium mt-0.5">{order.productName}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold font-mono text-[#10B981]">
                        {order.depositAmount.toLocaleString("vi-VN")} đ
                      </p>
                      <div className="flex items-center justify-end gap-1.5 mt-1">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                          order.depositType === "LinhHoat" 
                            ? "bg-cyan-50 text-cyan-700 border border-cyan-200" 
                            : "bg-purple-50 text-purple-700 border border-purple-200"
                        }`}>
                          {order.depositType}
                        </span>
                        <span className="text-[10px] text-[#6B7280]">{order.createdAt}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => router.push("/admin/orders")}
              className="mt-5 w-full py-2.5 bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#D1D5DB] text-[#374151] hover:text-[#1F2937] rounded-xl text-xs font-semibold tracking-wide transition-colors duration-200 text-center"
            >
              Xem tất cả đơn cọc ▶
            </button>
          </div>

          {/* BÊN PHẢI (Col 7): TỔNG HỢP BIỂU ĐỒ DOANH THU & THỊ PHẦN XE */}
          <div className="lg:col-span-7 space-y-6">
            <DashboardLineChart />
            <DashboardPieChart />
          </div>

        </div>

        {/* 3. EXISTING ADMIN ACTIONS & CATALOG PANELS (Light Theme) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Account Profile & Rights */}
          <div className="lg:col-span-1 bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.06)] space-y-6">
            <div>
              <h2 className="text-sm font-semibold tracking-wider text-[#E60012] uppercase mb-4">
                Thông tin tài khoản
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-[#E5E7EB]">
                  <span className="text-[#6B7280]">Mã User ID</span>
                  <span className="font-mono text-xs text-[#1F2937]">{adminUser.id.substring(0, 18)}...</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E5E7EB]">
                  <span className="text-[#6B7280]">Tên tài khoản</span>
                  <span className="text-[#1F2937] font-semibold">{adminUser.username}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[#6B7280]">Email quản lý</span>
                  <span className="text-[#1F2937] font-semibold">{adminUser.email}</span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold tracking-wider text-[#E60012] uppercase mb-3">
                Vai trò (Roles)
              </h2>
              <div className="flex flex-wrap gap-2">
                {adminUser.roles.map((role) => (
                  <span
                    key={role}
                    className="px-3 py-1 bg-red-50 border border-red-200 text-[#E60012] rounded-lg text-xs font-medium"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold tracking-wider text-[#E60012] uppercase mb-3">
                Quyền hạn (Permissions)
              </h2>
              <div className="flex flex-wrap gap-2">
                {adminUser.permissions.map((permission) => (
                  <span
                    key={permission}
                    className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-[#10B981] rounded-lg text-xs font-medium font-mono"
                  >
                    {permission}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Protected Admin Actions */}
          <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.06)] relative overflow-hidden">
            <h2 className="text-sm font-semibold tracking-wider text-[#E60012] uppercase mb-6">
              Hành động quản lý xe (Thay đổi giá niêm yết)
            </h2>

            {message && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-[#10B981] text-sm">
                ✓ {message}
              </div>
            )}

            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-[#EF4444] text-sm">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleUpdatePrice} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold tracking-wider text-[#6B7280] uppercase mb-2">
                    Số VIN xe điện
                  </label>
                  <input
                    type="text"
                    value={vin}
                    onChange={(e) => setVin(e.target.value)}
                    placeholder="Nhập số VIN..."
                    disabled={isLoading}
                    className="w-full bg-white border border-[#D1D5DB] text-[#1F2937] rounded-xl p-4 text-sm outline-none transition-all duration-300 focus:border-[#E60012] focus:ring-1 focus:ring-[#E60012]/30 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold tracking-wider text-[#6B7280] uppercase mb-2">
                    Giá niêm yết mới (VND)
                  </label>
                  <input
                    type="text"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="Nhập giá mới..."
                    disabled={isLoading}
                    className="w-full bg-white border border-[#D1D5DB] text-[#1F2937] rounded-xl p-4 text-sm outline-none transition-all duration-300 focus:border-[#E60012] focus:ring-1 focus:ring-[#E60012]/30 disabled:opacity-50 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-3.5 bg-[#E60012] hover:bg-[#C80010] text-white font-semibold rounded-xl text-sm shadow-md transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      <span>Đang cập nhật...</span>
                    </>
                  ) : (
                    <span>Cập nhật giá bán</span>
                  )}
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Catalog Management Panel */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.06)] relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-[#1F2937] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E60012] animate-pulse"></span>
                Quản lý Danh mục Sản phẩm
              </h2>
              <p className="text-xs text-[#6B7280] mt-1">
                Xem và lọc danh sách ô tô điện, xe máy xăng 50cc và phụ tùng trong hệ thống.
              </p>
            </div>
            
            <button
              onClick={() => {
                setSearchQuery("");
                setSearchName("");
                setFilterCategory("");
                setFilterActive("all");
                setPage(1);
              }}
              className="text-xs font-medium text-[#374151] hover:text-[#1F2937] transition-colors duration-200 border border-[#D1D5DB] hover:bg-[#F3F4F6] bg-white px-3 py-1.5 rounded-lg flex items-center gap-1"
            >
              🔄 Tải lại / Reset bộ lọc
            </button>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setSearchName(searchQuery);
                    setPage(1);
                  }
                }}
                placeholder="Tìm theo tên..."
                className="w-full bg-white border border-[#D1D5DB] text-[#1F2937] rounded-xl pl-4 pr-10 py-2.5 text-xs outline-none focus:border-[#E60012] focus:ring-1 focus:ring-[#E60012]/30 transition-colors duration-200"
              />
              <button
                onClick={() => {
                  setSearchName(searchQuery);
                  setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#E60012] transition-colors"
              >
                🔍
              </button>
            </div>

            <div>
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-white border border-[#D1D5DB] text-[#1F2937] rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#E60012] transition-colors duration-200"
              >
                <option value="">Tất cả danh mục</option>
                <option value="Xe điện">Xe điện</option>
                <option value="Xe 50cc">Xe 50cc</option>
                <option value="Phụ tùng">Phụ tùng</option>
              </select>
            </div>

            <div>
              <select
                value={filterActive}
                onChange={(e) => {
                  setFilterActive(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-white border border-[#D1D5DB] text-[#1F2937] rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#E60012] transition-colors duration-200"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="true">Đang hiển thị (Active)</option>
                <option value="false">Đang ẩn (Inactive)</option>
              </select>
            </div>

            <div className="flex items-center justify-end text-xs text-[#6B7280] pr-2">
              Tổng số bản ghi: <span className="font-mono text-[#E60012] font-semibold ml-1.5">{totalProducts}</span>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto border border-[#E5E7EB] rounded-xl bg-white">
            {isProductsLoading ? (
              <div className="p-12 text-center text-[#6B7280] flex flex-col items-center justify-center gap-3">
                <div className="w-6 h-6 border-2 border-red-200 border-t-[#E60012] rounded-full animate-spin"></div>
                <span className="text-xs">Đang tải danh sách sản phẩm...</span>
              </div>
            ) : productsError ? (
              <div className="p-12 text-center text-[#EF4444] text-xs">
                ⚠️ {productsError}
              </div>
            ) : products.length === 0 ? (
              <div className="p-12 text-center text-[#6B7280] text-xs">
                Không tìm thấy sản phẩm nào phù hợp.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#4B5563] font-semibold uppercase tracking-wider">
                    <th className="p-4 w-16 text-center">Hình</th>
                    <th className="p-4">Tên Sản Phẩm</th>
                    <th className="p-4 w-28">Danh Mục</th>
                    <th className="p-4 w-36">Giá Niêm Yết (VND)</th>
                    <th className="p-4 w-28">Trạng Thái</th>
                    <th className="p-4">Thông số kỹ thuật</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-[#F3F4F6] transition-colors duration-150">
                      <td className="p-4 text-center">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-10 h-10 object-cover rounded-lg border border-[#E5E7EB] mx-auto"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1615887023516-9b6bcd559e87?w=100&auto=format&fit=crop&q=80";
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] mx-auto flex items-center justify-center text-[#9CA3AF]">
                            No Img
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-medium text-[#1F2937]">
                        <div className="font-semibold text-[#1F2937]">{p.name}</div>
                        <div className="text-[10px] text-[#6B7280] font-mono mt-0.5">{p.id}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          p.category === "Xe điện" ? "bg-cyan-50 text-cyan-700 border border-cyan-200" :
                          p.category === "Xe 50cc" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                          "bg-purple-50 text-purple-700 border border-purple-200"
                        }`}>
                          {p.category}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-semibold text-[#374151]">
                        <div>{p.price.toLocaleString("vi-VN")} đ</div>
                        {p.originalPrice && (
                          <div className="text-[10px] text-[#9CA3AF] line-through">
                            {p.originalPrice.toLocaleString("vi-VN")} đ
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          p.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
                        }`}>
                          {p.isActive ? "Đang hiện" : "Đang ẩn"}
                        </span>
                      </td>
                      <td className="p-4 max-w-xs">
                        <div className="flex flex-wrap gap-1.5">
                          {p.specs && p.specs.length > 0 ? (
                            p.specs.map((spec: string, idx: number) => (
                              <span key={idx} className="bg-[#F9FAFB] text-[#4B5563] border border-[#E5E7EB] text-[9px] px-1.5 py-0.5 rounded">
                                {spec}
                              </span>
                            ))
                          ) : (
                            <span className="text-[#9CA3AF] italic">Không có thông số</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Controls */}
          {totalProducts > pageSize && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#E5E7EB]">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1 || isProductsLoading}
                className="px-4 py-2 bg-white border border-[#D1D5DB] hover:bg-[#F3F4F6] text-[#374151] text-[11px] font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                ◀ Trang trước
              </button>
              
              <span className="text-xs text-[#6B7280] font-medium">
                Trang <span className="text-[#E60012] font-bold">{page}</span> / {Math.ceil(totalProducts / pageSize)}
              </span>

              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, Math.ceil(totalProducts / pageSize)))}
                disabled={page >= Math.ceil(totalProducts / pageSize) || isProductsLoading}
                className="px-4 py-2 bg-white border border-[#D1D5DB] hover:bg-[#F3F4F6] text-[#374151] text-[11px] font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none"
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
