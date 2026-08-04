"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { API_CONFIG } from "@/config/apiConfig";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ_LIST: FAQItem[] = [
  {
    question: "Làm thế nào để kích hoạt bảo hành điện tử?",
    answer: "Quý khách có thể kích hoạt bảo hành điện tử trực tiếp trên ứng dụng VinFast bằng cách đăng nhập tài khoản mua xe, quét mã VIN của xe và xác nhận thông tin chủ sở hữu. Thời hạn bảo hành sẽ được tính từ ngày kích hoạt thành công.",
    category: "Bảo hành",
  },
  {
    question: "Chính sách phạt khi làm mất pin thuê như thế nào?",
    answer: "Trong trường hợp làm mất pin thuê, Quý khách cần bồi hoàn chi phí đặt cọc pin ban đầu tùy thuộc vào dòng xe (từ 10.000.000đ đến 20.000.000đ) và hoàn tất thủ tục khai báo mất pin tại showroom VinFast gần nhất để dừng tính phí thuê pin hàng tháng.",
    category: "Pin & Trạm Sạc",
  },
  {
    question: "Quy trình đổi trả xe máy điện VinFast trong vòng 7 ngày",
    answer: "Quý khách được hỗ trợ đổi trả xe trong vòng 7 ngày kể từ lúc nhận xe nếu phát hiện lỗi kỹ thuật từ nhà sản xuất không thể khắc phục được. Xe đổi trả phải đảm bảo không bị móp méo, trầy xước và đầy đủ giấy tờ bàn giao gốc.",
    category: "Sử dụng Xe",
  },
  {
    question: "Làm thế nào để liên hệ cứu hộ khi xe hết điện giữa đường?",
    answer: "Hãy gọi ngay cho Tổng đài Cứu hộ VinFast 24/7 qua số Hotline 1900 2323 89. Đội cứu hộ lưu động trang bị sạc nhanh sẽ có mặt trong vòng 30 - 45 phút tùy khu vực để hỗ trợ sạc khẩn cấp hoặc kéo xe về trạm sạc gần nhất.",
    category: "Sử dụng Xe",
  },
  {
    question: "Thủ tục mua xe máy điện trả góp qua thẻ tín dụng cần những gì?",
    answer: "Để mua trả góp qua thẻ tín dụng với lãi suất 0%, Quý khách chỉ cần có thẻ tín dụng hạn mức lớn hơn giá trị xe của các ngân hàng liên kết tại Việt Nam. Khi đặt hàng online, Quý khách chọn thanh toán trả góp bằng thẻ tín dụng và chọn kỳ hạn phù hợp (3, 6, 9, 12 tháng) mà không cần chứng minh thu nhập.",
    category: "Trả góp",
  },
  {
    question: "Địa điểm đổi pin của VinFast nằm ở những vị trí nào?",
    answer: "VinFast thiết lập mạng lưới trạm đổi pin tại các Showroom, Đại lý ủy quyền, Cửa hàng tiện lợi, Cây xăng PVOil và các Trung tâm thương mại lớn trên toàn quốc. Quý khách có thể tra cứu danh sách trạm đổi pin trực tiếp trên bản đồ của ứng dụng VinFast.",
    category: "Pin & Trạm Sạc",
  },
  {
    question: "Thời gian sạc đầy pin LFP thế hệ mới là bao lâu?",
    answer: "Pin công nghệ LFP mới của VinFast (trên các dòng Evo200, Feliz S, Klara S 2026) sạc đầy từ 0% đến 100% mất trung bình từ 4 - 6 giờ với bộ sạc tiêu chuẩn 1000W tại nhà, hoặc chỉ khoảng 1 - 2 giờ tại trạm sạc nhanh công cộng.",
    category: "Pin & Trạm Sạc",
  },
  {
    question: "Bảo dưỡng định kỳ xe máy điện bao lâu một lần?",
    answer: "Lịch bảo dưỡng định kỳ khuyến nghị cho xe máy điện VinFast là sau mỗi 5.000 km hoặc sau 6 tháng sử dụng (tùy điều kiện nào đến trước) nhằm đảm bảo hoạt động an toàn của hệ thống phanh, động cơ, phuộc nhún và chất lượng pin.",
    category: "Bảo hành",
  }
];

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeAccordion, setActiveAccordion] = useState<number | null>(null);
  const [faqs, setFaqs] = useState<FAQItem[]>(FAQ_LIST);

  // Fetch FAQs dynamically from Backend API on mount
  useEffect(() => {
    const loadFaqs = async () => {
      try {
        const response = await fetch(`${API_CONFIG.ORDER_URL}/api/faqs`, { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          if (data && Array.isArray(data) && data.length > 0) {
            setFaqs(data.map((item: any) => ({
              question: item.question,
              answer: item.answer,
              category: item.category
            })));
          }
        }
      } catch (err) {
        console.error("Lỗi khi kết nối API FAQs, sử dụng dữ liệu tĩnh dự phòng:", err);
      }
    };
    loadFaqs();
  }, []);

  // Filter FAQs based on search
  const filteredFAQs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [
    {
      title: "Sử dụng Xe",
      desc: "Hướng dẫn vận hành, kết nối Smart App và sạc pin an toàn tại nhà.",
      icon: (
        <svg className="h-7 w-7 text-[#E30613]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5m-3-12h13.5m-13.5 6h13.5m-13.5 6h13.5" />
        </svg>
      ),
      count: "12 bài viết",
      href: "/ho-tro/su-dung-xe"
    },
    {
      title: "Pin & Trạm Sạc",
      desc: "Tìm kiếm bản đồ trạm sạc, bảng giá cọc sạc và quy định thuê pin mới.",
      icon: (
        <svg className="h-7 w-7 text-[#E30613]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5 10.5 2.25 12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      ),
      count: "8 bài viết",
      href: "/ho-tro/pin-tram-sac"
    },
    {
      title: "Bảo hành",
      desc: "Thông tin kích hoạt bảo hành điện tử, chính sách sửa chữa lưu động.",
      icon: (
        <svg className="h-7 w-7 text-[#E30613]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
        </svg>
      ),
      count: "15 bài viết",
      href: "/ho-tro/bao-hanh"
    },
    {
      title: "Trả góp",
      desc: "Tìm hiểu thủ tục làm hồ sơ trả góp 0%, ưu đãi thẻ tín dụng đối tác.",
      icon: (
        <svg className="h-7 w-7 text-[#E30613]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-19.5 8.25h15c.621 0 1.125-.504 1.125-1.125V8.25M2.25 5.25h19.5A2.25 2.25 0 0 1 24 7.5v9a2.25 2.25 0 0 1-2.25 2.25H2.25A2.25 2.25 0 0 1 0 16.5v-9a2.25 2.25 0 0 1 2.25-2.25z" />
        </svg>
      ),
      count: "6 bài viết",
      href: "/ho-tro/tra-gop"
    }
  ];

  const toggleAccordion = (idx: number) => {
    setActiveAccordion((prev) => (prev === idx ? null : idx));
  };

  return (
    <div className="flex-1 bg-neutral-50/50 pb-20">
      {/* ── 1. Hero Search Section ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/50 to-white/10 py-16 sm:py-24 border-b border-gray-100">
        {/* Background ambient red glow */}
        <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-[#E30613] opacity-[0.03] blur-3xl" />
        <div className="pointer-events-none absolute -right-40 -bottom-40 h-96 w-96 rounded-full bg-[#E30613] opacity-[0.03] blur-3xl" />
        
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#E30613]">
            Trung tâm hỗ trợ khách hàng
          </span>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-gray-900 sm:text-5xl">
            Chúng tôi có thể giúp gì cho bạn?
          </h1>
          <p className="mt-4 text-base text-gray-500 max-w-xl mx-auto leading-relaxed">
            Tra cứu nhanh các thông tin bảo hành xe máy điện, biểu phí trạm sạc, thủ tục đổi trả hoặc chính sách thuê pin 24/7.
          </p>

          {/* Large Search Input */}
          <div className="mt-8 max-w-2xl mx-auto relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4.5 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400 group-focus-within:text-[#E30613] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Nhập từ khóa tìm kiếm câu hỏi (ví dụ: kích hoạt bảo hành, cứu hộ, thuê pin...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 focus:border-[#E30613] focus:ring-4 focus:ring-red-100/50 rounded-full pl-12 pr-6 py-4.5 text-sm outline-none shadow-sm transition-all placeholder:text-gray-400 font-medium text-gray-800"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-700 text-xs font-bold uppercase tracking-wider"
              >
                Xóa
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* ── 2. Category Grid ── */}
        <section className="mt-16">
          <div className="mb-8 text-center sm:text-left">
            <h2 className="text-xl font-black tracking-tight text-gray-900 uppercase">
              Danh mục hỗ trợ
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Chọn chủ đề bạn đang cần được giải đáp
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat, idx) => (
              <Link
                key={idx}
                href={cat.href}
                className="group flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-6.5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-[#E30613] mb-5 group-hover:bg-[#E30613] group-hover:text-white transition-colors duration-300">
                    {cat.icon}
                  </div>
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-[#E30613] transition-colors duration-200">
                    {cat.title}
                  </h3>
                  <p className="mt-2 text-xs text-gray-400 font-medium leading-relaxed">
                    {cat.desc}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider group-hover:text-[#E30613] transition-colors">
                  <span>{cat.count}</span>
                  <svg className="h-4 w-4 transform translate-x-0 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── 3. Top FAQs ── */}
        <section className="mt-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Sidebar FAQ banner info */}
            <div className="lg:col-span-1 space-y-6">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#E30613]">
                  Hỗ trợ nhanh
                </span>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-gray-900 uppercase">
                  Câu hỏi thường gặp
                </h2>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                  Các thắc mắc phổ biến nhất được khách hàng VinFast tìm kiếm hàng ngày để giải quyết sự cố tức thì.
                </p>
              </div>

              {/* Call Center Support Card */}
              <div className="rounded-2xl border border-red-100 bg-red-50/30 p-6 space-y-4">
                <h4 className="text-sm font-bold text-gray-900">Không tìm thấy câu trả lời?</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Chúng tôi luôn trực tổng đài 24/7 để hỗ trợ bạn kịp thời khi gặp các sự cố kỹ thuật hoặc cần cứu hộ khẩn cấp dọc đường.
                </p>
                <div className="flex flex-col gap-2 pt-2">
                  <a
                    href="tel:1900232389"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E30613] px-5 py-3 text-xs font-black text-white hover:bg-[#b8040d] transition duration-200 shadow-md shadow-red-200"
                  >
                    Hỗ trợ Hotline: 1900 2323 89
                  </a>
                  <Link
                    href="/showroom"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 transition duration-200"
                  >
                    Tìm showroom gần nhất
                  </Link>
                </div>
              </div>
            </div>

            {/* Accordion FAQ List */}
            <div className="lg:col-span-2 space-y-4">
              {filteredFAQs.length > 0 ? (
                filteredFAQs.slice(0, 6).map((faq, idx) => {
                  const isOpened = activeAccordion === idx;
                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-gray-100 bg-white overflow-hidden transition-all duration-300"
                    >
                      <button
                        onClick={() => toggleAccordion(idx)}
                        className="w-full flex items-center justify-between text-left p-5 text-sm font-bold text-gray-800 hover:text-[#E30613] transition-colors focus:outline-none"
                      >
                        <span className="pr-4 leading-normal flex items-start gap-3">
                          <span className="text-xs font-extrabold text-[#E30613] bg-red-50 px-2 py-0.5 rounded-md mt-0.5 shrink-0 uppercase">
                            {faq.category}
                          </span>
                          <span>{faq.question}</span>
                        </span>
                        <svg
                          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-300 ${
                            isOpened ? "rotate-180 text-[#E30613]" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>
                      <div
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${
                          isOpened ? "max-h-[300px] border-t border-gray-50 bg-gray-50/30" : "max-h-0"
                        }`}
                      >
                        <p className="p-5 text-xs text-gray-500 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 border border-dashed border-gray-200 rounded-2xl bg-white space-y-3">
                  <div className="h-10 w-10 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center mx-auto">
                    ✕
                  </div>
                  <h4 className="text-sm font-bold text-gray-800">Không tìm thấy kết quả phù hợp</h4>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    Vui lòng đổi từ khóa tìm kiếm khác (ví dụ: bảo hành, pin, trả góp, showroom...)
                  </p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-xs font-bold text-[#E30613] hover:underline pt-1"
                  >
                    Xem tất cả câu hỏi
                  </button>
                </div>
              )}
            </div>

          </div>
        </section>
      </div>
    </div>
  );
}
