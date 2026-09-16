"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "../../../context/AdminAuthContext";

/// <summary>
/// Premium Admin Login Page styled with HSL dark elements.
/// Fetches access token, logs session, and redirects to dashboard.
/// </summary>
export default function AdminLoginPage() {
  const { loginAdmin } = useAdminAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!usernameOrEmail.trim()) {
      setErrorMsg("Tên đăng nhập hoặc email không được để trống.");
      return;
    }
    if (!password) {
      setErrorMsg("Mật khẩu không được để trống.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5022/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          UsernameOrEmail: usernameOrEmail.trim(),
          Password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        loginAdmin(data.accessToken, data.refreshToken);
        router.push("/admin");
      } else {
        setErrorMsg(data.message || "Đăng nhập thất bại. Vui lòng thử lại.");
      }
    } catch {
      setErrorMsg("Không thể kết nối đến hệ thống máy chủ. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 p-4 font-sans text-slate-100 selection:bg-blue-500 selection:text-white">
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>

        <div className="text-center mb-8 relative">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-red-500 to-rose-400 bg-clip-text text-transparent">
            VINFAST O2O ADMIN
          </h1>
          <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase mt-2">
            Hệ thống Quản trị viên
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm flex items-center gap-2">
            <span className="font-bold">⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-2">
              Tài khoản quản trị
            </label>
            <input
              type="text"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              placeholder="Username hoặc Email"
              disabled={isLoading}
              className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 rounded-xl p-4 text-sm outline-none transition-all duration-300 placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-2">
              Mật khẩu bảo mật
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 rounded-xl p-4 text-sm outline-none transition-all duration-300 placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl p-4 text-sm shadow-lg shadow-blue-500/15 transition-all duration-300 hover:from-blue-500 hover:to-indigo-500 hover:-translate-y-0.5 hover:shadow-blue-500/25 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                <span>Đang xử lý...</span>
              </>
            ) : (
              <span>Đăng nhập hệ thống</span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-500">
          Hệ thống bảo mật nội bộ VinFast. Nghiêm cấm truy cập trái phép.
        </div>
      </div>
    </div>
  );
}
