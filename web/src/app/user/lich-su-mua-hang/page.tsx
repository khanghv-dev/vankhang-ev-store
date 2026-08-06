"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import Link from "next/link";

interface OwnedVehicle {
  vehicleId: string;
  name: string;
  category: string;
  image: string;
  price: string;
  vinNumber: string;
  engineNumber: string;
  deliveryDate: string;
  showroomName: string;
  batteryPlan: string;
  invoiceUrl: string;
}

const mockVehicles: OwnedVehicle[] = [
  {
    vehicleId: "KL-2025",
    name: "VinFast Klara S",
    category: "Xe máy điện thông minh",
    image: "/products/klara-s.png",
    price: "35.000.000 đ",
    vinNumber: "VNKLARAS202511045123",
    engineNumber: "M-KLARAS-99881122",
    deliveryDate: "04/12/2025",
    showroomName: "VinFast Showroom Ocean Park (Gia Lâm, Hà Nội)",
    batteryPlan: "Thuê pin (S/N: BTY-LFP-88990011)",
    invoiceUrl: "/mock-vat-invoice.pdf",
  },
  {
    vehicleId: "IM-2025",
    name: "VinFast Impes",
    category: "Xe máy điện học sinh/thể thao",
    image: "/products/impes.png",
    price: "14.900.000 đ",
    vinNumber: "VNIMPES202509121908",
    engineNumber: "M-IMPES-55443322",
    deliveryDate: "12/10/2025",
    showroomName: "VinFast Showroom Lê Văn Việt (Quận 9, TP. HCM)",
    batteryPlan: "Mua đứt (S/N: BTY-IMPES-112233)",
    invoiceUrl: "/mock-vat-invoice.pdf",
  },
];

export default function PurchaseHistoryPage() {
  const router = useRouter();
  const { isAuthenticated, userEmail } = useAuth();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<OwnedVehicle[]>([]);

  useEffect(() => {
    async function fetchVehicles() {
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
          if (Array.isArray(data)) {
            const delivered = data
              .filter((item: any) => item.status === "Delivered" || item.status === "Ready")
              .map((item: any) => {
                const rawId = typeof item.id === "string" ? item.id : item.id?.value ? String(item.id.value) : String(item.id || "");
                return {
                  vehicleId: rawId ? rawId.substring(0, 8).toUpperCase() : "VEH-2026",
                  name: item.items?.[0]?.productName || "Xe VinFast",
                  category: "Xe điện VinFast chính hãng",
                  image: "/products/vf8.png",
                  price: `${(item.totalAmount || 0).toLocaleString("vi-VN")} đ`,
                  vinNumber: item.items?.[0]?.assignedVin || "Đang cấp mã VIN",
                  engineNumber: rawId ? `ENG-${rawId.substring(0, 6).toUpperCase()}` : "ENG-202600",
                  deliveryDate: item.paidAt ? new Date(item.paidAt).toLocaleDateString("vi-VN") : "Đã nhận xe",
                  showroomName: "VinFast Showroom Smart City",
                  batteryPlan: item.batteryOption === 1 ? "Thuê pin LFP" : "Mua đứt pin",
                  invoiceUrl: "#"
                };
              });
            setVehicles(delivered);
          }
        }
      } catch (error) {
        console.error("Lỗi khi tải lịch sử mua hàng từ backend:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchVehicles();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-neutral-50 gap-4">
        <svg className="animate-spin h-10 w-10 text-[#E30613]" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <span className="text-sm font-semibold text-neutral-500">Đang tải lịch sử mua hàng...</span>
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
          <span className="text-neutral-700">Lịch sử mua hàng</span>
        </div>

        {/* Page Header */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#E30613] to-red-800"></div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 font-sans">Lịch sử mua hàng</h1>
            <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider mt-0.5">Danh sách các xe máy điện VinFast chính thức sở hữu của bạn</p>
          </div>
          <div className="bg-neutral-50 rounded-xl px-4 py-2 border border-neutral-100 text-neutral-500 text-xs font-bold text-center shrink-0 self-start sm:self-auto">
            Số xe sở hữu: <span className="text-[#E30613] font-black">{vehicles.length}</span>
          </div>
        </div>

        {/* Owned Vehicles Grid */}
        {vehicles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {vehicles.map((vehicle) => (
            <div 
              key={vehicle.vehicleId}
              className="bg-white rounded-3xl border border-neutral-150 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group"
            >
              {/* Vehicle Image Visual Section */}
              <div className="relative flex items-center justify-center h-52 bg-neutral-50 border-b border-neutral-100 overflow-hidden shrink-0">
                {/* Visual Circle Backing */}
                <div className="absolute h-36 w-36 rounded-full bg-rose-50/70 border border-rose-100/30 filter blur-[0.5px] transition-transform duration-500 group-hover:scale-110"></div>
                <div className="relative w-40 h-40 transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-1">
                  <Image 
                    src={vehicle.image} 
                    alt={vehicle.name} 
                    fill 
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <span className="absolute top-4 left-4 inline-flex items-center rounded-full bg-neutral-950/10 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-black text-neutral-600 uppercase">
                  {vehicle.category}
                </span>
              </div>

              {/* Vehicle Metadata Specification */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-start gap-2">
                    <h2 className="text-lg font-black text-neutral-900">{vehicle.name}</h2>
                    <span className="text-xs font-black text-[#E30613] whitespace-nowrap bg-red-50 px-2 py-0.5 rounded">{vehicle.price}</span>
                  </div>
                  <p className="text-[10px] font-bold text-neutral-450 uppercase tracking-widest">Mã định danh xe: #{vehicle.vehicleId}</p>
                </div>

                <div className="space-y-2 text-xs font-semibold text-neutral-500 text-left border-y border-neutral-100 py-3">
                  <div className="flex justify-between py-0.5">
                    <span>Mã định danh số VIN:</span>
                    <span className="font-mono font-bold text-neutral-800">{vehicle.vinNumber}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span>Số máy định danh:</span>
                    <span className="font-mono font-bold text-neutral-850">{vehicle.engineNumber}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span>Phương án pin:</span>
                    <span className="font-bold text-neutral-800">{vehicle.batteryPlan}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span>Ngày nhận bàn giao:</span>
                    <span className="font-bold text-neutral-800">{vehicle.deliveryDate}</span>
                  </div>
                  <div className="flex justify-between py-0.5 gap-2">
                    <span className="shrink-0">Showroom giao xe:</span>
                    <span className="font-bold text-neutral-800 text-right leading-tight max-w-[170px] truncate-3-lines">{vehicle.showroomName}</span>
                  </div>
                </div>

                {/* VAT Invoice download button */}
                <a 
                  href={vehicle.invoiceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 hover:border-[#E30613] hover:bg-[#E30613]/5 active:scale-[0.98] transition-all text-xs font-black tracking-wider uppercase text-neutral-700 hover:text-[#E30613] py-3 cursor-pointer shadow-sm"
                >
                  📄 Xem hóa đơn GTGT (VAT)
                </a>
              </div>
            </div>
          ))}
        </div>
        ) : (
          <div className="bg-white rounded-3xl border border-neutral-100 p-12 text-center space-y-4 shadow-sm">
            <div className="text-4xl">🚗</div>
            <h3 className="text-lg font-bold text-neutral-800">Bạn chưa sở hữu xe VinFast nào</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Các xe sau khi hoàn tất quy trình đặt cọc và bàn giao sẽ được hiển thị đầy đủ tại đây.
            </p>
            <Link 
              href="/"
              className="inline-block bg-[#E30613] hover:bg-red-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-colors shadow-md"
            >
              Khám phá các dòng xe VinFast
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
