"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface GuideStep {
  number: number;
  title: string;
  desc: string;
  icon: string;
}

const STEPS: GuideStep[] = [
  {
    number: 1,
    title: "Chọn dòng xe & Cấu hình pin",
    desc: "Khách hàng duyệt qua danh mục xe máy điện thế hệ mới của VinFast (như Evo200, Feliz S, Klara S). Lựa chọn cấu hình thuê pin (tiết kiệm chi phí ban đầu) hoặc mua đứt pin đi kèm xe tùy theo nhu cầu di chuyển hàng ngày.",
    icon: "🛵"
  },
  {
    number: 2,
    title: "Chọn Showroom nhận xe gần nhất",
    desc: "Định vị showroom hoặc xưởng dịch vụ ủy quyền của VinFast gần nhà bạn nhất trên hệ thống bản đồ số trực quan. Địa điểm này sẽ chịu trách nhiệm chuẩn bị xe, gán số VIN định danh và làm lễ bàn giao trực tiếp.",
    icon: "📍"
  },
  {
    number: 3,
    title: "Thanh toán đặt cọc trực tuyến",
    desc: "Lựa chọn gói cọc: Cọc linh hoạt 2 triệu (được rút cọc hoặc chuyển nhượng suất mua) hoặc Cọc cam kết 5 triệu (không hoàn hủy, ưu tiên giao xe sớm nhất). Thanh toán nhanh qua VNPAY, Momo hoặc quét mã QR ngân hàng an toàn.",
    icon: "💳"
  },
  {
    number: 4,
    title: "Nhận mã vé QR và ra Showroom",
    desc: "Hệ thống ghi nhận giao dịch thành công, tự động cấp mã Vé điện tử (E-Ticket) dạng QR Code và gán số VIN xe. Quý khách chụp màn hình vé này mang cùng Căn cước công dân gắn chíp ra Showroom được chỉ định để nhận bàn giao xe điện.",
    icon: "🎉"
  }
];

