"use client";

import React, { useState, useEffect } from "react";
import { useAdminAuth } from "../context/AdminAuthContext";
import { API_CONFIG } from "@/config/apiConfig";

interface DepositShare {
  name: string;
  percentage: number;
  count: number;
  color: string;
  bgClass: string;
  textClass: string;
  icon: string;
  desc: string;
}

export default function DashboardPieChart() {
  const { adminToken } = useAdminAuth();
  const [flexibleCount, setFlexibleCount] = useState(0);
  const [flexiblePercentage, setFlexiblePercentage] = useState(50.0);
  const [committedCount, setCommittedCount] = useState(0);
  const [committedPercentage, setCommittedPercentage] = useState(50.0);
  const [cancellationRate, setCancellationRate] = useState(0.0);

  // Load initial chart data from API
  useEffect(() => {
    if (!adminToken) return;

    fetch(`${API_CONFIG.BASE_URL}/api/admin/dashboard/charts`, {
      headers: {
        "Authorization": `Bearer ${adminToken}`,
      }
    })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("Không thể tải dữ liệu biểu đồ.");
      })
      .then(data => {
        if (data.depositBreakdown) {
          setFlexibleCount(data.depositBreakdown.flexibleCount);
          setFlexiblePercentage(data.depositBreakdown.flexiblePercentage);
          setCommittedCount(data.depositBreakdown.committedCount);
          setCommittedPercentage(data.depositBreakdown.committedPercentage);
        }
        if (typeof data.cancellationRate === "number") {
          setCancellationRate(data.cancellationRate);
        }
      })
      .catch(err => console.error("[DashboardPieChart Fetch Error]", err));
  }, [adminToken]);

  const depositShares: DepositShare[] = [
    {
      name: "Cọc Cam Kết",
      percentage: committedPercentage,
      count: committedCount,
      color: "#8b5cf6",
      bgClass: "bg-purple-500",
      textClass: "text-purple-400",
      icon: "🔒",
      desc: "Không hoàn cọc nếu hủy"
    },
    {
      name: "Cọc Linh Hoạt",
      percentage: flexiblePercentage,
      count: flexibleCount,
      color: "#06b6d4",
      bgClass: "bg-cyan-500",
      textClass: "text-cyan-400",
      icon: "🔓",
      desc: "Được hoàn cọc theo luật"
    }
  ];

  // Calculate SVG Conic Donut Segments
  let cumulativeAngle = 0;
  const radius = 65;
  const strokeWidth = 24;
  const center = 100;
  const circumference = 2 * Math.PI * radius;

  const totalPaidCount = flexibleCount + committedCount;

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.06)] space-y-4 flex flex-col justify-between">
      
      {/* Header Info */}
      <div className="border-b border-[#E5E7EB] pb-4">
        <h3 className="text-sm font-extrabold text-[#1F2937] flex items-center gap-2">
          <span>📊</span> Tỷ Lệ Cơ Cấu Tiền Cọc
        </h3>
        <p className="text-[11px] text-[#6B7280] mt-0.5">Cơ cấu giữa Đặt cọc Cam kết (không hoàn) vs Đặt cọc Linh hoạt (có hoàn)</p>
      </div>

      {/* Pie Donut Chart Graphic & Legend Container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center py-2">
        
        {/* SVG Donut Graphic */}
        <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
          <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
            {depositShares.map((item, index) => {
              // visual allocation of 50/50 if database is empty to keep circle complete, but legend remains 0%
              const visualPercentage = (committedPercentage === 0 && flexiblePercentage === 0) ? 50 : item.percentage;
              const strokeDasharray = `${(visualPercentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((cumulativeAngle / 100) * circumference);
              cumulativeAngle += visualPercentage;

              return (
                <circle
                  key={index}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500 hover:opacity-80 cursor-pointer"
                />
              );
            })}
          </svg>

          {/* Center Hole Info */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-xl font-black text-[#1F2937] font-mono">{totalPaidCount} Đơn</span>
            <span className="text-[9px] text-[#6B7280] font-bold uppercase tracking-wider">Đã Thanh Toán</span>
          </div>
        </div>

        {/* Legend Breakdown */}
        <div className="space-y-3">
          {depositShares.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-base">{item.icon}</span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#1F2937] truncate">{item.name}</div>
                  <div className="text-[10px] text-[#6B7280] font-normal truncate">{item.desc} ({item.count} đơn)</div>
                  <div className="w-16 h-1 bg-[#E5E7EB] rounded-full mt-1 overflow-hidden">
                    <div className={`h-full ${item.bgClass}`} style={{ width: `${item.percentage}%` }}></div>
                  </div>
                </div>
              </div>

              <div className={`text-sm font-black font-mono ${item.textClass} ml-2 shrink-0`}>
                {item.percentage}%
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Cancellation Rate Badge */}
      <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
        <div>
          <span className="text-[11px] text-[#6B7280] font-bold uppercase tracking-wider">Tỷ Lệ Hủy Đơn</span>
          <p className="text-[10px] text-[#9CA3AF]">Tỷ lệ đơn hàng cọc bị hủy trên tổng số đơn cọc</p>
        </div>
        <div className="flex items-center gap-2 bg-[#F9FAFB] border border-[#E5E7EB] px-4 py-2 rounded-xl">
          <div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse"></div>
          <span className="text-xs font-black font-mono text-[#EF4444]">{cancellationRate}%</span>
        </div>
      </div>

    </div>
  );
}
