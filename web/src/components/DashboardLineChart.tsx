"use client";

import React, { useState, useEffect } from "react";
import * as signalR from "@microsoft/signalr";
import { useAdminAuth } from "../context/AdminAuthContext";
import { API_CONFIG } from "@/config/apiConfig";

interface MonthlyData {
  month: string;
  revenue: number; // in Millions VND
  orders: number;
}

export default function DashboardLineChart() {
  const { adminToken } = useAdminAuth();
  const [hoveredPoint, setHoveredPoint] = useState<MonthlyData | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [chartData, setChartData] = useState<MonthlyData[]>([
    { month: "T1", revenue: 0, orders: 0 },
    { month: "T2", revenue: 0, orders: 0 },
    { month: "T3", revenue: 0, orders: 0 },
    { month: "T4", revenue: 0, orders: 0 },
    { month: "T5", revenue: 0, orders: 0 },
    { month: "T6", revenue: 0, orders: 0 },
    { month: "T7", revenue: 0, orders: 0 },
    { month: "T8", revenue: 0, orders: 0 },
    { month: "T9", revenue: 0, orders: 0 },
    { month: "T10", revenue: 0, orders: 0 },
    { month: "T11", revenue: 0, orders: 0 },
    { month: "T12", revenue: 0, orders: 0 },
  ]);

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
        if (data.monthlyData && data.monthlyData.length > 0) {
          setChartData(data.monthlyData);
        }
      })
      .catch(err => console.error("[DashboardLineChart Fetch Error]", err));
  }, [adminToken]);

  // Real-time chart update subscription
  useEffect(() => {
    if (!adminToken) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_CONFIG.BASE_URL}/hubs/notification`, {
        accessTokenFactory: () => adminToken,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.None)
      .build();

    connection.onclose((err) => {
      console.debug("[SignalR Chart] Connection closed gracefully:", err?.message);
    });

    connection.on("ReceiveNewDepositNotification", (data: any) => {
      console.log("[SignalR Chart Updated]", data);
      const amountVnd = data.depositAmount || data.DepositAmount || 0;
      const amountMillions = amountVnd / 1000000;
      const currentMonth = "T" + (new Date().getMonth() + 1);

      setChartData(prevData =>
        prevData.map(d =>
          d.month === currentMonth
            ? { ...d, revenue: d.revenue + amountMillions, orders: d.orders + 1 }
            : d
        )
      );
    });

    let isStopped = false;

    const startConnection = async () => {
      try {
        await connection.start();
        if (isStopped) {
          await connection.stop();
        } else {
          console.log("[SignalR Chart] Connected to Hub successfully.");
        }
      } catch (err) {
        if (!isStopped) {
          console.warn("[SignalR Chart Connection Warning]", err);
        }
      }
    };

    startConnection();

    return () => {
      isStopped = true;
      if (connection.state !== signalR.HubConnectionState.Disconnected) {
        connection.stop().catch(() => {});
      }
    };
  }, [adminToken]);

  const maxVal = Math.max(...chartData.map(d => d.revenue), 10);
  const maxRevenue = Math.ceil(maxVal / 10) * 10;
  const width = 650;
  const height = 240;
  const padding = 35;

  const points = chartData.map((d, index) => {
    const x = padding + (index * (width - 2 * padding)) / (chartData.length - 1);
    const y = height - padding - (d.revenue / maxRevenue) * (height - 2 * padding);
    return { x, y, d };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  const gridValues = [0, maxRevenue * 0.25, maxRevenue * 0.5, maxRevenue * 0.75, maxRevenue];

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.06)] space-y-4 relative overflow-hidden">
      
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
        <div>
          <h3 className="text-sm font-extrabold text-[#1F2937] flex items-center gap-2">
            <span>📈</span> Xu Hướng Tăng Trưởng Doanh Thu Đặt Cọc
          </h3>
          <p className="text-[11px] text-[#6B7280] mt-0.5">Thống kê tổng tiền cọc nhận được qua cổng thanh toán theo từng tháng (VNĐ)</p>
        </div>
        <div className="px-3 py-1 bg-red-50 border border-red-200 rounded-full text-[10px] font-mono font-bold text-[#E11D2E]">
          Năm 2026 (Tăng 185% YoY)
        </div>
      </div>

      {/* SVG Line Chart */}
      <div className="relative w-full overflow-x-auto custom-scrollbar">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="lineGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E11D2E" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#E11D2E" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="strokeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#E11D2E" />
              <stop offset="100%" stopColor="#C80010" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridValues.map((val) => {
            const y = height - padding - (val / maxRevenue) * (height - 2 * padding);
            return (
              <g key={val}>
                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#E5E7EB" strokeDasharray="4 4" strokeWidth="1" />
                <text x={padding - 8} y={y + 3} fill="#6B7280" fontSize="9" textAnchor="end" fontFamily="monospace">
                  {val >= 1000 ? `${(val / 1000).toFixed(1)} Tỷ` : `${Math.round(val)}M`}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaD} fill="url(#lineGlow)" />

          {/* Line Path */}
          <path d={pathD} fill="none" stroke="url(#strokeGrad)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Interactive Data Points */}
          {points.map((pt, i) => (
            <g key={i} className="cursor-pointer group">
              <circle
                cx={pt.x}
                cy={pt.y}
                r="5"
                fill="#FFFFFF"
                stroke="#E11D2E"
                strokeWidth="2.5"
                className="transition-all duration-200 group-hover:r-7 group-hover:fill-[#C80010]"
                onMouseEnter={() => {
                  setHoveredPoint(pt.d);
                  setHoverPos({ x: pt.x, y: pt.y });
                }}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              {/* X Axis Labels */}
              <text x={pt.x} y={height - 10} fill="#4B5563" fontSize="10" fontWeight="bold" textAnchor="middle">
                {pt.d.month}
              </text>
            </g>
          ))}
        </svg>

        {/* Hover Tooltip Popup */}
        {hoveredPoint && (
          <div
            className="absolute z-20 bg-white border border-[#E5E7EB] p-3 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.1)] text-xs space-y-1 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3"
            style={{ left: `${(hoverPos.x / width) * 100}%`, top: `${(hoverPos.y / height) * 100}%` }}
          >
            <div className="font-bold text-[#E11D2E] font-mono">Tháng {hoveredPoint.month}</div>
            <div className="text-[#1F2937] font-extrabold text-sm">
              {(hoveredPoint.revenue * 1000000).toLocaleString("vi-VN")} VNĐ
            </div>
            <div className="text-[10px] text-emerald-600 font-mono font-semibold">📦 {hoveredPoint.orders} Đơn hàng cọc</div>
          </div>
        )}
      </div>

    </div>
  );
}
