"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const API_BASE = "http://localhost:5022/api/auth";

type Screen = "login" | "register" | "otp";

export default function AuthPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [screen, setScreen] = useState<Screen>("login");
  const [registeredEmail, setRegisteredEmail] = useState("");

  // Input states
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(""));

  // UI state
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);

  // Field validation error states
  const [regEmailError, setRegEmailError] = useState("");
  const [regPasswordError, setRegPasswordError] = useState("");
  const [regConfirmPasswordError, setRegConfirmPasswordError] = useState("");
  const [loginEmailError, setLoginEmailError] = useState("");
  const [loginPasswordError, setLoginPasswordError] = useState("");

  // Password strength states
  const [pwStrengthScore, setPwStrengthScore] = useState(0);
  const [pwStrengthLabel, setPwStrengthLabel] = useState("");
  const [pwStrengthColor, setPwStrengthColor] = useState("bg-neutral-200");

  // OTP Timer countdown
  const [countdown, setCountdown] = useState(60);
  const [isResendDisabled, setIsResendDisabled] = useState(true);

  // References for OTP inputs to manage focus
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Password Strength Checker ──────────────────────────────────────────────
  const checkPasswordStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    setPwStrengthScore(score);

    const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500"];
    const labels = ["Rất yếu", "Yếu", "Trung bình", "Khá mạnh", "Mạnh"];

    if (pw.length === 0) {
      setPwStrengthLabel("");
      setPwStrengthColor("bg-neutral-200");
    } else {
      setPwStrengthLabel(labels[score]);
      setPwStrengthColor(colors[score - 1] || "bg-red-500");
    }
  };

  // ── OTP Timer ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (screen === "otp" && countdown > 0) {
      setIsResendDisabled(true);
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setIsResendDisabled(false);
    }
    return () => clearInterval(timer);
  }, [screen, countdown]);

  const handleOtpScreenInit = (email: string) => {
    setRegisteredEmail(email);
    setCountdown(60);
    setOtpValues(Array(6).fill(""));
    setError(null);
    setSuccess(null);
    setScreen("otp");
    // Focus first OTP block after DOM updates
    setTimeout(() => {
      if (otpRefs.current[0]) otpRefs.current[0].focus();
    }, 100);
  };

  // ── Helper utils ───────────────────────────────────────────────────────────
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleScreenChange = (newScreen: Screen) => {
    setError(null);
    setSuccess(null);
    setEmailNotConfirmed(false);
    setRegEmailError("");
    setRegPasswordError("");
    setRegConfirmPasswordError("");
    setLoginEmailError("");
    setLoginPasswordError("");
    setScreen(newScreen);
  };

  // ── API Submission handlers ────────────────────────────────────────────────

  // 1. REGISTER
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;

    setRegEmailError("");
    setRegPasswordError("");
    setRegConfirmPasswordError("");
    setError(null);

    if (!regEmail.trim()) {
      setRegEmailError("Email không được để trống.");
      valid = false;
    } else if (!validateEmail(regEmail.trim())) {
      setRegEmailError("Địa chỉ email không hợp lệ.");
      valid = false;
    }

    if (!regPassword) {
      setRegPasswordError("Mật khẩu không được để trống.");
      valid = false;
    } else if (regPassword.length < 8) {
      setRegPasswordError("Mật khẩu phải có ít nhất 8 ký tự.");
      valid = false;
    }

    if (regPassword !== regConfirmPassword) {
      setRegConfirmPasswordError("Mật khẩu nhập lại không khớp.");
      valid = false;
    }

    if (!valid) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regEmail.trim(), password: regPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        handleOtpScreenInit(regEmail.trim());
      } else if (response.status === 409) {
        setError(data.message || "Email này đã được sử dụng.");
      } else {
        setError(data.message || "Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.");
      }
    } catch {
      setError("Không thể kết nối với máy chủ API. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  // 2. OTP VERIFICATION
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const otpCode = otpValues.join("");
    if (otpCode.length < 6) {
      setError("Vui lòng nhập đủ 6 chữ số.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail, otpCode }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || "Xác thực email thành công! Đang chuyển đến đăng nhập...");
        setTimeout(() => {
          setLoginEmail(registeredEmail);
          handleScreenChange("login");
        }, 2000);
      } else {
        setError(data.message || "Mã OTP không hợp lệ hoặc đã hết hạn.");
        setOtpValues(Array(6).fill(""));
        if (otpRefs.current[0]) otpRefs.current[0].focus();
      }
    } catch {
      setError("Không thể kết nối với máy chủ API.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    setSuccess(null);
    setCountdown(60);
    setIsResendDisabled(true);

    try {
      // Re-triggering register logic to issue a new OTP
      const response = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail, password: regPassword || "VinFastO2O-DummyPassword123!" }),
      });

      if (response.ok || response.status === 409) {
        // Confirmed duplicates or successful creation generates a new OTP
        setSuccess("Mã OTP mới đã được gửi lại vào hòm thư.");
        setTimeout(() => setSuccess(null), 4000);
      } else {
        setError("Không thể gửi lại mã OTP. Vui lòng thử lại sau.");
      }
    } catch {
      setError("Không thể kết nối đến máy chủ.");
    }
  };

  // 3. LOGIN
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;

    setLoginEmailError("");
    setLoginPasswordError("");
    setError(null);
    setEmailNotConfirmed(false);

    if (!loginEmail.trim()) {
      setLoginEmailError("Email không được để trống.");
      valid = false;
    } else if (!validateEmail(loginEmail.trim())) {
      setLoginEmailError("Địa chỉ email không hợp lệ.");
      valid = false;
    }

    if (!loginPassword) {
      setLoginPasswordError("Mật khẩu không được để trống.");
      valid = false;
    }

    if (!valid) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      });

      const data = await response.json();

      if (response.ok && data?.accessToken) {
        setSuccess("Đăng nhập thành công!");
        login(data.accessToken);
        router.push("/");
      } else if (!response.ok) {
        if (response.status === 403 && data?.errorCode === "EMAIL_NOT_CONFIRMED") {
          setEmailNotConfirmed(true);
        } else {
          setError(data?.message || "Tên tài khoản hoặc mật khẩu không chính xác.");
        }
      } else {
        setError("Dữ liệu phản hồi từ máy chủ không hợp lệ.");
      }
    } catch (error) {
      setError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  // ── OTP Keyboard handling ──────────────────────────────────────────────────
  const handleOtpChange = (val: string, index: number) => {
    const numericVal = val.replace(/\D/g, "");
    if (!numericVal) return;

    const newValues = [...otpValues];
    // If user paste a multi-digit number
    if (numericVal.length > 1) {
      const sliced = numericVal.slice(0, 6 - index);
      for (let i = 0; i < sliced.length; i++) {
        newValues[index + i] = sliced[i];
      }
      setOtpValues(newValues);
      const targetFocus = Math.min(index + sliced.length, 5);
      if (otpRefs.current[targetFocus]) otpRefs.current[targetFocus]?.focus();
      return;
    }

    newValues[index] = numericVal;
    setOtpValues(newValues);

    // Auto-focus next input
    if (index < 5 && otpRefs.current[index + 1]) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!otpValues[index] && index > 0) {
        const newValues = [...otpValues];
        newValues[index - 1] = "";
        setOtpValues(newValues);
        if (otpRefs.current[index - 1]) otpRefs.current[index - 1]?.focus();
      } else {
        const newValues = [...otpValues];
        newValues[index] = "";
        setOtpValues(newValues);
      }
    } else if (e.key === "ArrowLeft" && index > 0 && otpRefs.current[index - 1]) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5 && otpRefs.current[index + 1]) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text").replace(/\D/g, "");
    const newValues = [...otpValues];
    for (let i = 0; i < Math.min(pastedText.length, 6); i++) {
      newValues[i] = pastedText[i];
    }
    setOtpValues(newValues);
    const targetFocus = Math.min(pastedText.length, 5);
    if (otpRefs.current[targetFocus]) otpRefs.current[targetFocus]?.focus();
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-200">
      <div className="bg-white shadow-2xl rounded-2xl border border-neutral-100 p-8 max-w-md w-full relative overflow-hidden transition-all duration-300">
        
        {/* Brand Stripe Indicator */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-500 via-brand-400 to-brand-700"></div>

        {/* ── Brand Logo Header ── */}
        <div className="flex flex-col items-center mb-8 select-none">
          <svg width="50" height="50" viewBox="0 0 54 54" fill="none" className="mb-2.5 transition-transform duration-300 hover:scale-105" xmlns="http://www.w3.org/2000/svg">
            <rect width="54" height="54" rx="12" fill="#E30613" />
            <path d="M11 16L27 38L43 16" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19 16L27 29L35 16" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
          </svg>
          <span className="text-xl font-black tracking-widest text-neutral-900 uppercase">VinFast</span>
          <span className="text-[10px] tracking-[0.22em] text-neutral-400 font-bold uppercase mt-0.5">Online-to-Offline Platform</span>
        </div>

        {/* ── SCREEN 1: REGISTER ── */}
        {screen === "register" && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-350">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-black text-neutral-900">Tạo tài khoản</h1>
              <p className="text-sm text-neutral-400 mt-1 font-semibold uppercase tracking-wider text-[11px]">Đăng ký trải nghiệm dịch vụ VinFast O2O</p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Email */}
              <div className="relative">
                <input
                  type="email"
                  placeholder="Địa chỉ Email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border bg-neutral-50 text-neutral-800 text-sm outline-none transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:bg-white ${
                    regEmailError ? "border-brand-500 ring-2 ring-brand-500/10" : "border-neutral-200"
                  }`}
                />
                {regEmailError && <p className="text-brand-500 text-xs font-semibold mt-1">{regEmailError}</p>}
              </div>

              {/* Password */}
              <div className="relative">
                <input
                  type={showRegPassword ? "text" : "password"}
                  placeholder="Mật khẩu (tối thiểu 8 ký tự)"
                  value={regPassword}
                  onChange={(e) => {
                    setRegPassword(e.target.value);
                    checkPasswordStrength(e.target.value);
                  }}
                  className={`w-full px-4 py-3 pr-10 rounded-xl border bg-neutral-50 text-neutral-800 text-sm outline-none transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:bg-white ${
                    regPasswordError ? "border-brand-500 ring-2 ring-brand-500/10" : "border-neutral-200"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3 top-3.5 text-neutral-400 hover:text-brand-500 cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                
                {/* Strength Meter */}
                {regPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      <div className={`h-1.5 flex-1 rounded-full ${pwStrengthScore >= 1 ? pwStrengthColor : "bg-neutral-200"}`} />
                      <div className={`h-1.5 flex-1 rounded-full ${pwStrengthScore >= 2 ? pwStrengthColor : "bg-neutral-200"}`} />
                      <div className={`h-1.5 flex-1 rounded-full ${pwStrengthScore >= 3 ? pwStrengthColor : "bg-neutral-200"}`} />
                      <div className={`h-1.5 flex-1 rounded-full ${pwStrengthScore >= 4 ? pwStrengthColor : "bg-neutral-200"}`} />
                    </div>
                    <span className="text-[10px] font-bold" style={{ color: pwStrengthScore > 0 ? "var(--color-primary)" : "#9ca3af" }}>
                      Độ mạnh mật khẩu: {pwStrengthLabel}
                    </span>
                  </div>
                )}
                {regPasswordError && <p className="text-brand-500 text-xs font-semibold mt-1">{regPasswordError}</p>}
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-3 pr-10 rounded-xl border bg-neutral-50 text-neutral-800 text-sm outline-none transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:bg-white ${
                    regConfirmPasswordError ? "border-brand-500 ring-2 ring-brand-500/10" : "border-neutral-200"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3.5 text-neutral-400 hover:text-brand-500 cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                {regConfirmPasswordError && <p className="text-brand-500 text-xs font-semibold mt-1">{regConfirmPasswordError}</p>}
              </div>

              {/* Error Box */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-brand-500 text-sm rounded-xl px-4 py-3 font-medium">
                  {error}
                </div>
              )}

              {/* Submit btn */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-black text-xs tracking-wider text-white bg-brand-500 hover:bg-brand-600 active:scale-[0.98] transition-all duration-200 shadow-md shadow-brand-500/20 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Đang tạo tài khoản...
                  </span>
                ) : (
                  "ĐĂNG KÝ TÀI KHOẢN"
                )}
              </button>

              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-neutral-100"></div>
                <span className="text-xs text-neutral-300 font-semibold">hoặc</span>
                <div className="flex-1 h-px bg-neutral-100"></div>
              </div>

              <p className="text-center text-sm text-neutral-500 font-medium">
                Đã có tài khoản?
                <button
                  type="button"
                  onClick={() => handleScreenChange("login")}
                  className="text-brand-500 font-bold hover:underline ml-1.5 focus:outline-none cursor-pointer"
                >
                  Đăng nhập
                </button>
              </p>
            </form>
          </div>
        )}

        {/* ── SCREEN 2: OTP VERIFICATION ── */}
        {screen === "otp" && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-350">
            <div className="mb-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto shadow-inner text-brand-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-black text-neutral-900">Xác thực Email</h1>
                <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                  Chúng tôi đã gửi mã xác thực gồm <strong className="text-neutral-700">6 chữ số</strong> về địa chỉ: <br />
                  <span className="text-brand-500 font-bold text-sm block mt-1">{registeredEmail}</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleOtpSubmit} className="space-y-5">
              {/* 6 OTP Inputs */}
              <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                {otpValues.map((val, idx) => (
                  <input
                    key={idx}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={val}
                    ref={(el) => {
                      otpRefs.current[idx] = el;
                    }}
                    onChange={(e) => handleOtpChange(e.target.value, idx)}
                    onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                    className="w-12 h-14 text-center text-xl font-bold border border-neutral-200 rounded-xl bg-neutral-50 outline-none transition-all duration-200 text-neutral-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:bg-white"
                  />
                ))}
              </div>

              {/* Error messages */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-brand-500 text-sm rounded-xl px-4 py-3 text-center font-medium animate-shake">
                  ⚠️ {error}
                </div>
              )}

              {/* Success messages */}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 text-center font-semibold flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{success}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-black text-xs tracking-wider text-white bg-brand-500 hover:bg-brand-600 active:scale-[0.98] transition-all duration-200 shadow-md shadow-brand-500/20 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Đang kích hoạt...
                  </span>
                ) : (
                  "XÁC NHẬN KÍCH HOẠT"
                )}
              </button>

              {/* Resend button */}
              <div className="flex items-center justify-center gap-2 mt-4 text-xs font-semibold text-neutral-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isResendDisabled}
                  className={`transition-colors cursor-pointer ${
                    isResendDisabled ? "text-neutral-400 cursor-default" : "text-brand-500 hover:underline"
                  }`}
                >
                  {isResendDisabled ? `Gửi lại mã sau ${countdown}s` : "Gửi lại mã OTP"}
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => handleScreenChange("register")}
                  className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors focus:outline-none cursor-pointer font-bold"
                >
                  ← Quay lại Đăng ký
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── SCREEN 3: LOGIN ── */}
        {screen === "login" && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-350">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-black text-neutral-900">Chào mừng trở lại</h1>
              <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider mt-1">Đăng nhập tài khoản VinFast O2O</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Email */}
              <div className="relative">
                <input
                  type="email"
                  placeholder="Địa chỉ Email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border bg-neutral-50 text-neutral-800 text-sm outline-none transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:bg-white ${
                    loginEmailError ? "border-brand-500 ring-2 ring-brand-500/10" : "border-neutral-200"
                  }`}
                />
                {loginEmailError && <p className="text-brand-500 text-xs font-semibold mt-1">{loginEmailError}</p>}
              </div>

              {/* Password */}
              <div className="relative">
                <input
                  type={showLoginPassword ? "text" : "password"}
                  placeholder="Mật khẩu"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className={`w-full px-4 py-3 pr-10 rounded-xl border bg-neutral-50 text-neutral-800 text-sm outline-none transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:bg-white ${
                    loginPasswordError ? "border-brand-500 ring-2 ring-brand-500/10" : "border-neutral-200"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-3.5 text-neutral-400 hover:text-brand-500 cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                {loginPasswordError && <p className="text-brand-500 text-xs font-semibold mt-1">{loginPasswordError}</p>}
              </div>

              {/* Remember me + Forgot password */}
              <div className="flex items-center justify-between text-xs font-semibold select-none">
                <label className="flex items-center gap-2 text-neutral-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-300 accent-brand-500 cursor-pointer"
                  />
                  <span>Ghi nhớ đăng nhập</span>
                </label>
                <button type="button" className="text-brand-500 hover:underline cursor-pointer">
                  Quên mật khẩu?
                </button>
              </div>

              {/* Error alert */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-brand-500 text-sm rounded-xl px-4 py-3 font-medium">
                  {error}
                </div>
              )}

              {/* Email Unconfirmed block */}
              {emailNotConfirmed && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-2 text-left">
                  <p className="text-amber-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    ⚠️ Tài khoản chưa được kích hoạt
                  </p>
                  <p className="text-amber-600 text-[11px] font-medium leading-relaxed">
                    Vui lòng kiểm tra lại hòm thư email của bạn để lấy mã OTP và tiến hành kích hoạt tài khoản trước khi đăng nhập.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleOtpScreenInit(loginEmail.trim())}
                    className="text-xs text-brand-500 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    → Xác thực ngay
                  </button>
                </div>
              )}



              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-black text-xs tracking-wider text-white bg-brand-500 hover:bg-brand-600 active:scale-[0.98] transition-all duration-200 shadow-md shadow-brand-500/20 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Đang đăng nhập...
                  </span>
                ) : (
                  "ĐĂNG NHẬP"
                )}
              </button>

              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-neutral-100"></div>
                <span className="text-xs text-neutral-300 font-semibold">hoặc</span>
                <div className="flex-1 h-px bg-neutral-100"></div>
              </div>

              <p className="text-center text-sm text-neutral-500 font-medium">
                Chưa có tài khoản?
                <button
                  type="button"
                  onClick={() => handleScreenChange("register")}
                  className="text-brand-500 font-bold hover:underline ml-1.5 focus:outline-none cursor-pointer"
                >
                  Đăng ký ngay
                </button>
              </p>
            </form>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-[10px] text-neutral-300 font-semibold uppercase tracking-wider mt-8">
          © 2026 VinFast O2O · Bảo mật ISO 27001
        </p>

      </div>
    </div>
  );
}
