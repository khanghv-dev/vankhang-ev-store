"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Input visibility states
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Field validation errors
  const [errors, setErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    general: "",
  });

  // Check authentication status on mount
  useEffect(() => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Lỗi khi xác thực quyền truy cập trang đổi mật khẩu:", error);
      router.push("/login");
    }
  }, [router]);

  // Validation function
  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      general: "",
    };

    // 1. Check empty fields
    if (!currentPassword.trim()) {
      newErrors.currentPassword = "Mật khẩu hiện tại không được để trống.";
      isValid = false;
    }

    if (!newPassword.trim()) {
      newErrors.newPassword = "Mật khẩu mới không được để trống.";
      isValid = false;
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Vui lòng nhập lại mật khẩu mới.";
      isValid = false;
    }

    // 2. Validate new password strength (Min 6 chars, both letters and numbers)
    if (newPassword.trim()) {
      if (newPassword.length < 6) {
        newErrors.newPassword = "Mật khẩu mới phải có độ dài tối thiểu 6 ký tự.";
        isValid = false;
      } else {
        const hasLetter = /[a-zA-Z]/.test(newPassword);
        const hasNumber = /[0-9]/.test(newPassword);
        if (!hasLetter || !hasNumber) {
          newErrors.newPassword = "Mật khẩu mới phải bao gồm cả chữ và số.";
          isValid = false;
        }
      }
    }

    // 3. Check matching confirm password
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu nhập lại không trùng khớp với mật khẩu mới.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({ currentPassword: "", newPassword: "", confirmPassword: "", general: "" });

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const token = localStorage.getItem("accessToken");
      
      // Make real API request (will mock success if endpoint returns 404/not integrated)
      const response = await fetch("http://localhost:5022/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      // Simulating network delay for professional loading feel (1.5 seconds)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (response.ok) {
        setSuccess(true);
        // Redirect to homepage after 3 seconds
        setTimeout(() => {
          router.push("/");
        }, 3000);
      } else {
        const data = await response.json().catch(() => ({}));
        setErrors((prev) => ({
          ...prev,
          general: data.message || "Đổi mật khẩu thất bại. Vui lòng thử lại.",
        }));
      }
    } catch (err) {
      console.error("Lỗi kết nối API đổi mật khẩu:", err);
      setErrors((prev) => ({
        ...prev,
        general: "Không thể kết nối đến hệ thống đổi mật khẩu. Vui lòng thử lại sau.",
      }));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-neutral-50 gap-4">
        <svg className="animate-spin h-10 w-10 text-[#E30613]" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <span className="text-sm font-semibold text-neutral-500">Đang tải dữ liệu trang...</span>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-neutral-50 via-neutral-100 to-neutral-200 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-md w-full mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400">
          <Link href="/" className="hover:text-[#E30613] transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-neutral-500">Trang cá nhân</span>
          <span>/</span>
          <span className="text-neutral-700">Đổi mật khẩu</span>
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-8 shadow-xl relative overflow-hidden">
          {/* Top colored stripe */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#E30613] to-red-800"></div>

          {/* Form Header */}
          <div className="text-center mb-8">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-[#E30613] mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-neutral-900 leading-tight">Đổi mật khẩu</h1>
            <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider mt-1">Cập nhật mật khẩu bảo mật tài khoản</p>
          </div>

          {/* Success Banner */}
          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center space-y-3 animate-in zoom-in duration-300">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-green-900">Đổi mật khẩu thành công!</h2>
              <p className="text-xs text-green-700 leading-relaxed font-semibold">
                Mật khẩu của bạn đã được cập nhật. Bạn sẽ tự động được chuyển hướng về trang chủ trong 3 giây...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* General error message */}
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-xs font-semibold flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{errors.general}</span>
                </div>
              )}

              {/* 1. Current Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider" htmlFor="currentPassword">
                  Mật khẩu hiện tại <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="currentPassword"
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại"
                    disabled={submitting}
                    className={`w-full rounded-xl border px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#E30613]/20 ${
                      errors.currentPassword
                        ? "border-red-500 bg-red-50/10 focus:border-red-500"
                        : "border-neutral-200 bg-neutral-50/30 focus:border-[#E30613]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    {showCurrent ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" y1="2" x2="22" y2="22" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="text-red-500 text-xs font-semibold mt-1 flex items-center gap-1 animate-in fade-in duration-200">
                    <span className="inline-block h-1 w-1 rounded-full bg-red-500"></span>
                    {errors.currentPassword}
                  </p>
                )}
              </div>

              {/* 2. New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider" htmlFor="newPassword">
                  Mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự, cả chữ và số)"
                    disabled={submitting}
                    className={`w-full rounded-xl border px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#E30613]/20 ${
                      errors.newPassword
                        ? "border-red-500 bg-red-50/10 focus:border-red-500"
                        : "border-neutral-200 bg-neutral-50/30 focus:border-[#E30613]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    {showNew ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" y1="2" x2="22" y2="22" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-red-500 text-xs font-semibold mt-1 flex items-center gap-1 animate-in fade-in duration-200">
                    <span className="inline-block h-1 w-1 rounded-full bg-red-500"></span>
                    {errors.newPassword}
                  </p>
                )}
              </div>

              {/* 3. Confirm New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider" htmlFor="confirmPassword">
                  Nhập lại mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Xác nhận lại mật khẩu mới"
                    disabled={submitting}
                    className={`w-full rounded-xl border px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#E30613]/20 ${
                      errors.confirmPassword
                        ? "border-red-500 bg-red-50/10 focus:border-red-500"
                        : "border-neutral-200 bg-neutral-50/30 focus:border-[#E30613]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    {showConfirm ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" y1="2" x2="22" y2="22" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs font-semibold mt-1 flex items-center gap-1 animate-in fade-in duration-200">
                    <span className="inline-block h-1 w-1 rounded-full bg-red-500"></span>
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-6 rounded-xl bg-[#E30613] hover:bg-[#c0000f] text-white font-bold text-sm uppercase tracking-wider py-3.5 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 active:translate-y-0.5"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <span>ĐANG XỬ LÝ...</span>
                  </>
                ) : (
                  <span>CẬP NHẬT MẬT KHẨU</span>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link href="/" className="text-xs font-bold text-neutral-400 hover:text-[#E30613] transition-colors flex items-center justify-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Quay lại trang chủ
          </Link>
        </div>

      </div>
    </div>
  );
}
