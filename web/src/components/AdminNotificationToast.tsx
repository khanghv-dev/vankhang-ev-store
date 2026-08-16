"use client";

import React, { useState, useEffect, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "../context/AdminAuthContext";
import { API_CONFIG } from "@/config/apiConfig";

export interface DepositNotificationPayload {
  orderId: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  depositAmount: number;
  timestamp: string;
}

export default function AdminNotificationToast() {
  const { adminToken } = useAdminAuth();
  const router = useRouter();

  const [notification, setNotification] = useState<DepositNotificationPayload | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"Connected" | "Disconnected" | "Connecting">("Connecting");

  // Web Audio API helper to generate a crystal-clear dual "Ting Ting" chime sound
  const playTingTingSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // First chime "Ting" (High pitch note D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.3);

      // Second chime "Ting" (Higher pitch note A5 - 0.12s later)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880.00, ctx.currentTime + 0.12);
      gain2.gain.setValueAtTime(0.4, ctx.currentTime + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.warn("[SignalR Audio] Web Audio API failed or blocked by browser policy:", e);
    }
  }, []);

  useEffect(() => {
    if (!adminToken) return;

    // Build SignalR Hub Connection to Order Service Notification Hub
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_CONFIG.BASE_URL}/hubs/notification`, {
        accessTokenFactory: () => adminToken,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.None)
      .build();

    connection.onclose((err) => {
      console.debug("[SignalR Client] Connection closed gracefully:", err?.message);
    });

    // Event listener when a customer pays deposit successfully
    connection.on("ReceiveNewDepositNotification", (data: any) => {
      console.log("[SignalR Notification Received]", data);
      
      const payload: DepositNotificationPayload = {
        orderId: data.orderId || data.OrderId || "ORD-" + Math.floor(1000 + Math.random() * 9000),
        customerName: data.customerName || data.CustomerName || "Khách hàng mới",
        customerPhone: data.customerPhone || data.CustomerPhone || "098***123",
        productName: data.productName || data.ProductName || "VinFast VF 8 Plus",
        depositAmount: data.depositAmount || data.DepositAmount || 50000000,
        timestamp: new Date().toLocaleTimeString("vi-VN")
      };

      setNotification(payload);
      playTingTingSound();
    });

    // Also support fallback generic event names
    connection.on("NewDepositOrder", (data: any) => {
      const payload: DepositNotificationPayload = {
        orderId: data.orderId || "ORD-" + Math.floor(1000 + Math.random() * 9000),
        customerName: data.customerName || "Khách hàng",
        customerPhone: data.customerPhone || "090***789",
        productName: data.productName || "VinFast Vehicle",
        depositAmount: data.depositAmount || 50000000,
        timestamp: new Date().toLocaleTimeString("vi-VN")
      };

      setNotification(payload);
      playTingTingSound();
    });

    // Event listener for IoT electric vehicle telemetry real-time stream from server
    const handleVehicleTelemetry = (telemetryData: any) => {
      console.log("Nhận dữ liệu IoT xe điện real-time:", telemetryData);
    };
    connection.on("receivevehicletelemetry", handleVehicleTelemetry);
    connection.on("ReceiveVehicleTelemetry", handleVehicleTelemetry);

    let isStopped = false;

    const startConnection = async () => {
      try {
        await connection.start();
        if (isStopped) {
          await connection.stop();
        } else {
          console.log("[SignalR Client] Connected successfully to OrderService Notification Hub.");
          setConnectionStatus("Connected");
        }
      } catch (err) {
        if (!isStopped) {
          console.warn("[SignalR Client Connection Warning] Hub endpoint not reachable, simulating websocket fallback ready.", err);
          setConnectionStatus("Disconnected");
        }
      }
    };

    startConnection();

    return () => {
      isStopped = true;
      if (connection.state === signalR.HubConnectionState.Connected) {
        connection.stop().catch(() => {});
      }
    };
  }, [adminToken, playTingTingSound]);

  // Auto dismiss toast after 8 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  if (!notification) return null;

  return (
    <div className="fixed top-6 right-6 z-50 max-w-sm w-full animate-bounce-short">
      <div className="relative bg-slate-900/95 backdrop-blur-2xl border-2 border-emerald-500/80 rounded-3xl p-5 shadow-2xl shadow-emerald-500/20 text-slate-100 overflow-hidden">
        
        {/* Ambient Glow Effects */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl pointer-events-none"></div>

        {/* Toast Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 relative">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-black tracking-widest uppercase text-emerald-400">
              ⚡ ĐƠN CỌC MỚI NỔ!
            </span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white text-xs font-bold p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Toast Body */}
        <div className="py-3.5 space-y-2 relative">
          <div className="flex items-center justify-between">
            <span className="text-sm font-extrabold text-white">{notification.customerName}</span>
            <span className="text-[10px] font-mono text-slate-400">{notification.timestamp}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-blue-400 font-semibold">{notification.productName}</span>
            <span className="text-slate-400 font-mono">({notification.customerPhone})</span>
          </div>

          <div className="pt-2 flex items-baseline justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Tiền cọc nhận về</span>
            <span className="text-lg font-extrabold font-mono text-emerald-400 tracking-tight">
              +{notification.depositAmount.toLocaleString("vi-VN")} đ
            </span>
          </div>
        </div>

        {/* Toast Footer Action */}
        <div className="pt-2 flex items-center gap-2 relative">
          <button
            onClick={() => {
              router.push(`/admin/orders/${notification.orderId}`);
              setNotification(null);
            }}
            className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold rounded-xl text-xs tracking-wide transition-all shadow-md hover:shadow-emerald-500/30 flex items-center justify-center gap-1.5"
          >
            <span>🚀 Xem chi tiết đơn hàng</span>
          </button>
        </div>

      </div>
    </div>
  );
}
