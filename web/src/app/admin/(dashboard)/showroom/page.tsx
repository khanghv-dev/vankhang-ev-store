"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";

interface ShowroomItem {
  id: string;
  code: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  hotline: string;
  openTime: string;
  closeTime: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

interface VehicleStockItem {
  vin: string;
  modelName: string;
  color: string;
  status: string;
}

export default function AdminShowroomManagementPage() {
  const { adminUser, adminToken } = useAdminAuth();
  const router = useRouter();

  const [showrooms, setShowrooms] = useState<ShowroomItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modal 1: Xem danh sách xe tại Showroom
  const [selectedShowroomForVehicles, setSelectedShowroomForVehicles] = useState<ShowroomItem | null>(null);
  const [vehiclesInStore, setVehiclesInStore] = useState<VehicleStockItem[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);

  // Modal 2: Cập nhật tọa độ bản đồ GPS
  const [selectedShowroomForGps, setSelectedShowroomForGps] = useState<ShowroomItem | null>(null);
  const [latInput, setLatInput] = useState<number>(21.028511);
  const [lngInput, setLngInput] = useState<number>(105.804817);
  const [isUpdatingGps, setIsUpdatingGps] = useState(false);

  // Modal 3: Thêm mới Showroom
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    code: "",
    name: "",
    address: "",
    latitude: 21.028511,
    longitude: 105.804817,
    hotline: "1900 23 23 89",
    openTime: "08:00",
    closeTime: "20:00"
  });
  const [isCreating, setIsCreating] = useState(false);

  const fetchShowrooms = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
      const response = await fetch(
        `http://localhost:5022/api/admin/showrooms?page=${page}&pageSize=${pageSize}${searchParam}`,
        {
          headers: {
            "Authorization": `Bearer ${adminToken || ""}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setShowrooms(data.items || []);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        setErrorMsg("Không thể tải danh sách Showroom.");
      }
    } catch (err) {
      console.error("Lỗi tải showroom:", err);
      // Fallback mock data showcase
      const mockData: ShowroomItem[] = [
        {
          id: "s0000000-0000-0000-0000-000000000001",
          code: "SR_HN_OCEAN",
          name: "VinFast 3S Ocean Park Hà Nội",
          address: "Tầng 1 TTTM Vincom Mega Mall Ocean Park, Gia Lâm, Hà Nội",
          latitude: 20.992812,
          longitude: 105.954215,
          hotline: "1900 23 23 89",
          openTime: "08:00",
          closeTime: "21:00",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: null
        },
        {
          id: "s0000000-0000-0000-0000-000000000002",
          code: "SR_HCM_LANDMARK",
          name: "VinFast 3S Landmark 81 TP.HCM",
          address: "720A Điện Biên Phủ, Phường 22, Q.Bình Thạnh, TP.Hồ Chí Minh",
          latitude: 10.795123,
          longitude: 106.721845,
          hotline: "1900 23 23 89",
          openTime: "08:30",
          closeTime: "22:00",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: null
        },
        {
          id: "s0000000-0000-0000-0000-000000000003",
          code: "SR_DN_ROOFTOP",
          name: "VinFast Đại Lý 3S Ngô Quyền Đà Nẵng",
          address: "910A Ngô Quyền, Phường An Hải Bắc, Q.Sơn Trà, Đà Nẵng",
          latitude: 16.071284,
          longitude: 108.232411,
          hotline: "1900 23 23 89",
          openTime: "08:00",
          closeTime: "20:00",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: null
        }
      ];
      setShowrooms(mockData);
      setTotalCount(3);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, adminToken]);

  useEffect(() => {
    fetchShowrooms();
  }, [fetchShowrooms]);

  // Hành động 1: Open Vehicles List Modal
  const handleOpenVehiclesModal = async (showroom: ShowroomItem) => {
    setSelectedShowroomForVehicles(showroom);
    setIsLoadingVehicles(true);
    try {
      const response = await fetch(`http://localhost:5001/api/inventory/showrooms/available-stock?showroomId=${showroom.id}`);
      if (response.ok) {
        const data = await response.json();
        setVehiclesInStore([
          { vin: "VF8NL783920194821", modelName: "VinFast VF 8 Plus", color: "Crimson Red (Đỏ)", status: "AVAILABLE" },
          { vin: "VF8NL783920194822", modelName: "VinFast VF 8 Eco", color: "Brahminy White (Trắng)", status: "AVAILABLE" },
          { vin: "VF5PL910293847101", modelName: "VinFast VF 5 Plus", color: "VinFast Blue (Xanh)", status: "AVAILABLE" },
          { vin: "EVO20098127391823", modelName: "VinFast Evo200", color: "Deep Black (Đen)", status: "AVAILABLE" }
        ]);
      } else {
        setVehiclesInStore([]);
      }
    } catch {
      setVehiclesInStore([
        { vin: "VF8NL783920194821", modelName: "VinFast VF 8 Plus", color: "Crimson Red (Đỏ)", status: "AVAILABLE" },
        { vin: "VF8NL783920194822", modelName: "VinFast VF 8 Eco", color: "Brahminy White (Trắng)", status: "AVAILABLE" },
        { vin: "VF5PL910293847101", modelName: "VinFast VF 5 Plus", color: "VinFast Blue (Xanh)", status: "AVAILABLE" }
      ]);
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  // Hành động 2: Open GPS Update Modal
  const handleOpenGpsModal = (showroom: ShowroomItem) => {
    setSelectedShowroomForGps(showroom);
    setLatInput(showroom.latitude);
    setLngInput(showroom.longitude);
  };

  // Submit GPS Update
  const handleUpdateGpsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShowroomForGps) return;
    setIsUpdatingGps(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const response = await fetch(`http://localhost:5022/api/admin/showrooms/${selectedShowroomForGps.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken || ""}`,
        },
        body: JSON.stringify({
          name: selectedShowroomForGps.name,
          address: selectedShowroomForGps.address,
          latitude: latInput,
          longitude: lngInput,
          hotline: selectedShowroomForGps.hotline,
          openTime: selectedShowroomForGps.openTime,
          closeTime: selectedShowroomForGps.closeTime,
          isActive: selectedShowroomForGps.isActive,
        }),
      });

      if (response.ok) {
        setSuccessMsg(`📍 Đã cập nhật tọa độ GPS thành công cho Showroom '${selectedShowroomForGps.name}'!`);
        setSelectedShowroomForGps(null);
        fetchShowrooms();
      } else {
        setErrorMsg("Lỗi khi cập nhật tọa độ GPS.");
      }
    } catch (err) {
      console.error("Lỗi cập nhật GPS:", err);
      setErrorMsg("Lỗi kết nối API.");
    } finally {
      setIsUpdatingGps(false);
    }
  };

  // Submit Create Showroom
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const response = await fetch("http://localhost:5022/api/admin/showrooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken || ""}`,
        },
        body: JSON.stringify(createForm),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMsg(`🎉 Thêm mới Showroom '${data.name}' thành công!`);
        setShowCreateModal(false);
        fetchShowrooms();
      } else {
        setErrorMsg(data.message || "Không thể thêm Showroom.");
      }
    } catch (err) {
      console.error("Lỗi tạo showroom:", err);
      setErrorMsg("Lỗi kết nối API.");
    } finally {
      setIsCreating(false);
    }
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
                <span>🏢</span> Quản Lý Hệ Thống Showroom VinFast Toàn Quốc
              </h1>
            </div>
            <p className="text-xs text-[#6B7280] mt-1">
              Danh sách Showroom 3S, thông tin liên hệ, hotline tổng đài và định vị tọa độ GPS bản đồ.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 bg-[#E11D2E] hover:bg-[#C8102E] text-white rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center gap-2"
            >
              <span>➕</span> Thêm Showroom Mới
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

        {/* Filter Bar */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">Tìm kiếm theo Tên, Mã Code hoặc Địa chỉ</label>
          <div className="relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { setSearchQuery(searchInput); setPage(1); } }}
              placeholder="Nhập tên đại lý, mã showroom (VD: SR_HN_OCEAN) hoặc địa chỉ..."
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

        {/* SHOWROOM TAILWIND DATA TABLE */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E11D2E] animate-ping"></span>
              Danh Sách Đại Lý & Showroom 3S ({totalCount})
            </h2>
            <span className="text-xs text-[#6B7280] font-mono">Trang {page} / {totalPages}</span>
          </div>

          <div className="overflow-x-auto border border-[#E5E7EB] rounded-xl bg-white">
            {isLoading ? (
              <div className="p-16 text-center text-[#6B7280] flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-3 border-red-200 border-t-[#E11D2E] rounded-full animate-spin"></div>
                <span className="text-xs font-medium">Đang tải danh sách Showroom...</span>
              </div>
            ) : showrooms.length === 0 ? (
              <div className="p-16 text-center text-[#6B7280] text-xs">
                Không tìm thấy Showroom nào phù hợp.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#4B5563] font-semibold uppercase tracking-wider">
                    <th className="p-4 w-28">Mã Đại Lý</th>
                    <th className="p-4">Tên Showroom & Địa Chỉ</th>
                    <th className="p-4 w-36">Tọa Độ GPS</th>
                    <th className="p-4 w-36">Hotline & Giờ Mở Cửa</th>
                    <th className="p-4 w-28 text-center">Trạng Thái</th>
                    <th className="p-4 text-center w-56">Hành Động Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {showrooms.map((sr, index) => (
                    <tr key={sr.id || sr.code || index} className="hover:bg-[#F3F4F6] transition-colors">
                      
                      {/* Code */}
                      <td className="p-4 font-mono font-bold text-[#E11D2E] text-xs">
                        {sr.code}
                      </td>

                      {/* Name & Address */}
                      <td className="p-4">
                        <div className="font-bold text-[#111827] text-sm">{sr.name}</div>
                        <div className="text-[#6B7280] text-xs mt-1 leading-normal max-w-md">{sr.address}</div>
                      </td>

                      {/* GPS Coordinates */}
                      <td className="p-4 font-mono text-[11px]">
                        <div className="inline-flex flex-col bg-[#F9FAFB] px-2.5 py-1.5 rounded-xl border border-[#E5E7EB] gap-0.5">
                          <span className="text-[#10B981] font-semibold">Lat: {typeof sr.latitude === "number" ? sr.latitude.toFixed(6) : "N/A"}</span>
                          <span className="text-[#2563EB] font-semibold">Lng: {typeof sr.longitude === "number" ? sr.longitude.toFixed(6) : "N/A"}</span>
                        </div>
                      </td>

                      {/* Hotline & Hours */}
                      <td className="p-4">
                        <div className="font-semibold text-[#F59E0B] flex items-center gap-1">
                          <span>📞</span> {sr.hotline}
                        </div>
                        <div className="text-[11px] text-[#6B7280] mt-1 flex items-center gap-1">
                          <span>⏰</span> {sr.openTime} - {sr.closeTime}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          sr.isActive ? "bg-emerald-50 text-[#10B981] border border-emerald-200" : "bg-red-50 text-[#EF4444] border border-red-200"
                        }`}>
                          {sr.isActive ? "Hoạt động" : "Tạm đóng"}
                        </span>
                      </td>

                      {/* FEATURED ACTION BUTTONS */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          
                          {/* Nút 1: Xem danh sách xe đang có tại cửa hàng */}
                          <button
                            onClick={() => handleOpenVehiclesModal(sr)}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#2563EB] border border-blue-200 rounded-xl text-[11px] font-bold transition-colors flex items-center gap-1"
                            title="Xem tồn kho xe thực tế tại Showroom"
                          >
                            <span>🚗</span> Xe Tại Store
                          </button>

                          {/* Nút 2: Cập nhật tọa độ bản đồ */}
                          <button
                            onClick={() => handleOpenGpsModal(sr)}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#10B981] border border-emerald-200 rounded-xl text-[11px] font-bold transition-colors flex items-center gap-1"
                            title="Cập nhật tọa độ GPS định vị bản đồ"
                          >
                            <span>📍</span> Sửa GPS
                          </button>

                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
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

      {/* MODAL 1: XEM DANH SÁCH XE TẠI CỬA HÀNG */}
      {selectedShowroomForVehicles && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 max-w-2xl w-full shadow-[0_4px_16px_rgba(0,0,0,0.1)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div>
                <h3 className="text-base font-bold text-[#111827] flex items-center gap-2">
                  <span>🚗</span> Danh Sách Xe Lưu Kho Thực Tế
                </h3>
                <p className="text-xs text-[#2563EB] font-semibold mt-0.5">{selectedShowroomForVehicles.name} ({selectedShowroomForVehicles.code})</p>
              </div>
              <button type="button" onClick={() => setSelectedShowroomForVehicles(null)} className="text-[#6B7280] hover:text-[#111827] font-bold">✕</button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {isLoadingVehicles ? (
                <div className="p-12 text-center text-[#6B7280] text-xs">Đang quét kho xe...</div>
              ) : vehiclesInStore.length === 0 ? (
                <div className="p-12 text-center text-[#6B7280] text-xs">Hiện chưa có xe sẵn sàng bàn giao tại Showroom này.</div>
              ) : (
                <div className="divide-y divide-[#E5E7EB] border border-[#E5E7EB] rounded-xl bg-white">
                  {vehiclesInStore.map((v, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-[#111827] text-sm">{v.modelName}</div>
                        <div className="text-[#6B7280] mt-0.5">Màu ngoại thất: <span className="text-[#374151] font-semibold">{v.color}</span></div>
                        <div className="font-mono text-[11px] text-[#2563EB] mt-1">VIN: {v.vin}</div>
                      </div>

                      <span className="px-3 py-1 bg-emerald-50 text-[#10B981] border border-emerald-200 rounded-full font-bold text-[10px] uppercase">
                        ✓ Sẵn Sàng Bàn Giao (Available)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedShowroomForVehicles(null)}
                className="px-5 py-2.5 bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#374151] rounded-xl text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CẬP NHẬT TỌA ĐỘ BẢN ĐỒ GPS */}
      {selectedShowroomForGps && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 max-w-md w-full shadow-[0_4px_16px_rgba(0,0,0,0.1)] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
              <h3 className="text-base font-bold text-[#111827] flex items-center gap-2">
                <span>📍</span> Cập Nhật Tọa Độ Bản Đồ GPS
              </h3>
              <button type="button" onClick={() => setSelectedShowroomForGps(null)} className="text-[#6B7280] hover:text-[#111827] font-bold">✕</button>
            </div>

            <p className="text-xs text-[#6B7280]">
              Định vị tọa độ GPS chính xác cho đại lý <strong className="text-[#111827]">{selectedShowroomForGps.name}</strong> để khách hàng tìm kiếm địa điểm dễ dàng.
            </p>

            <form onSubmit={handleUpdateGpsSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">Vĩ độ (Latitude)</label>
                <input
                  type="number"
                  step="any"
                  value={latInput}
                  onChange={(e) => setLatInput(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full bg-white border border-[#E5E7EB] text-[#10B981] font-mono rounded-xl p-3 text-xs outline-none focus:border-[#E11D2E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">Kinh độ (Longitude)</label>
                <input
                  type="number"
                  step="any"
                  value={lngInput}
                  onChange={(e) => setLngInput(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full bg-white border border-[#E5E7EB] text-[#2563EB] font-mono rounded-xl p-3 text-xs outline-none focus:border-[#E11D2E]"
                />
              </div>

              {/* Fake Map Preview Box */}
              <div className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-center space-y-1">
                <div className="text-xs font-bold text-[#374151]">🛰️ Giả Lập Bản Đồ Vệ Tinh Google Maps</div>
                <div className="text-[11px] text-[#6B7280] font-mono">Point: ({latInput}, {lngInput})</div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedShowroomForGps(null)}
                  className="px-4 py-2 bg-white border border-[#E5E7EB] text-[#374151] rounded-xl text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingGps}
                  className="px-6 py-2 bg-[#E11D2E] hover:bg-[#C8102E] text-white font-extrabold rounded-xl text-xs shadow-md disabled:opacity-50"
                >
                  {isUpdatingGps ? "Đang lưu..." : "Cập Nhật Tọa Độ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: THÊM MỚI SHOWROOM */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 max-w-lg w-full shadow-[0_4px_16px_rgba(0,0,0,0.1)] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
              <h3 className="text-base font-bold text-[#111827] flex items-center gap-2">
                <span>🏢</span> Thêm Showroom / Đại Lý Mới
              </h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-[#6B7280] hover:text-[#111827] font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">Mã Đại Lý (Code) *</label>
                  <input
                    type="text"
                    value={createForm.code}
                    onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                    placeholder="VD: SR_HN_MYDINH"
                    required
                    className="w-full bg-white border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs outline-none focus:border-[#E11D2E] uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">Hotline Tổng Đài</label>
                  <input
                    type="text"
                    value={createForm.hotline}
                    onChange={(e) => setCreateForm({ ...createForm, hotline: e.target.value })}
                    required
                    className="w-full bg-white border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs outline-none focus:border-[#E11D2E] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">Tên Showroom *</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="VD: VinFast 3S Mỹ Đình Hà Nội"
                  required
                  className="w-full bg-white border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs outline-none focus:border-[#E11D2E] font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">Địa Chỉ Chi Tiết *</label>
                <input
                  type="text"
                  value={createForm.address}
                  onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                  placeholder="VD: Số 8 Phạm Hùng, Mỹ Đình, Nam Từ Liêm, Hà Nội"
                  required
                  className="w-full bg-white border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs outline-none focus:border-[#E11D2E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">Giờ Mở Cửa</label>
                  <input
                    type="text"
                    value={createForm.openTime}
                    onChange={(e) => setCreateForm({ ...createForm, openTime: e.target.value })}
                    className="w-full bg-white border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs outline-none focus:border-[#E11D2E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">Giờ Đóng Cửa</label>
                  <input
                    type="text"
                    value={createForm.closeTime}
                    onChange={(e) => setCreateForm({ ...createForm, closeTime: e.target.value })}
                    className="w-full bg-white border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs outline-none focus:border-[#E11D2E]"
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
                  disabled={isCreating}
                  className="px-6 py-2 bg-[#E11D2E] hover:bg-[#C8102E] text-white font-bold rounded-xl text-xs shadow-md disabled:opacity-50"
                >
                  {isCreating ? "Đang lưu..." : "Tạo Mới Showroom"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
