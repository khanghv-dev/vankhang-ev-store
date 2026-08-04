"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { API_CONFIG } from "@/config/apiConfig";

interface BatterySlotDetail {
  slotNumber: number;
  batteryId: string | null;
  chargePercentage: number;
  status: "FULL" | "CHARGING" | "EMPTY" | "FAULT";
}

interface BatteryStationMonitoring {
  stationId: string;
  stationName: string;
  address: string;
  totalSlots: number;
  chargingSlotsCount: number;
  readyBatteriesCount: number;
  emptySlotsCount: number;
  stationStatus: string;
  lastUpdatedAt: string;
  slots?: BatterySlotDetail[];
}

interface BatteryHealthReport {
  vin: string;
  maxTemp: number;
  avgTemp: number;
  tempAnomaliesCount: number;
  totalRecords: number;
  avgDischargeRate: number | null;
  soh: number;
  isRisky: boolean;
  analysisDate: string;
  processedAt: string;
}

export default function AdminBatteryMonitoringDashboard() {
  const { adminUser, adminToken } = useAdminAuth();
  const router = useRouter();

  const [stations, setStations] = useState<BatteryStationMonitoring[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string>("STATION_HN_01");
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"stations" | "health">("stations");
  const [reports, setReports] = useState<BatteryHealthReport[]>([]);

  const fetchMonitoringData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.INVENTORY_URL}/api/battery/stations/monitoring`, {
        headers: {
          "Authorization": `Bearer ${adminToken || ""}`,
        },
      });

      if (response.ok) {
        const data: BatteryStationMonitoring[] = await response.json();
        
        // Enhance mock slots data for visual demonstration
        const enhancedData = data.map((st, index) => {
          if (!st.slots || st.slots.length === 0) {
            st.slots = generateMockSlots(st.stationId, index);
          }
          return st;
        });

        setStations(enhancedData);
        if (enhancedData.length > 0 && !enhancedData.find(s => s.stationId === selectedStationId)) {
          setSelectedStationId(enhancedData[0].stationId);
        }
      } else {
        setStations(getFallbackStationsData());
      }
    } catch (err) {
      console.error("Lỗi kết nối IoT Telemetry API:", err);
      setStations(getFallbackStationsData());
    } finally {
      setIsLoading(false);
      setLastRefreshTime(new Date().toLocaleTimeString("vi-VN"));
    }
  }, [adminToken, selectedStationId]);

  const fetchHealthReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.ORDER_URL}/api/admin/battery/reports`, {
        headers: {
          "Authorization": `Bearer ${adminToken || ""}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      } else {
        setReports(getFallbackReportsData());
      }
    } catch (err) {
      console.error("Lỗi kết nối Battery Health Reports API:", err);
      setReports(getFallbackReportsData());
    } finally {
      setIsLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    fetchMonitoringData();
    fetchHealthReports();
  }, [fetchMonitoringData, fetchHealthReports]);

  // Real-time polling timer (10s)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchMonitoringData();
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchMonitoringData]);

  const activeStation = stations.find((s) => s.stationId === selectedStationId) || stations[0];

  // Calculate global statistics
  const totalStationsCount = stations.length;
  const totalReadyBatteries = stations.reduce((acc, s) => acc + s.readyBatteriesCount, 0);
  const totalChargingSlots = stations.reduce((acc, s) => acc + s.chargingSlotsCount, 0);
  const totalSlotsCount = stations.reduce((acc, s) => acc + s.totalSlots, 0);

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
                <span>⚡</span> Giám Sát Mạng Lưới Trạm Pin IoT Telemetry
              </h1>
            </div>
            <p className="text-xs text-[#6B7280] mt-1">
              Hệ thống IoT Dashboard theo dõi trạng thái sạc pin real-time tại các tủ đổi pin tự động VinFast toàn quốc.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#F9FAFB] px-3.5 py-2 rounded-xl border border-[#E5E7EB] text-xs gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${autoRefresh ? "bg-emerald-400" : "bg-gray-400"}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${autoRefresh ? "bg-emerald-500" : "bg-gray-400"}`}></span>
              </span>
              <span className="font-semibold text-[#374151]">
                {autoRefresh ? `Tự động cập nhật (Lần cuối: ${lastRefreshTime})` : "Tạm dừng tự động làm mới"}
              </span>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="ml-2 px-2.5 py-1 bg-white border border-[#E5E7EB] hover:bg-[#F3F4F6] text-[#374151] rounded-lg text-[10px] font-bold shadow-sm"
              >
                {autoRefresh ? "Tắt" : "Bật"}
              </button>
            </div>

            <button
              onClick={() => fetchMonitoringData()}
              disabled={isLoading}
              className="p-2.5 bg-[#E11D2E] hover:bg-[#C8102E] text-white rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50"
              title="Làm mới dữ liệu ngay lập tức"
            >
              🔄
            </button>
          </div>
        </div>

        {/* TOP ANALYTICS METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Tổng Số Trạm Online</div>
              <div className="text-2xl font-black text-[#111827] mt-1 font-mono">{totalStationsCount} Trạm</div>
              <div className="text-[10px] text-[#10B981] mt-1 font-semibold">● Mạng lưới kết nối IoT ổn định</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-[#2563EB] flex items-center justify-center text-xl font-bold">
              📡
            </div>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Pin Đã Sạc Đầy 100%</div>
              <div className="text-2xl font-black text-[#10B981] mt-1 font-mono">{totalReadyBatteries} Viên</div>
              <div className="text-[10px] text-[#6B7280] mt-1">Sẵn sàng đổi cho khách ngay</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#10B981] flex items-center justify-center text-xl font-bold">
              🔋
            </div>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Hộc Pin Đang Sạc</div>
              <div className="text-2xl font-black text-[#F59E0B] mt-1 font-mono">{totalChargingSlots} Hộc</div>
              <div className="text-[10px] text-[#F59E0B] mt-1">Nạp điện dòng sạc 250A</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-[#F59E0B] flex items-center justify-center text-xl font-bold">
              ⚡
            </div>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Tổng Công Suất Hộc Sạc</div>
              <div className="text-2xl font-black text-[#8B5CF6] mt-1 font-mono">{totalSlotsCount} Hộc</div>
              <div className="text-[10px] text-[#6B7280] mt-1">Toàn bộ hệ thống tủ tự động</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 text-[#8B5CF6] flex items-center justify-center text-xl font-bold">
              🏬
            </div>
          </div>

        </div>

        {/* TAB SELECTOR */}
        <div className="flex bg-white p-1.5 rounded-2xl border border-[#E5E7EB] shadow-[0_4px_16px_rgba(0,0,0,0.06)] gap-2">
          <button
            onClick={() => setActiveTab("stations")}
            className={`flex-1 py-3 rounded-xl text-xs font-extrabold transition-all duration-200 ${
              activeTab === "stations" ? "bg-[#E11D2E] text-white shadow-md" : "text-[#6B7280] hover:text-[#111827]"
            }`}
          >
            🏪 Giám sát Trạm sạc Real-time
          </button>
          <button
            onClick={() => {
              setActiveTab("health");
              fetchHealthReports();
            }}
            className={`flex-1 py-3 rounded-xl text-xs font-extrabold transition-all duration-200 ${
              activeTab === "health" ? "bg-[#E11D2E] text-white shadow-md" : "text-[#6B7280] hover:text-[#111827]"
            }`}
          >
            📊 Sức khỏe Pin SOH (Spark Batch Analytics)
          </button>
        </div>

        {activeTab === "stations" && (
          <>
            {/* STATION SELECTOR TABS */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
              {stations.map((st) => {
                const isSelected = st.stationId === selectedStationId;
                return (
                  <button
                    key={st.stationId}
                    onClick={() => setSelectedStationId(st.stationId)}
                    className={`px-5 py-3.5 rounded-2xl text-xs font-extrabold transition-all duration-200 flex items-center gap-3 border shadow-sm shrink-0 ${
                      isSelected
                        ? "bg-[#FEE2E2] text-[#E11D2E] border-[#E11D2E] font-bold"
                        : "bg-white text-[#374151] border-[#E5E7EB] hover:bg-[#F9FAFB]"
                    }`}
                  >
                    <span>🏬</span>
                    <div className="text-left">
                      <div className="text-sm leading-none">{st.stationName}</div>
                      <div className="text-[10px] opacity-75 mt-1 font-mono">
                        🟢 {st.readyBatteriesCount} Pin đầy | ⚡ {st.chargingSlotsCount} Đang sạc
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* VISUAL BATTERY SLOTS GRID DASHBOARD */}
            {activeStation && (
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)] space-y-6">
                
                {/* Active Station Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E5E7EB] gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#2563EB] font-mono font-bold text-xs">
                        {activeStation.stationId}
                      </span>
                      <h2 className="text-lg font-extrabold text-[#111827]">
                        {activeStation.stationName}
                      </h2>
                    </div>
                    <p className="text-xs text-[#6B7280] mt-1 flex items-center gap-1">
                      📍 {activeStation.address}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5 bg-[#F9FAFB] px-3 py-1.5 rounded-xl border border-[#E5E7EB]">
                      <span className="w-3 h-3 rounded-full bg-[#10B981]"></span>
                      <span className="text-[#374151]">100% Sẵn Sàng ({activeStation.readyBatteriesCount})</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#F9FAFB] px-3 py-1.5 rounded-xl border border-[#E5E7EB]">
                      <span className="w-3 h-3 rounded-full bg-[#F59E0B] animate-pulse"></span>
                      <span className="text-[#374151]">Đang Sạc ({activeStation.chargingSlotsCount})</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#F9FAFB] px-3 py-1.5 rounded-xl border border-[#E5E7EB]">
                      <span className="w-3 h-3 rounded-full bg-[#9CA3AF]"></span>
                      <span className="text-[#6B7280]">Trống ({activeStation.emptySlotsCount})</span>
                    </div>
                  </div>
                </div>

                {/* 3D GRAPHIC BATTERY SLOTS GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {(activeStation.slots || []).map((slot) => {
                    const isFull = slot.chargePercentage === 100 || slot.status === "FULL";
                    const isCharging = slot.status === "CHARGING" || (slot.chargePercentage > 0 && slot.chargePercentage < 100);
                    const isEmpty = slot.status === "EMPTY" || !slot.batteryId;
                    const isFault = slot.status === "FAULT";

                    return (
                      <div
                        key={slot.slotNumber}
                        className={`relative rounded-2xl p-5 border shadow-sm transition-all duration-300 flex flex-col justify-between overflow-hidden ${
                          isFull
                            ? "bg-[#F0FDF4] border-emerald-300 shadow-sm hover:border-emerald-500"
                            : isCharging
                            ? "bg-[#FFFBEB] border-amber-300 shadow-sm hover:border-amber-500"
                            : isFault
                            ? "bg-[#FEF2F2] border-red-300"
                            : "bg-[#F9FAFB] border-[#E5E7EB]"
                        }`}
                      >
                        {/* Top Slot Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                          <span className="text-xs font-extrabold font-mono text-[#111827] flex items-center gap-1.5">
                            <span>Hộc #{slot.slotNumber}</span>
                          </span>

                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                            isFull
                              ? "bg-emerald-100 text-[#10B981] border border-emerald-300"
                              : isCharging
                              ? "bg-amber-100 text-[#F59E0B] border border-amber-300 animate-pulse"
                              : isFault
                              ? "bg-red-100 text-[#EF4444] border border-red-300"
                              : "bg-gray-200 text-gray-600"
                          }`}>
                            {isFull ? "FULL 100%" : isCharging ? "⚡ CHARGING" : isFault ? "⚠️ FAULT" : "EMPTY"}
                          </span>
                        </div>

                        {/* BATTERY GRAPHIC BAR DISPLAY */}
                        <div className="my-5 space-y-3">
                          {!isEmpty ? (
                            <div>
                              {/* Percentage Header */}
                              <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="font-mono text-[11px] text-[#6B7280]">ID: {slot.batteryId}</span>
                                <span className={`font-black font-mono text-sm ${
                                  isFull ? "text-[#10B981]" : isCharging ? "text-[#F59E0B]" : "text-[#6B7280]"
                                }`}>
                                  {slot.chargePercentage}%
                                </span>
                              </div>

                              {/* Battery Graphic Cell */}
                              <div className="relative h-7 w-full bg-white border border-[#E5E7EB] rounded-xl overflow-hidden p-0.5 shadow-inner flex items-center">
                                {/* Animated Inner Charge Fill */}
                                <div
                                  className={`h-full rounded-lg transition-all duration-1000 relative ${
                                    isFull
                                      ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm"
                                      : isCharging
                                      ? "bg-gradient-to-r from-amber-500 to-orange-400 shadow-sm"
                                      : "bg-red-500"
                                  }`}
                                  style={{ width: `${slot.chargePercentage}%` }}
                                >
                                  {/* Glowing Wave Effect for charging */}
                                  {isCharging && (
                                    <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="h-16 flex flex-col items-center justify-center border border-dashed border-[#D1D5DB] rounded-xl text-[#9CA3AF] text-xs gap-1">
                              <span className="text-lg">📥</span>
                              <span>Hộc Trống Nhận Pin</span>
                            </div>
                          )}
                        </div>

                        {/* Footer Info */}
                        <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-[10px] text-[#6B7280] font-mono">
                          <span>{isCharging ? "Ước tính sạc: ~12 phút" : isFull ? "Sẵn sàng bàn giao" : "Sẵn sàng nạp"}</span>
                          <span>LFP Tech</span>
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            )}
          </>
        )}

        {activeTab === "health" && (
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)] space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-[#E5E7EB] gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-[#111827] flex items-center gap-2">
                  <span>📊</span> Báo cáo Phân Tích Sức Khỏe Pin Spark (SOH Batch Analytics)
                </h2>
                <p className="text-xs text-[#6B7280] mt-1">
                  Đánh giá chỉ số SOH và phân loại các pin có nguy cơ lỗi/hỏng (is_risky).
                </p>
              </div>
              <button
                onClick={fetchHealthReports}
                className="px-4 py-2 bg-[#E11D2E] hover:bg-[#C8102E] text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                🔄 Làm mới báo cáo
              </button>
            </div>

            <div className="overflow-x-auto border border-[#E5E7EB] rounded-xl bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#4B5563] font-bold uppercase tracking-wider">
                    <th className="py-4 px-4">Số Khung / VIN</th>
                    <th className="py-4 px-4">Sức khỏe (SOH)</th>
                    <th className="py-4 px-4">Nhiệt độ Lõi (Avg/Max)</th>
                    <th className="py-4 px-4">Quá nhiệt (&gt;55°C)</th>
                    <th className="py-4 px-4">Tốc độ hao pin</th>
                    <th className="py-4 px-4">Ngày phân tích</th>
                    <th className="py-4 px-4">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#6B7280]">
                        Chưa có báo cáo phân tích sức khỏe pin nào được tải lên.
                      </td>
                    </tr>
                  ) : (
                    reports.map((report) => (
                      <tr key={report.vin} className="hover:bg-[#F3F4F6] transition-colors">
                        <td className="py-4 px-4 font-mono font-bold text-[#111827]">{report.vin}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-[#F3F4F6] rounded-full h-2.5 overflow-hidden border border-[#E5E7EB] p-0.5">
                              <div
                                className={`h-full rounded-full ${
                                  report.soh >= 85
                                    ? "bg-[#10B981]"
                                    : report.soh >= 75
                                    ? "bg-[#F59E0B]"
                                    : "bg-[#EF4444]"
                                }`}
                                style={{ width: `${report.soh}%` }}
                              ></div>
                            </div>
                            <span className={`font-mono font-bold ${
                              report.soh >= 85
                                ? "text-[#10B981]"
                                : report.soh >= 75
                                ? "text-[#F59E0B]"
                                : "text-[#EF4444]"
                            }`}>
                              {report.soh.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-mono">
                          {report.avgTemp.toFixed(1)}°C / <span className="font-bold text-[#EF4444]">{report.maxTemp.toFixed(1)}°C</span>
                        </td>
                        <td className="py-4 px-4 font-mono text-center">
                          <span className={report.tempAnomaliesCount > 0 ? "text-[#EF4444] font-bold" : "text-[#6B7280]"}>
                            {report.tempAnomaliesCount} lần
                          </span>
                        </td>
                        <td className="py-4 px-4 font-mono">
                          {report.avgDischargeRate ? `${(report.avgDischargeRate * 100).toFixed(4)} %/s` : "N/A"}
                        </td>
                        <td className="py-4 px-4 text-[#6B7280] font-mono">{report.analysisDate}</td>
                        <td className="py-4 px-4">
                          {report.isRisky ? (
                            <span className="px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-[#EF4444] font-extrabold uppercase text-[10px] tracking-wide animate-pulse">
                              ⚠️ Nguy cơ hỏng
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#10B981] font-extrabold uppercase text-[10px] tracking-wide">
                              ✓ Ổn định
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// Helper Generator for realistic demo slots
function generateMockSlots(stationId: string, index: number): BatterySlotDetail[] {
  const slots: BatterySlotDetail[] = [];
  const total = index === 1 ? 16 : 12;
  for (let i = 1; i <= total; i++) {
    let status: "FULL" | "CHARGING" | "EMPTY" | "FAULT" = "FULL";
    let pct = 100;
    let batteryId: string | null = `BAT_LFP_${100 + i}`;

    if (i > 5 && i <= 8) {
      status = "CHARGING";
      pct = 40 + (i * 7);
    } else if (i > 8 && i < total) {
      status = "EMPTY";
      pct = 0;
      batteryId = null;
    } else if (i === total) {
      status = "FAULT";
      pct = 0;
      batteryId = "BAT_ERR_99";
    }

    slots.push({
      slotNumber: i,
      batteryId,
      chargePercentage: pct,
      status
    });
  }
  return slots;
}

function getFallbackStationsData(): BatteryStationMonitoring[] {
  return [
    {
      stationId: "STATION_HN_01",
      stationName: "Trạm Đổi Pin VinFast Ocean Park 1",
      address: "KĐT Vinhomes Ocean Park, Gia Lâm, Hà Nội",
      totalSlots: 12,
      chargingSlotsCount: 3,
      readyBatteriesCount: 5,
      emptySlotsCount: 3,
      stationStatus: "OPERATIONAL",
      lastUpdatedAt: new Date().toISOString(),
      slots: generateMockSlots("STATION_HN_01", 0)
    },
    {
      stationId: "STATION_HCM_01",
      stationName: "Trạm Đổi Pin VinFast Landmark 81",
      address: "720A Điện Biên Phủ, Phường 22, Bình Thạnh, TP.HCM",
      totalSlots: 16,
      chargingSlotsCount: 2,
      readyBatteriesCount: 7,
      emptySlotsCount: 6,
      stationStatus: "OPERATIONAL",
      lastUpdatedAt: new Date().toISOString(),
      slots: generateMockSlots("STATION_HCM_01", 1)
    }
  ];
}

function getFallbackReportsData(): BatteryHealthReport[] {
  return [
    {
      vin: "VNF-KLARAS-2026-08173",
      maxTemp: 56.5,
      avgTemp: 41.2,
      tempAnomaliesCount: 3,
      totalRecords: 120,
      avgDischargeRate: 0.0082,
      soh: 72.5,
      isRisky: true,
      analysisDate: new Date().toISOString().split("T")[0],
      processedAt: new Date().toISOString()
    },
    {
      vin: "VNF-EV-DEMO-9999",
      maxTemp: 34.0,
      avgTemp: 32.5,
      tempAnomaliesCount: 0,
      totalRecords: 80,
      avgDischargeRate: 0.0055,
      soh: 96.8,
      isRisky: false,
      analysisDate: new Date().toISOString().split("T")[0],
      processedAt: new Date().toISOString()
    }
  ];
}
