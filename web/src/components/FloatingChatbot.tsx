"use client";

import React, { useState, useEffect, useRef } from "react";
import { API_CONFIG } from "@/config/apiConfig";

export interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
  suggestions?: string[];
}

const INITIAL_SUGGESTIONS = [
  "Tư vấn Feliz S",
  "Bảng giá thuê pin LFP",
  "Showroom gần nhất",
  "Hướng dẫn đặt cọc qua VNPay",
  "Tra cứu đơn cọc xe",
];

const BOT_KNOWLEDGE_BASE: Record<string, string> = {
  "tư vấn feliz s": `🛵 **VinFast Feliz S 2026**
- **Giá niêm yết**: 27.000.000 VNĐ
- **Quãng đường**: 198 km / 1 lần sạc đầy
- **Vận tốc tối đa**: 78 km/h (Động cơ Inhub 3000W)
- **Dung tích cốp**: 25 Lít rộng rãi
- **Ưu đãi**: Tặng voucher sạc pin 2.000.000đ & Miễn phí giao xe tận nhà.`,

  "bảng giá thuê pin lfp": `🔋 **Bảng Giá Thuê Pin LFP VinFast 2026**:
1. **Gói Tiết Kiệm (Dưới 1.500 km/tháng)**: 250.000 VNĐ/tháng
2. **Gói Không Giới Hạn Quãng Đường**: 350.000 VNĐ/tháng
3. **Mua đứt Pin LFP**: 19.900.000 VNĐ/pin

> *Lưu ý: Pin LFP chống nước IP67, bảo hành chính hãng 5 năm không giới hạn km.*`,

  "showroom gần nhất": `🏢 **Hệ Thống Showroom VinFast O2O Nổi Bật**:
1. **Hà Nội**: VinFast Showroom Mỹ Đình — Phạm Hùng, Q. Nam Từ Liêm (SĐT: 1900 232389)
2. **TP.HCM**: VinFast Showroom Landmark 81 — 720A Điện Biên Phủ, Bình Thạnh
3. **Thủ Đức**: VinFast Showroom Thảo Điền — Xa Lộ Hà Nội
4. **Bình Dương**: VinFast Showroom Đại Lộ Bình Dương, TP. Thủ Dầu Một`,

  "hướng dẫn đặt cọc qua vnpay": `💳 **Quy Trình Đặt Cọc Xe Trực Tuyến Qua VNPay**:
1. Chọn mẫu xe yêu thích trên trang **Sản Phẩm** hoặc trang **Đặt Cọc**.
2. Nhấn nút **"Đặt Cọc Ngay"** và chọn Showroom nhận xe.
3. Chọn cổng **VNPay Sandbox / VNPay QRCode**.
4. Quét mã QR hoặc nhập số thẻ test NCB (\`970419852619143218\`, OTP: \`123456\`).
5. Hệ thống sẽ tự động xác nhận đơn cọc và gửi thông báo mã đơn hàng!`,

  "tra cứu đơn cọc xe": `🔍 **Tra Cứu Đơn Cọc Xe Điện**:
Bạn có thể tra cứu nhanh tình trạng đơn cọc bằng 2 cách:
1. Đăng nhập và truy cập menu **"Lịch sử đặt cọc"** trên góc phải.
2. Hoặc truy cập trang **[Tra cứu đơn cọc](/tra-cuu-coc)** và nhập Số điện thoại + Mã đơn cọc.`,
};

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "bot",
      text: "Xin chào! Trợ lý ảo VinFast O2O có thể giúp gì cho bạn hôm nay?",
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      suggestions: INITIAL_SUGGESTIONS,
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setUnreadCount(0);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isTyping]);

  // Handle ESC key to close chatbot
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const generateBotReply = async (userQuery: string): Promise<string> => {
    const lowerQuery = userQuery.toLowerCase().trim();

    // 1. Try matching Knowledge Base
    for (const [key, value] of Object.entries(BOT_KNOWLEDGE_BASE)) {
      if (lowerQuery.includes(key) || key.split(" ").some(word => word.length > 3 && lowerQuery.includes(word))) {
        return value;
      }
    }

    // 2. Keyword fallbacks
    if (lowerQuery.includes("giá") || lowerQuery.includes("bao nhiêu") || lowerQuery.includes("tiền")) {
      return "Dòng xe máy điện VinFast có mức giá niêm yết từ 18.000.000đ (Evo200 Lite) đến 35.000.000đ (Klara S 2026). Bạn đang quan tâm đến dòng xe nào để mình tư vấn chi tiết?";
    }
    if (lowerQuery.includes("khuyến mãi") || lowerQuery.includes("ưu đãi") || lowerQuery.includes("quà")) {
      return "🎁 **Chương trình ưu đãi tháng 8/2026**:\n- Tặng 100% Phí trước bạ khi đặt cọc online.\n- Miễn phí 3 tháng thuê pin LFP.\n- Ưu tiên giao xe sớm đợt 1.";
    }
    if (lowerQuery.includes("bảo hành") || lowerQuery.includes("pin")) {
      return "🛡️ VinFast áp dụng chính sách bảo hành 5 năm cho xe điện và đổi trả pin LFP miễn phí nếu dung lượng giảm dưới 70%.";
    }

    // 3. Try Backend API endpoint if available, fallback to smart response
    try {
      const res = await fetch(`${API_CONFIG.ORDER_URL}/api/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userQuery }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.reply || data.message) {
          return data.reply || data.message;
        }
      }
    } catch {
      // Ignore API offline, fallback to standard bot response
    }

    return `Cảm ơn bạn đã liên hệ! Yêu cầu "${userQuery}" của bạn đã được ghi nhận. Bạn có thể chọn các gợi ý bên dưới hoặc để lại Số điện thoại để nhân viên tư vấn VinFast gọi lại ngay nhé!`;
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query) return;

    const timeString = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: timeString,
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage("");
    setIsTyping(true);

    // Simulate typing delay for realistic bot interaction
    setTimeout(async () => {
      const replyText = await generateBotReply(query);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: replyText,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        suggestions: ["Tư vấn Feliz S", "Bảng giá thuê pin LFP", "Showroom gần nhất"],
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);

      if (!isOpen) {
        setUnreadCount(prev => prev + 1);
      }
    }, 800);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "bot",
        text: "Đã làm mới cuộc hội thoại. Trợ lý VinFast O2O có thể hỗ trợ gì cho bạn?",
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        suggestions: INITIAL_SUGGESTIONS,
      },
    ]);
  };

  return (
    <>
      {/* ── FLOATING TRIGGER BUTTON (CLOSED STATE) ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Mở Trợ lý ảo VinFast"
          className="fixed bottom-6 right-6 z-50 group flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-tr from-[#B8040D] via-[#E30613] to-[#FF2A38] text-white shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-4 focus:ring-red-400/50"
        >
          {/* Pulsing ring indicator */}
          <span className="absolute -inset-1 rounded-full bg-[#E30613]/40 animate-ping pointer-events-none group-hover:opacity-0 transition-opacity" />

          {/* Unread Message Badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-slate-900 shadow-md ring-2 ring-white animate-bounce">
              {unreadCount}
            </span>
          )}

          {/* Chat Icon / VinFast V Avatar */}
          <div className="relative flex items-center justify-center">
            <svg className="h-7 w-7 transition-transform group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a.75.75 0 0 1-.816-.957 6.37 6.37 0 0 0 1.258-3.15C4.301 15.34 3 13.766 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
            </svg>
          </div>

          {/* Tooltip Hover Pill */}
          <span className="absolute right-16 hidden whitespace-nowrap rounded-xl bg-slate-900/90 px-3 py-1.5 text-xs font-bold text-white shadow-xl backdrop-blur-md group-hover:block transition-all animate-in fade-in slide-in-from-right-2">
            Trợ lý ảo VinFast O2O
          </span>
        </button>
      )}

      {/* ── CHAT WINDOW PANEL (OPEN STATE) ── */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[540px] w-[90vw] max-w-[400px] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/10 transition-all duration-300 animate-in fade-in zoom-in-95">
          
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-[#B8040D] via-[#E30613] to-[#CC0511] px-4 py-3.5 text-white shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md ring-1 ring-white/30">
                <span className="text-lg font-black text-white leading-none">V</span>
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-[#E30613]" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-black tracking-wide">Trợ lý ảo VinFast</span>
                <span className="flex items-center gap-1 text-[10px] font-semibold text-red-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Sẵn sàng tư vấn 24/7
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleClearHistory}
                title="Làm mới cuộc trò chuyện"
                className="rounded-lg p-1.5 text-red-100 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Đóng chat (ESC)"
                className="rounded-lg p-1.5 text-red-100 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Scrollable Area */}
          <div className="flex-1 overflow-y-auto bg-slate-50/60 p-4 space-y-4 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"} space-y-1`}
              >
                <div className={`flex items-end gap-2 max-w-[85%] ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  {/* Bot Avatar */}
                  {msg.sender === "bot" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#E30613] text-white font-black text-[10px] shadow-sm">
                      V
                    </div>
                  )}

                  {/* Speech Bubble */}
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 shadow-sm leading-relaxed whitespace-pre-line ${
                      msg.sender === "user"
                        ? "bg-[#E30613] text-white rounded-br-none font-medium"
                        : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-none font-normal"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>

                <span className="text-[9px] text-slate-400 font-medium px-1">
                  {msg.timestamp}
                </span>

                {/* Suggestion Chips */}
                {msg.sender === "bot" && msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1.5 max-w-[92%]">
                    {msg.suggestions.map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(chip)}
                        className="rounded-full bg-red-50 border border-red-100 px-2.5 py-1 text-[11px] font-semibold text-[#E30613] hover:bg-[#E30613] hover:text-white transition-all shadow-2xs active:scale-95 cursor-pointer"
                      >
                        ⚡ {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 text-slate-400">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#E30613] text-white font-black text-[10px]">
                  V
                </div>
                <div className="flex items-center gap-1 rounded-2xl bg-white border border-slate-200 px-3 py-2 shadow-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" />
                  <span className="text-[10px] text-slate-500 font-medium ml-1">Đang trả lời...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="border-t border-slate-200 bg-white p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Nhập câu hỏi của bạn..."
                className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-[#E30613] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#E30613] transition-all font-medium"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isTyping}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E30613] text-white disabled:bg-slate-200 disabled:text-slate-400 hover:bg-red-700 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <svg className="h-4 w-4 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3 21l18-9L3 3l3 9zm0 0h75" />
                </svg>
              </button>
            </form>
            <div className="mt-1 text-center text-[9px] text-slate-400 font-medium">
              VinFast O2O Assistant · Hỗ trợ tư vấn trực tuyến
            </div>
          </div>

        </div>
      )}
    </>
  );
}
