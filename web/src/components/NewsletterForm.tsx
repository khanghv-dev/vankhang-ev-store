"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message?: string;
  }>({ type: "idle" });

  const validateEmail = (val: string) => {
    if (!val.trim()) {
      return "Email không được để trống.";
    }
    // Standard basic email validation regex
    const regex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!regex.test(val.trim())) {
      return "Định dạng email không hợp lệ.";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Client-side Validation
    const validationError = validateEmail(email);
    if (validationError) {
      setStatus({ type: "error", message: validationError });
      return;
    }

    // 2. Set Loading state
    setStatus({ type: "loading" });

    try {
      // 3. Send subscription request to API
      const response = await fetch("http://localhost:5022/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        // 4. Handle Success
        setStatus({
          type: "success",
          message: data.message || "Đăng ký nhận tin ưu đãi thành công!",
        });
        setEmail(""); // Clear input field
      } else {
        // 5. Handle BadRequest or other HTTP errors
        setStatus({
          type: "error",
          message: data.message || "Đăng ký không thành công. Vui lòng thử lại.",
        });
      }
    } catch (err) {
      // 6. Handle Network failures
      setStatus({
        type: "error",
        message: "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.",
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    // Clear error message when user starts typing again
    if (status.type !== "idle") {
      setStatus({ type: "idle" });
    }
  };

  return (
    <div className="flex w-full max-w-sm flex-col">
      <form
        className="flex w-full flex-col gap-2 sm:flex-row"
        onSubmit={handleSubmit}
        noValidate
      >
        <label htmlFor="footer-email" className="sr-only">
          Địa chỉ email
        </label>
        <input
          id="footer-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={handleChange}
          disabled={status.type === "loading"}
          placeholder="Nhập email của bạn"
          className="min-w-0 flex-1 rounded-lg border border-[#D1D5DB] bg-white px-4 py-2.5 text-sm text-[#111827] placeholder-[#9CA3AF] transition-colors focus:border-[#E60012] focus:outline-none focus:ring-1 focus:ring-[#E60012] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status.type === "loading"}
          className={`rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] transition-all duration-200 whitespace-nowrap flex items-center justify-center gap-2
            ${status.type === "loading"
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-[var(--color-primary-hover)] hover:-translate-y-0.5"}`}
        >
          {status.type === "loading" ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Đang gửi...
            </>
          ) : (
            "Đăng ký"
          )}
        </button>
      </form>

      {/* Status Messages */}
      {status.type === "error" && (
        <p className="text-xs text-red-500 mt-1.5 transition-all duration-300 ease-in-out">
          ⚠️ {status.message}
        </p>
      )}
      {status.type === "success" && (
        <p className="text-xs text-emerald-500 mt-1.5 font-medium transition-all duration-300 ease-in-out">
          ✓ {status.message}
        </p>
      )}
    </div>
  );
}
