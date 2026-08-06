"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

interface InstallmentPeriod {
  periodId: number;
  periodName: string;
  dueDate: string;
  amount: string;
  principal: number;
  interest: string;
  status: "PAID" | "UNPAID_CURRENT" | "UNPAID_FUTURE";
  transactionId?: string;
}

export default function InstallmentSchedulePage() {
  const router = useRouter();
  const { isAuthenticated, userEmail } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const [remainingBalance, setRemainingBalance] = useState(0);
  const [totalLoan, setTotalLoan] = useState(0);
  const [bankName, setBankName] = useState("Ngân hàng liên kết VinFast");
  const [loanTermMonths, setLoanTermMonths] = useState(12);
  const [periods, setPeriods] = useState<InstallmentPeriod[]>([]);

  const [checkoutPeriod, setCheckoutPeriod] = useState<InstallmentPeriod | null>(null);
  const [paying, setPaying] = useState(false);

  const [activeOrderId, setActiveOrderId] = useState<string>("");

  useEffect(() => {
    async function fetchInstallmentSchedule() {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          router.push("/login");
          return;
        }

        const url = userEmail
          ? `http://localhost:5022/api/orders/my-orders?email=${encodeURIComponent(userEmail)}`
          : "http://localhost:5022/api/orders/my-orders";

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const loanOrder = data[0]; // Get customer's latest order
            const rawId = typeof loanOrder.id === "string" ? loanOrder.id : loanOrder.id?.value ? String(loanOrder.id.value) : String(loanOrder.id || "ORD-2026");
            setActiveOrderId(rawId);

            const vehiclePrice = loanOrder.totalAmount || 19400000;
            const depositPaid = loanOrder.depositAmount || 2000000;
            const loanVal = Math.max(vehiclePrice - depositPaid, 10000000);
            
            setTotalLoan(loanVal);
            setBankName("Techcombank / VietinBank VinFast Partner");
            setLoanTermMonths(12);

            // Read saved paid periods from localStorage (default 0 for real data)
            const savedPaidStr = localStorage.getItem(`installment_paid_${rawId}`);
            const paidCount = savedPaidStr ? parseInt(savedPaidStr, 10) : 0;

            const monthlyPrincipal = Math.round(loanVal / 12);
            let currentRemaining = loanVal - (paidCount * monthlyPrincipal);

            const baseDate = loanOrder.createdAt ? new Date(loanOrder.createdAt) : new Date();

            const generatedPeriods: InstallmentPeriod[] = Array.from({ length: 12 }).map((_, idx) => {
              const monthNum = idx + 1;
              const dueDateObj = new Date(baseDate);
              dueDateObj.setMonth(baseDate.getMonth() + monthNum);

              const interestVal = Math.round(Math.max(loanVal - (idx * monthlyPrincipal), 0) * 0.007);
              const totalMon = monthlyPrincipal + interestVal;

              let statusStr: "PAID" | "UNPAID_CURRENT" | "UNPAID_FUTURE" = "UNPAID_FUTURE";
              if (idx < paidCount) {
                statusStr = "PAID";
              } else if (idx === paidCount) {
                statusStr = "UNPAID_CURRENT";
              }

              return {
                periodId: monthNum,
                periodName: `Kỳ ${monthNum} (Tháng ${dueDateObj.getMonth() + 1}/${dueDateObj.getFullYear()})`,
                dueDate: dueDateObj.toLocaleDateString("vi-VN"),
                amount: `${totalMon.toLocaleString("vi-VN")} đ`,
                principal: monthlyPrincipal,
                interest: `${interestVal.toLocaleString("vi-VN")} đ`,
                status: statusStr,
                transactionId: idx < paidCount ? `FT260${idx + 1}512398` : undefined
              };
            });

            setRemainingBalance(Math.max(currentRemaining, 0));
            setPeriods(generatedPeriods);
          }
        }
      } catch (error) {
        console.error("Lỗi khi nạp lịch trình trả góp:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchInstallmentSchedule();
  }, [router]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val);
  };

  const handleProcessPayment = () => {
    if (!checkoutPeriod) return;
    setPaying(true);
    
    setTimeout(() => {
      let newPaidCount = 0;
      setPeriods((prevPeriods) => {
        const updated = prevPeriods.map((p) => {
          if (p.periodId === checkoutPeriod.periodId) {
            return {
              ...p,
              status: "PAID" as const,
              transactionId: `FT2618${Math.floor(100000 + Math.random() * 900000)}`,
            };
          }
          if (p.periodId === checkoutPeriod.periodId + 1) {
            return {
              ...p,
              status: "UNPAID_CURRENT" as const,
            };
          }
          return p;
        });

        newPaidCount = updated.filter(p => p.status === "PAID").length;
        if (activeOrderId) {
          localStorage.setItem(`installment_paid_${activeOrderId}`, String(newPaidCount));
        }

        return updated;
      });
      
      setRemainingBalance((prev) => Math.max(prev - checkoutPeriod.principal, 0));
      setPaying(false);
      setCheckoutPeriod(null);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-neutral-50 gap-4">
        <svg className="animate-spin h-10 w-10 text-[#E30613]" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <span className="text-sm font-semibold text-neutral-500">Đang tải lịch trình trả góp...</span>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-neutral-50 via-neutral-100 to-neutral-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400">
          <Link href="/" className="hover:text-[#E30613] transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-neutral-500">Trang cá nhân</span>
          <span>/</span>
          <span className="text-neutral-700">Lịch sử trả góp</span>
        </div>

        {/* Page Header */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#E30613] to-red-800"></div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 font-sans text-left">Lịch trình thanh toán trả góp</h1>
            <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider mt-0.5 text-left">Theo dõi lịch hẹn đóng tiền định kỳ hàng tháng cho gói mua xe của bạn</p>
          </div>
        </div>

        {periods.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-100 p-12 text-center shadow-xl space-y-4">
            <div className="text-4xl">📄</div>
            <h2 className="text-lg font-bold text-neutral-800">Chưa có hợp đồng trả góp nào</h2>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              Bạn chưa có hợp đồng trả góp hoặc đơn hàng đặt cọc nào trên hệ thống. Hãy đăng ký đặt cọc xe điện VinFast để nhận thông tin gói vay và lịch trả góp chi tiết.
            </p>
            <div className="pt-2">
              <Link
                href="/products"
                className="inline-block px-6 py-3 bg-[#E30613] text-white rounded-xl text-xs font-extrabold uppercase tracking-wider hover:bg-red-700 transition shadow-md"
              >
                Khám phá danh mục xe
              </Link>
            </div>
          </div>
        ) : (
          <>
        {/* Loan Summary Box */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-6 sm:p-8 shadow-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#E30613]"></div>
          
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Tổng gói vay</span>
            <p className="text-lg font-black text-neutral-900">{formatCurrency(totalLoan)}</p>
          </div>

          <div className="space-y-1 text-left sm:border-l sm:border-neutral-100 sm:pl-6">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Đối tác tài chính</span>
            <p className="text-xs font-black text-neutral-800 leading-snug">{bankName}</p>
            <p className="text-[9px] font-semibold text-neutral-400">Ngân hàng đối tác VinFast O2O</p>
          </div>

          <div className="space-y-1 text-left md:border-l md:border-neutral-100 md:pl-6">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Kỳ hạn vay</span>
            <p className="text-lg font-black text-neutral-900">{loanTermMonths} tháng</p>
          </div>

          <div className="space-y-1 text-left sm:border-l sm:border-neutral-100 sm:pl-6">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Dư nợ còn lại</span>
            <p className="text-lg font-black text-[#E30613]">{formatCurrency(remainingBalance)}</p>
          </div>
        </div>

        {/* Payment Schedule Card */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-6 sm:p-8 shadow-xl space-y-6">
          <h2 className="text-sm font-black uppercase tracking-wider text-neutral-800 border-l-4 border-[#E30613] pl-3 leading-none text-left">
            Chi tiết lịch thanh toán định kỳ
          </h2>

          {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-100 text-[10px] font-black uppercase tracking-wider text-neutral-400">
                      <th className="pb-4 font-black">Kỳ hạn</th>
                      <th className="pb-4 font-black">Hạn chót đóng</th>
                      <th className="pb-4 font-black text-right">Số tiền phải đóng</th>
                      <th className="pb-4 font-black pl-8">Trạng thái đóng tiền</th>
                      <th className="pb-4 font-black text-right">Hành động</th>
                    </tr>
                  </thead>
              <tbody className="divide-y divide-neutral-50 text-xs font-semibold text-neutral-700">
                {periods.map((p) => (
                  <tr key={p.periodId} className="group hover:bg-neutral-50/50 transition-colors">
                    <td className="py-4 font-black text-neutral-900">{p.periodName}</td>
                    <td className="py-4 font-mono font-bold text-neutral-500">{p.dueDate}</td>
                    <td className="py-4 text-right">
                      <p className="font-black text-neutral-800">{p.amount}</p>
                      <p className="text-[9px] text-neutral-400">Gốc: {formatCurrency(p.principal)} | Lãi: {p.interest}</p>
                    </td>
                    <td className="py-4 pl-8 text-left">
                      {p.status === "PAID" && (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 rounded bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700 ring-1 ring-inset ring-green-200">
                            ✓ Đã thanh toán
                          </span>
                          <p className="text-[8px] font-mono text-neutral-400">Giao dịch: {p.transactionId}</p>
                        </div>
                      )}
                      {p.status === "UNPAID_CURRENT" && (
                        <span className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 ring-1 ring-inset ring-red-200 animate-pulse">
                          ⚠️ Chưa thanh toán
                        </span>
                      )}
                      {p.status === "UNPAID_FUTURE" && (
                        <span className="inline-flex items-center gap-1 rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-400 ring-1 ring-inset ring-neutral-200">
                          Chưa thanh toán
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      {p.status === "UNPAID_CURRENT" && (
                        <button
                          onClick={() => setCheckoutPeriod(p)}
                          className="inline-flex items-center justify-center rounded-lg bg-[#E30613] hover:bg-red-700 text-white font-extrabold text-[10px] tracking-wide uppercase px-3 py-1.5 transition-colors cursor-pointer shadow-md shadow-brand-500/10"
                        >
                          💳 Thanh toán kỳ này
                        </button>
                      )}
                      {p.status === "PAID" && (
                        <span className="text-[10px] font-bold text-neutral-400">Đã hoàn thành</span>
                      )}
                      {p.status === "UNPAID_FUTURE" && (
                        <span className="text-[10px] font-bold text-neutral-300">Chưa đến hạn</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden space-y-4">
            {periods.map((p) => (
              <div 
                key={p.periodId}
                className={`rounded-2xl border p-5 space-y-4 text-left relative overflow-hidden transition-all ${
                  p.status === "UNPAID_CURRENT" 
                    ? "border-red-200 bg-red-50/5 shadow-md shadow-red-500/5" 
                    : "border-neutral-150 bg-white"
                }`}
              >
                {/* Top header */}
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black text-neutral-900">{p.periodName}</h3>
                  <span className="text-[10px] font-mono font-bold text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-150">
                    Hạn chót: {p.dueDate}
                  </span>
                </div>

                {/* Amount details */}
                <div className="flex justify-between items-baseline border-y border-neutral-50 py-2.5">
                  <span className="text-xs font-semibold text-neutral-400">Số tiền phải đóng:</span>
                  <div className="text-right">
                    <p className="text-sm font-black text-neutral-800">{p.amount}</p>
                    <p className="text-[9px] text-neutral-400">Gốc: {formatCurrency(p.principal)} | Lãi: {p.interest}</p>
                  </div>
                </div>

                {/* Bottom section: status and buttons */}
                <div className="flex justify-between items-center pt-1.5">
                  <div>
                    {p.status === "PAID" && (
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1 rounded bg-green-50 px-2 py-0.5 text-[9px] font-bold text-green-700 ring-1 ring-inset ring-green-200">
                          ✓ Đã thanh toán
                        </span>
                        <p className="text-[8px] font-mono text-neutral-400">Giao dịch: {p.transactionId}</p>
                      </div>
                    )}
                    {p.status === "UNPAID_CURRENT" && (
                      <span className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-0.5 text-[9px] font-bold text-red-700 ring-1 ring-inset ring-red-200 animate-pulse">
                        ⚠️ Chưa thanh toán
                      </span>
                    )}
                    {p.status === "UNPAID_FUTURE" && (
                      <span className="inline-flex items-center gap-1 rounded bg-neutral-100 px-2 py-0.5 text-[9px] font-bold text-neutral-400 ring-1 ring-inset ring-neutral-200">
                        Chưa đến hạn
                      </span>
                    )}
                  </div>
                  <div>
                    {p.status === "UNPAID_CURRENT" && (
                      <button
                        onClick={() => setCheckoutPeriod(p)}
                        className="inline-flex items-center justify-center rounded-lg bg-[#E30613] hover:bg-red-700 text-white font-extrabold text-[10px] tracking-wide uppercase px-3.5 py-2 transition-colors cursor-pointer shadow-md"
                      >
                        💳 Thanh toán
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    )}

        {/* Checkout Simulation Dialog Modal */}
        {checkoutPeriod && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div 
              onClick={() => { if(!paying) setCheckoutPeriod(null); }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            ></div>

            {/* Dialog Container */}
            <div className="bg-white rounded-3xl border border-neutral-100 p-6 sm:p-8 max-w-sm w-full relative z-10 shadow-2xl flex flex-col space-y-6 animate-in zoom-in-95 duration-200 text-left">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#E30613] to-red-800"></div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#E30613] leading-none">Cổng thanh toán điện tử</span>
                <h3 className="text-lg font-black text-neutral-900 font-sans">Thanh toán kỳ hạn {checkoutPeriod.periodName}</h3>
                <p className="text-[10px] text-neutral-450 font-semibold uppercase leading-none">Đối tác ngân hàng: VietinBank</p>
              </div>

              {/* Transaction billing list */}
              <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-150 space-y-2 text-xs font-semibold text-neutral-500">
                <div className="flex justify-between py-0.5">
                  <span>Tiền gốc định kỳ:</span>
                  <span className="font-bold text-neutral-800">{formatCurrency(checkoutPeriod.principal)}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span>Tiền lãi kỳ này:</span>
                  <span className="font-bold text-neutral-800">{checkoutPeriod.interest}</span>
                </div>
                <div className="border-t border-neutral-200 my-2 pt-2 flex justify-between items-center text-sm">
                  <span className="font-black text-neutral-700">Tổng thanh toán:</span>
                  <span className="font-black text-[#E30613] text-base">{checkoutPeriod.amount}</span>
                </div>
              </div>

              {/* Simulation message or spinner */}
              {paying ? (
                <div className="flex flex-col items-center justify-center py-4 space-y-3">
                  <svg className="animate-spin h-8 w-8 text-[#E30613]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Đang xác thực giao dịch...</span>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => setCheckoutPeriod(null)}
                    disabled={paying}
                    className="flex-1 py-3 rounded-xl border border-neutral-250 hover:bg-neutral-50 active:scale-[0.98] text-neutral-755 text-xs font-black uppercase transition-all cursor-pointer text-center"
                  >
                    Đóng
                  </button>
                  <button
                    onClick={handleProcessPayment}
                    disabled={paying}
                    className="flex-[2] py-3 rounded-xl bg-[#E30613] hover:bg-red-700 active:scale-[0.98] text-white text-xs font-black tracking-wider uppercase transition-all shadow-md shadow-brand-500/10 cursor-pointer text-center"
                  >
                    Xác nhận thanh toán
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