export default function BuyingGuide() {
  // Calculator settings
  const [vehiclePrice, setVehiclePrice] = useState(27000000); // Default Feliz S
  const [downPaymentPercent, setDownPaymentPercent] = useState(30); // 30% downpayment
  const [tenureMonths, setTenureMonths] = useState(12); // 12 months tenure
  const [paymentMethod, setPaymentMethod] = useState<"card" | "finance">("card"); // card: 0% interest, finance: 0.8% interest

  // Dynamic Interest Rate based on method
  const interestRate = useMemo(() => {
    return paymentMethod === "card" ? 0 : 0.8; // card is 0%, finance is 0.8% flat per month
  }, [paymentMethod]);

  // Calculator results
  const calculatedLoan = useMemo(() => {
    const downPayment = (vehiclePrice * downPaymentPercent) / 100;
    const loanAmount = vehiclePrice - downPayment;
    
    // Monthly payment calculation
    const monthlyPrincipal = loanAmount / tenureMonths;
    const monthlyInterest = (loanAmount * interestRate) / 100;
    const monthlyTotal = monthlyPrincipal + monthlyInterest;

    return {
      downPayment,
      loanAmount,
      monthlyPrincipal,
      monthlyInterest,
      monthlyTotal
    };
  }, [vehiclePrice, downPaymentPercent, tenureMonths, interestRate]);

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl bg-white font-sans">
      
      {/* 1. Breadcrumbs */}
      <nav className="mb-6 flex" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <li>
            <Link href="/" className="hover:text-[#E30613] transition-colors">Trang chủ</Link>
          </li>
          <li className="flex items-center gap-1.5">
            <svg className="h-3 w-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
            <Link href="/ho-tro" className="hover:text-[#E30613] transition-colors">Hỗ trợ</Link>
          </li>
          <li className="flex items-center gap-1.5">
            <svg className="h-3 w-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
            <span className="text-slate-500 font-medium">Hướng dẫn mua hàng &amp; trả góp</span>
          </li>
        </ol>
      </nav>

      {/* 2. Main Title */}
      <header className="mb-10 space-y-3">
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none uppercase">
          Hướng Dẫn Mua Hàng &amp; Đặt Cọc Online
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 font-semibold uppercase tracking-wider">
          Sở hữu xe máy điện thông minh VinFast qua 4 bước đặt cọc trực tuyến đơn giản
        </p>
      </header>

      {/* 3. Buying Steps Grid */}
      <section aria-label="Các bước mua hàng" className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {STEPS.map((step) => (
          <div 
            key={step.number}
            className="bg-slate-50 rounded-3xl border border-slate-150 p-6 flex flex-col justify-between hover:shadow-md transition-shadow duration-300 relative overflow-hidden group"
          >
            {/* Background number watermark */}
            <span className="absolute -bottom-8 -right-4 text-9xl font-black text-slate-150/45 select-none pointer-events-none group-hover:scale-105 transition-transform duration-300">
              0{step.number}
            </span>

            <div className="space-y-4 relative z-10">
              {/* Card Header (Icon and Step Number) */}
              <div className="flex justify-between items-center">
                <span className="text-2xl">{step.icon}</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E30613] text-xs font-black text-white shadow-md">
                  {step.number}
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h3 className="text-sm font-black text-slate-950 uppercase tracking-tight">
                  Bước {step.number}: {step.title}
                </h3>
                <p className="text-[11.5px] text-slate-500 font-medium leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>

            {/* Quick Helper Subtext */}
            <div className="pt-4 mt-4 border-t border-slate-200/50 flex justify-between items-center relative z-10">
              <span className="text-[9px] text-[#E30613] font-black uppercase tracking-wider">Quy trình chuẩn</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Thực hiện online</span>
            </div>
          </div>
        ))}
      </section>

      {/* 4. Comparison Table Section */}
      <section aria-label="Bảng so sánh hình thức trả góp" className="mb-16 space-y-6">
        <div className="text-center md:text-left space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-tight">
            So Sánh Các Hình Thức Trả Góp Xe Máy Điện
          </h2>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Lựa chọn phương thức trả góp phù hợp nhất với điều kiện tài chính của bạn
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Card 1: Credit Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors duration-300">
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <span className="bg-red-50 text-[#E30613] text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                    Lãi suất 0%
                  </span>
                  <h3 className="text-base font-black text-slate-950 uppercase tracking-tight mt-2.5">
                    Trả góp qua Thẻ tín dụng
                  </h3>
                </div>
                <span className="text-2xl">💳</span>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3 text-xs font-semibold text-slate-600">
                <p className="flex justify-between pb-2 border-b border-slate-50">
                  <span>Lãi suất hàng tháng:</span>
                  <span className="text-emerald-600 font-black">0% Lãi suất thực tế</span>
                </p>
                <p className="flex justify-between pb-2 border-b border-slate-50">
                  <span>Xét duyệt hồ sơ:</span>
                  <span className="text-slate-800 font-bold">Không cần duyệt (Miễn phí hồ sơ)</span>
                </p>
                <p className="flex justify-between pb-2 border-b border-slate-50">
                  <span>Kỳ hạn trả góp:</span>
                  <span className="text-slate-800 font-bold">Linh hoạt 6 - 9 - 12 tháng</span>
                </p>
                <p className="flex justify-between pb-2 border-b border-slate-50">
                  <span>Tỷ lệ trả trước tối thiểu:</span>
                  <span className="text-slate-800 font-bold">0% (Chấp nhận trả trước bằng thẻ)</span>
                </p>
                <p className="flex flex-col gap-1 pt-1 text-[11px] text-slate-400 font-medium leading-relaxed">
                  <span className="font-bold text-slate-500">Yêu cầu điều kiện:</span>
                  Khách hàng sở hữu thẻ tín dụng quốc tế (Visa, Mastercard, JCB) từ hơn 20 ngân hàng đối tác liên kết, hạn mức khả dụng lớn hơn hoặc bằng tổng giá trị xe cần góp.
                </p>
              </div>
            </div>

            <button
              onClick={() => setPaymentMethod("card")}
              className={`w-full rounded-2xl text-xs font-black uppercase text-center py-3.5 mt-6 transition-all border-2 active:scale-98 cursor-pointer ${
                paymentMethod === "card"
                  ? "bg-slate-950 border-slate-950 text-white shadow-md"
                  : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
              }`}
            >
              {paymentMethod === "card" ? "Đang chọn xem gói này" : "Chọn xem tính toán trả góp thẻ"}
            </button>
          </div>

          {/* Card 2: Finance Company */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors duration-300">
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <span className="bg-amber-50 text-amber-700 text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider border border-amber-100">
                    HD Saison / FE Credit
                  </span>
                  <h3 className="text-base font-black text-slate-950 uppercase tracking-tight mt-2.5">
                    Trả góp qua Công ty tài chính
                  </h3>
                </div>
                <span className="text-2xl">🏦</span>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3 text-xs font-semibold text-slate-600">
                <p className="flex justify-between pb-2 border-b border-slate-50">
                  <span>Lãi suất hàng tháng:</span>
                  <span className="text-slate-900 font-black">Ưu đãi cố định 0.8% / tháng</span>
                </p>
                <p className="flex justify-between pb-2 border-b border-slate-50">
                  <span>Thời gian xét duyệt:</span>
                  <span className="text-slate-850 font-bold">Duyệt nhanh trong 15 phút online</span>
                </p>
                <p className="flex justify-between pb-2 border-b border-slate-50">
                  <span>Kỳ hạn trả góp:</span>
                  <span className="text-slate-800 font-bold">Kéo dài 6 - 9 - 12 - 18 - 24 tháng</span>
                </p>
                <p className="flex justify-between pb-2 border-b border-slate-50">
                  <span>Khoản trả trước tối thiểu:</span>
                  <span className="text-slate-800 font-bold">Từ 20% đến 70% giá trị xe</span>
                </p>
                <p className="flex flex-col gap-1 pt-1 text-[11px] text-slate-400 font-medium leading-relaxed">
                  <span className="font-bold text-slate-500">Yêu cầu hồ sơ:</span>
                  Chỉ cần Căn cước công dân gắn chíp điện tử, thực hiện chụp ảnh khuôn mặt định danh trực tuyến. Không cần bảo lãnh, không cần chứng minh sao kê thu nhập phức tạp.
                </p>
              </div>
            </div>

            <button
              onClick={() => setPaymentMethod("finance")}
              className={`w-full rounded-2xl text-xs font-black uppercase text-center py-3.5 mt-6 transition-all border-2 active:scale-98 cursor-pointer ${
                paymentMethod === "finance"
                  ? "bg-slate-950 border-slate-950 text-white shadow-md"
                  : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
              }`}
            >
              {paymentMethod === "finance" ? "Đang chọn xem gói này" : "Chọn xem tính toán trả góp tài chính"}
            </button>
          </div>

        </div>
      </section>

      {/* 5. Refined Installment Calculator Widget */}
      <section aria-label="Widget tính toán trả góp" className="space-y-6">
        <div className="text-center md:text-left space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-tight">
            Công Cụ Tính Toán Trả Góp Trực Quan
          </h2>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Nhập cấu hình thanh toán bên dưới để nhận bảng phân bổ tài chính tự động chi tiết
          </p>
        </div>

        {/* Gray Box Container */}
        <div className="bg-slate-50 border border-slate-150 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Input Options Column (Left 5 Cols) */}
            <div className="lg:col-span-5 space-y-5 bg-white p-5 rounded-2xl border border-slate-150 shadow-sm">
              
              {/* Payment Method Selector Toggle */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Phương thức tính toán</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200/50">
                  <button
                    onClick={() => setPaymentMethod("card")}
                    className={`py-2 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                      paymentMethod === "card"
                        ? "bg-white text-slate-900 shadow-sm border border-slate-200/30"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Thẻ tín dụng 0%
                  </button>
                  <button
                    onClick={() => setPaymentMethod("finance")}
                    className={`py-2 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                      paymentMethod === "finance"
                        ? "bg-white text-[#E30613] shadow-sm border border-slate-200/30"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Tài chính 0.8%
                  </button>
                </div>
              </div>

              {/* Vehicle Dropdown select */}
              <div className="space-y-2">
                <label htmlFor="vehicle-price-select" className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Chọn dòng xe VinFast</label>
                <select 
                  id="vehicle-price-select"
                  value={vehiclePrice} 
                  onChange={(e) => setVehiclePrice(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#E30613] focus:bg-white font-bold text-slate-800 cursor-pointer transition-colors"
                >
                  <option value={19400000}>VinFast Evo200 (19.400.000đ)</option>
                  <option value={27000000}>VinFast Feliz S (27.000.000đ)</option>
                  <option value={35000000}>VinFast Klara S (35.000.000đ)</option>
                </select>
              </div>

              {/* Downpayment Slider Input */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <label htmlFor="downpayment-range-slider">Trả trước ({downPaymentPercent}%)</label>
                  <span className="text-slate-900 font-bold">{(calculatedLoan.downPayment).toLocaleString("vi-VN")}đ</span>
                </div>
                <input 
                  id="downpayment-range-slider"
                  type="range" 
                  min={20} 
                  max={70} 
                  step={10} 
                  value={downPaymentPercent} 
                  onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                  className="w-full accent-[#E30613] bg-slate-200 h-1.5 rounded-full cursor-pointer"
                />
                <div className="flex justify-between text-[8px] font-bold text-slate-400">
                  <span>CCCD tối thiểu (20%)</span>
                  <span>Tối đa (70%)</span>
                </div>
              </div>

              {/* Tenure Selection dropdown */}
              <div className="space-y-2">
                <label htmlFor="tenure-months-select" className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Kỳ hạn thanh toán</label>
                <select 
                  id="tenure-months-select"
                  value={tenureMonths} 
                  onChange={(e) => setTenureMonths(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#E30613] focus:bg-white font-bold text-slate-800 cursor-pointer transition-colors"
                >
                  <option value={6}>6 Tháng</option>
                  <option value={9}>9 Tháng</option>
                  <option value={12}>12 Tháng</option>
                </select>
              </div>
            </div>

            {/* Calculations Result Column (Right 7 Cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-150 p-6 shadow-sm flex flex-col justify-between min-h-[340px] space-y-6">
              
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100">
                  Báo cáo tài chính chi tiết
                </h3>

                <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 text-xs font-semibold text-slate-500">
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-slate-400">Giá trị xe ban đầu</span>
                    <span className="block text-slate-900 font-bold mt-0.5">{vehiclePrice.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-slate-400">Số tiền cần trả trước</span>
                    <span className="block text-slate-900 font-black mt-0.5">{calculatedLoan.downPayment.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-50">
                    <span className="block text-[9px] uppercase tracking-wider text-slate-400">Số tiền gốc vay ngân hàng</span>
                    <span className="block text-slate-900 font-black mt-0.5 text-sm">
                      {calculatedLoan.loanAmount.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-slate-400">Kỳ hạn vay trả</span>
                    <span className="block text-slate-900 font-bold mt-0.5">{tenureMonths} tháng</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-slate-400">Lãi suất cố định</span>
                    <span className="block text-slate-900 font-bold mt-0.5">{interestRate}% / tháng</span>
                  </div>
                </div>

                {/* Main Estimated Monthly payment box (Bold Red) */}
                <div className="bg-red-50/20 border border-red-100 rounded-xl p-4.5 flex justify-between items-center mt-4">
                  <div>
                    <span className="text-[9px] text-[#E30613] font-black uppercase tracking-wider block">Ước tính trả hàng tháng:</span>
                    <span className="text-2xl font-black text-[#E30613] block mt-1">
                      {Math.round(calculatedLoan.monthlyTotal).toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  <div className="text-right text-[8.5px] text-slate-400 font-semibold space-y-0.5">
                    <p>Tiền gốc: {Math.round(calculatedLoan.monthlyPrincipal).toLocaleString("vi-VN")}đ</p>
                    <p>Tiền lãi: {Math.round(calculatedLoan.monthlyInterest).toLocaleString("vi-VN")}đ</p>
                  </div>
                </div>
              </div>

              {/* Call-to-action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                <Link 
                  href="/dat-coc" 
                  className="flex-1 text-center rounded-xl bg-[#E30613] hover:bg-red-700 text-xs font-black uppercase tracking-wider py-3.5 transition-colors cursor-pointer text-white shadow-md active:scale-95"
                >
                  Bắt đầu đặt cọc mua xe
                </Link>
                <a 
                  href="tel:1900232389" 
                  className="flex-1 text-center rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold py-3.5 transition-colors cursor-pointer text-slate-700 border border-slate-200"
                >
                  Hotline tư vấn: 1900 2323 89
                </a>
              </div>

            </div>

          </div>
        </div>
      </section>

    </main>
  );
}
