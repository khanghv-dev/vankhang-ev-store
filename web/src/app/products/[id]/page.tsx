"use client";

import { use, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DepositWizardModal from "@/components/DepositWizardModal";
import { useAuth } from "@/context/AuthContext";

const ORDER_API = "http://localhost:5022";


interface ProductDetail {
  id: string;
  name: string;
  category: string;
  sku: string;
  price: number;
  originalPrice?: number;
  specs: string[];
  colors: { name: string; hex: string }[];
  images: { [colorName: string]: string[] };
  gifts: string[];
  description: string;
}

const PRODUCT_DATABASE: { [id: string]: ProductDetail } = {
  "vinfast-klara-s-2026": {
    id: "vinfast-klara-s-2026",
    name: "VinFast Klara S",
    category: "Xe máy điện",
    sku: "SP-KLARAS-2026",
    price: 35000000,
    originalPrice: 39900000,
    specs: ["Pin LFP", "194 km / sạc", "Tốc độ 78 km/h"],
    colors: [
      { name: "Đỏ đậm", hex: "#E30613" },
      { name: "Xanh nước biển", hex: "#0057B7" },
      { name: "Xám xi măng", hex: "#8E9296" },
      { name: "Trắng ngọc trai", hex: "#FFFFFF" },
    ],
    images: {
      "Đỏ đậm": [
        "/products/klara-s-red.png",
        "/products/klara-s-red.png",
        "/products/klara-s-red.png",
      ],
      "Xanh nước biển": [
        "/products/klara-s-blue.png",
        "/products/klara-s-blue.png",
        "/products/klara-s-blue.png",
      ],
      "Xám xi măng": [
        "/products/klara-s-grey.png",
        "/products/klara-s-grey.png",
        "/products/klara-s-grey.png",
      ],
      "Trắng ngọc trai": [
        "/products/white-scooter-side.png",
        "/products/white-scooter-front.png",
      ],
    },
    gifts: [
      "Tặng Voucher mua phụ kiện hoặc thuê pin trị giá 3.000.000 ₫.",
      "Miễn phí bảo dưỡng định kỳ 1 năm tại các Đại lý ủy quyền VinFast.",
      "Hỗ trợ mua trả góp lãi suất 0% qua thẻ tín dụng liên kết.",
      "Tặng ngay mũ bảo hiểm VinFast Premium thời trang.",
    ],
    description:
      "VinFast Klara S 2026 thế hệ mới thừa hưởng thiết kế sang trọng mang phong cách Ý, kết hợp động cơ Bosch hiệu suất cao cùng viên pin công nghệ LFP đột phá đem đến trải nghiệm di chuyển êm ái, bền bỉ và vô cùng thời thượng.",
  },
  "vinfast-impes": {
    id: "vinfast-impes",
    name: "VinFast Impes",
    category: "Xe máy điện",
    sku: "SP-IMPES-01",
    price: 12900000,
    originalPrice: 14900000,
    specs: ["Pin Lithium-ion", "70 km / sạc", "Tốc độ 50 km/h"],
    colors: [
      { name: "Đỏ thể thao", hex: "#E30613" },
      { name: "Xám không gian", hex: "#4E5154" },
      { name: "Xanh dương", hex: "#0F4C81" },
    ],
    images: {
      "Đỏ thể thao": [
        "/products/impes-red.png",
        "/products/impes-red.png",
      ],
      "Xám không gian": [
        "/products/impes-grey.png",
        "/products/impes-grey.png",
      ],
      "Xanh dương": [
        "/products/impes-blue.png",
        "/products/impes-blue.png",
      ],
    },
    gifts: [
      "Tặng Voucher sạc pin miễn phí 6 tháng tại các trạm sạc VinFast toàn quốc.",
      "Hỗ trợ dịch vụ cứu hộ khẩn cấp 24/7 trong suốt thời gian bảo hành.",
      "Bộ sạc thông minh thế hệ mới tự động ngắt điện chống chai pin.",
    ],
    description:
      "Cá tính, thể thao và gọn nhẹ - VinFast Impes là dòng xe máy điện được thiết kế đo ni đóng giày cho học sinh, sinh viên năng động, mong muốn một phương tiện di chuyển tin cậy và tiết kiệm chi phí vận hành tối đa.",
  },
  "vinfast-klara-s-premium": {
    id: "vinfast-klara-s-premium",
    name: "VinFast Klara S 2026 Premium",
    category: "Xe máy điện",
    sku: "SP-KLARAS-PREM",
    price: 36900000,
    originalPrice: 41900000,
    specs: ["Pin LFP kép", "194 km / sạc", "Màu sắc cao cấp"],
    colors: [
      { name: "Trắng bạc", hex: "#FFFFFF" },
      { name: "Đen bóng", hex: "#111111" },
      { name: "Đỏ mận", hex: "#8A1C14" },
    ],
    images: {
      "Trắng bạc": [
        "/products/white-scooter-side.png",
        "/products/white-scooter-front.png",
      ],
      "Đen bóng": [
        "/products/klara-s-grey.png",
        "/products/klara-s-grey.png",
      ],
      "Đỏ mận": [
        "/products/klara-s-red.png",
        "/products/klara-s-red.png",
      ],
    },
    gifts: [
      "Tặng Voucher VinFast E-Bike mua sắm phụ kiện trị giá 5.000.000 ₫.",
      "Tặng 1 năm bảo hiểm vật chất xe máy điện toàn diện.",
      "Tặng thiết bị định vị GPS thông minh kết nối qua ứng dụng VinFast E-Scooter.",
    ],
    description:
      "VinFast Klara S Premium mang đến định nghĩa mới về phương tiện di chuyển thông minh cao cấp. Phiên bản này được tích hợp các tính năng thông minh vượt trội cùng cấu hình pin LFP kép tối ưu hóa quãng đường di chuyển dài.",
  },
  "vinfast-evo200": {
    id: "vinfast-evo200",
    name: "VinFast Evo200",
    category: "Xe máy điện",
    sku: "SP-EVO200-01",
    price: 18000000,
    originalPrice: 22000000,
    specs: ["Pin LFP", "205 km / sạc", "Tốc độ 70 km/h"],
    colors: [
      { name: "Đỏ", hex: "#E30613" },
      { name: "Trắng", hex: "#FFFFFF" },
      { name: "Xám", hex: "#8E9296" },
    ],
    images: {
      "Đỏ": [
        "/products/feliz-s-red.png",
        "/products/feliz-s-red.png",
      ],
      "Trắng": [
        "/products/white-scooter-side.png",
        "/products/white-scooter-front.png",
      ],
      "Xám": [
        "/products/klara-s-grey.png",
        "/products/klara-s-grey.png",
      ],
    },
    gifts: [
      "Tặng Voucher sạc pin miễn phí 6 tháng tại hệ thống trạm sạc VinFast.",
      "Tặng mũ bảo hiểm VinFast cao cấp.",
    ],
    description:
      "VinFast Evo200 là mẫu xe máy điện quốc dân thế hới mới, nổi bật với thiết kế châu Âu thanh lịch và công nghệ pin LFP đột phá mang lại phạm vi di chuyển vượt trội.",
  },
  "vinfast-feliz-s": {
    id: "vinfast-feliz-s",
    name: "VinFast Feliz S",
    category: "Xe máy điện",
    sku: "SP-FELIZS-01",
    price: 27000000,
    originalPrice: 29900000,
    specs: ["Pin LFP", "198 km / sạc", "Tốc độ 80 km/h"],
    colors: [
      { name: "Đỏ", hex: "#E30613" },
      { name: "Trắng", hex: "#FFFFFF" },
      { name: "Xám", hex: "#8E9296" },
    ],
    images: {
      "Đỏ": [
        "/products/feliz-s-red.png",
        "/products/feliz-s-red.png",
      ],
      "Trắng": [
        "/products/white-scooter-side.png",
        "/products/white-scooter-front.png",
      ],
      "Xám": [
        "/products/feliz-s-grey.png",
        "/products/feliz-s-grey.png",
      ],
    },
    gifts: [
      "Hỗ trợ Voucher mua sắm trị giá 2.000.000 ₫.",
      "Miễn phí bảo dưỡng định kỳ 1 năm.",
    ],
    description:
      "VinFast Feliz S được thiết kế trẻ trung, hiện đại và vô cùng năng động, trang bị động cơ Hub-motor hiệu suất cao cùng tính năng an toàn vượt trội.",
  },
  "vinfast-vento-s": {
    id: "vinfast-vento-s",
    name: "VinFast Vento S",
    category: "Xe máy điện",
    sku: "SP-VENTOS-01",
    price: 50000000,
    originalPrice: 56000000,
    specs: ["Pin LFP", "220 km / sạc", "Tốc độ 89 km/h"],
    colors: [
      { name: "Đỏ", hex: "#E30613" },
      { name: "Trắng", hex: "#FFFFFF" },
      { name: "Xám", hex: "#8E9296" },
    ],
    images: {
      "Đỏ": ["/products/red-scooter-side.png"],
      "Trắng": ["/products/white-scooter-side.png"],
      "Xám": ["/products/theon-s.png"],
    },
    gifts: [
      "Voucher sạc pin miễn phí 12 tháng tại các trạm sạc VinFast toàn quốc.",
      "Tặng thiết bị định vị GPS thông minh kết nối thông qua ứng dụng.",
    ],
    description:
      "VinFast Vento S là dòng xe máy điện cao cấp với khả năng vận hành bứt phá tốc độ ấn tượng lên tới 89 km/h và các trang bị an toàn chuẩn châu Âu.",
  },
  "vinfast-evo-grand": {
    id: "vinfast-evo-grand",
    name: "VinFast Evo Grand",
    category: "Xe máy điện",
    sku: "SP-EVOGRAND-01",
    price: 21000000,
    originalPrice: 24500000,
    specs: ["Pin LFP", "205 km / sạc", "Thiết kế thể thao"],
    colors: [
      { name: "Trắng ngọc", hex: "#F5F5F5" },
      { name: "Xám xanh", hex: "#4E5154" },
      { name: "Đỏ thể thao", hex: "#E30613" },
    ],
    images: {
      "Trắng ngọc": ["/products/evo-grand-lite-1.jpg", "/products/evo-grand-lite-1-300x300.jpg"],
      "Xám xanh": ["/products/evo-grand-2.jpg", "/products/evo-grand-1-300x300.jpg"],
      "Đỏ thể thao": ["/products/feliz-s-red.png"],
    },
    gifts: ["Miễn phí sạc pin 6 tháng", "Tặng mũ bảo hiểm chính hãng"],
    description: "VinFast Evo Grand sở hữu diện mạo hiện đại, mạnh mẽ cùng khả năng di chuyển vượt trội.",
  },
  "vinfast-amio": {
    id: "vinfast-amio",
    name: "VinFast Amio",
    category: "Xe máy điện",
    sku: "SP-AMIO-01",
    price: 15500000,
    originalPrice: 18000000,
    specs: ["Pin Lithium", "100 km / sạc", "Nhỏ gọn linh hoạt"],
    colors: [
      { name: "Trắng", hex: "#FFFFFF" },
      { name: "Đỏ", hex: "#E30613" },
      { name: "Xám", hex: "#4E5154" },
    ],
    images: {
      "Trắng": ["/products/amio-white.webp"],
      "Đỏ": ["/products/amio-300x300.png"],
      "Xám": ["/products/amio-300x300.png"],
    },
    gifts: ["Tặng 1 năm bảo hiểm xe máy điện", "Voucher phụ kiện 1.000.000đ"],
    description: "VinFast Amio siêu gọn nhẹ dành riêng cho đô thị đông đúc, thời trang và cực kỳ tiện dụng.",
  },
  "vinfast-zgoo": {
    id: "vinfast-zgoo",
    name: "VinFast Zgoo",
    category: "Xe máy điện",
    sku: "SP-ZGOO-01",
    price: 13900000,
    originalPrice: 15900000,
    specs: ["Pin Lithium", "80 km / sạc", "Thể thao học sinh"],
    colors: [
      { name: "Xanh đen", hex: "#0F4C81" },
      { name: "Đỏ", hex: "#E30613" },
      { name: "Trắng", hex: "#FFFFFF" },
    ],
    images: {
      "Xanh đen": ["/products/zgoo-1.jpg", "/products/zgoo-1-300x300.jpg"],
      "Đỏ": ["/products/feliz-s-red.png"],
      "Trắng": ["/products/white-scooter-side.png"],
    },
    gifts: ["Bộ sạc thông minh", "Mũ bảo hiểm thời trang"],
    description: "VinFast Zgoo sở hữu phong cách thể thao cá tính thu hút mọi ánh nhìn của giới trẻ.",
  },
  "vinfast-flazz": {
    id: "vinfast-flazz",
    name: "VinFast Flazz",
    category: "Xe máy điện",
    sku: "SP-FLAZZ-01",
    price: 16500000,
    originalPrice: 19000000,
    specs: ["Pin LFP", "120 km / sạc", "Cá tính độc đáo"],
    colors: [
      { name: "Vàng đen", hex: "#D4AF37" },
      { name: "Đỏ", hex: "#E30613" },
      { name: "Trắng", hex: "#FFFFFF" },
    ],
    images: {
      "Vàng đen": ["/products/flazz-1.jpg", "/products/flazz-1-300x300.jpg"],
      "Đỏ": ["/products/feliz-s-red.png"],
      "Trắng": ["/products/white-scooter-side.png"],
    },
    gifts: ["Bảo hành 3 năm chính hãng", "Tặng Voucher sạc pin 1.500.000đ"],
    description: "VinFast Flazz đột phá thiết kế với đường nét sắc sảo, vận hành êm ái.",
  },
  "vinfast-kinet": {
    id: "vinfast-kinet",
    name: "VinFast Kinet",
    category: "Xe máy điện",
    sku: "SP-KINET-01",
    price: 17900000,
    originalPrice: 20000000,
    specs: ["Pin LFP", "150 km / sạc", "Công nghệ thông minh"],
    colors: [
      { name: "Đỏ đen", hex: "#E30613" },
      { name: "Xám bạc", hex: "#8E9296" },
      { name: "Trắng", hex: "#FFFFFF" },
    ],
    images: {
      "Đỏ đen": ["/products/kinet.jpg", "/products/kinet-3-300x300.jpg"],
      "Xám bạc": ["/products/klara-s-grey.png"],
      "Trắng": ["/products/white-scooter-side.png"],
    },
    gifts: ["Định vị GPS thông minh", "Sạc nhanh 2h"],
    description: "VinFast Kinet tích hợp kết nối ứng dụng thông minh, định vị theo dõi hành trình chuẩn xác.",
  },
  "vinfast-kyo": {
    id: "vinfast-kyo",
    name: "VinFast Kyo",
    category: "Xe máy điện",
    sku: "SP-KYO-01",
    price: 14900000,
    originalPrice: 17000000,
    specs: ["Pin Lithium", "90 km / sạc", "Trẻ trung năng động"],
    colors: [
      { name: "Trắng xanh", hex: "#E8F5E9" },
      { name: "Đỏ", hex: "#E30613" },
      { name: "Xám", hex: "#4E5154" },
    ],
    images: {
      "Trắng xanh": ["/products/kyo.jpg", "/products/kyo-6-300x300.jpg"],
      "Đỏ": ["/products/feliz-s-red.png"],
      "Xám": ["/products/klara-s-grey.png"],
    },
    gifts: ["Mũ bảo hiểm cao cấp", "Voucher phụ kiện"],
    description: "VinFast Kyo mang đến trải nghiệm lái năng động, tiết kiệm điện năng vượt trội.",
  },
  "vinfast-viper": {
    id: "vinfast-viper",
    name: "VinFast Viper",
    category: "Xe máy điện",
    sku: "SP-VIPER-01",
    price: 32000000,
    originalPrice: 36000000,
    specs: ["Pin LFP kép", "180 km / sạc", "Phân khối lớn"],
    colors: [
      { name: "Đen mờ", hex: "#111111" },
      { name: "Đỏ", hex: "#E30613" },
      { name: "Xám bạc", hex: "#8E9296" },
    ],
    images: {
      "Đen mờ": ["/products/vinfast-viper-1.jpg", "/products/vinfast-viper-1-300x300.jpg"],
      "Đỏ": ["/products/feliz-s-red.png"],
      "Xám bạc": ["/products/klara-s-grey.png"],
    },
    gifts: ["Miễn phí sạc pin 12 tháng", "Định vị chống trộm cao cấp"],
    description: "VinFast Viper phân khối lớn dành cho các tay lái yêu thích tốc độ và sức mạnh bứt phá.",
  },
};

function getMultiAngleImages(
  productImages: { [colorName: string]: string[] },
  colorName: string
): string[] {
  // 1. Ưu tiên ảnh đúng màu cụ thể của sản phẩm
  if (productImages && productImages[colorName] && productImages[colorName].length > 0) {
    return productImages[colorName];
  }

  // 2. Nếu không có ảnh cụ thể, fallback theo nhóm màu
  const colorLower = (colorName || "").toLowerCase();

  if (colorLower.includes("trắng") || colorLower.includes("white") || colorLower.includes("bạc")) {
    return ["/products/white-scooter-side.png", "/products/white-scooter-front.png"];
  }

  if (colorLower.includes("đỏ") || colorLower.includes("red") || colorLower.includes("mận")) {
    return ["/products/feliz-s-red.png", "/products/red-scooter-side.png"];
  }

  if (colorLower.includes("xanh nước") || colorLower.includes("xanh dương") || colorLower.includes("blue")) {
    return ["/products/impes-blue.png", "/products/blue-scooter-front.png"];
  }

  if (colorLower.includes("xám") || colorLower.includes("grey") || colorLower.includes("xi măng")) {
    return ["/products/klara-s-grey.png", "/products/grey-scooter-front.png"];
  }

  if (colorLower.includes("đen") || colorLower.includes("black") || colorLower.includes("mờ")) {
    return ["/products/feliz-2025-den.jpg", "/products/grey-scooter-front.png"];
  }

  if (colorLower.includes("vàng") || colorLower.includes("gold")) {
    return ["/products/feliz-2025-vang-cat-300x300.jpg", "/products/vento-s.png"];
  }

  if (colorLower.includes("xanh đen") || colorLower.includes("navy")) {
    return ["/products/impes-blue.png", "/products/klara-s-blue.png"];
  }

  // 3. Default fallback
  return ["/products/klara-s-mint.png", "/products/klara-s.png"];
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const router = useRouter();
  const { isAuthenticated, userEmail, userName } = useAuth();

  // Look up product, fallback to Klara S if id doesn't match
  const product = PRODUCT_DATABASE[id] || PRODUCT_DATABASE["vinfast-klara-s-2026"];

  // States
  const [selectedColor, setSelectedColor] = useState(product.colors[0].name);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [isDepositOpen, setIsDepositOpen] = useState(false);

  // Buy-Now modal states
  const [isBuyNowOpen, setIsBuyNowOpen] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerIdCard, setBuyerIdCard] = useState("");
  const [showrooms, setShowrooms] = useState<{ id: string; name: string }[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>("");

  // Pre-fill from localStorage / AuthContext if user is logged in
  useEffect(() => {
    const name = userName || localStorage.getItem("userName") || "";
    const phone = localStorage.getItem("userPhone") || "";
    const email = userEmail || localStorage.getItem("userEmail") || "";
    if (name) setBuyerName(name);
    if (phone) setBuyerPhone(phone);
    if (email) setBuyerEmail(email);
  }, [userName, userEmail]);

  // Helper Guid validator
  const isGuid = (val: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);

  const handleOpenDeposit = () => {
    if (!isAuthenticated) {
      alert("Vui lòng đăng nhập để tiến hành đặt cọc xe!");
      router.push(`/login?redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : `/products/${id}`)}`);
      return;
    }
    setIsDepositOpen(true);
  };

  // Fetch showrooms when modal opens
  const openBuyNow = async () => {
    if (!isAuthenticated) {
      alert("Vui lòng đăng nhập để tiến hành mua hàng!");
      router.push(`/login?redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : `/products/${id}`)}`);
      return;
    }
    setOrderError(null);
    setIsBuyNowOpen(true);

    const defaultShowrooms = [
      { id: "7ade971e-16e8-4e4e-bc75-54c7e4843062", name: "VinFast Showroom Mỹ Đình (Hà Nội)" },
      { id: "ed331c16-7732-4cf3-8ac2-3e30d7de9011", name: "VinFast Showroom Landmark 81 (TP.HCM)" },
      { id: "454ad1fd-9118-4b52-9ad2-35fc4796ab18", name: "VinFast Showroom Thảo Điền (Thủ Đức)" },
      { id: "334fb037-b6a1-49a5-9e4f-0f29e265f6e2", name: "VinFast Showroom Bình Dương" },
    ];

    try {
      const res = await fetch(`${ORDER_API}/api/admin/showrooms?pageSize=20`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}` },
      });
      if (res.ok) {
        const data = await res.json();
        const rawList = data.items || data.data || (Array.isArray(data) ? data : []);
        const list = rawList
          .map((s: any) => ({
            id: s.id || s.storeId || s.showroom_id,
            name: s.name || s.storeName || s.showroomName,
          }))
          .filter((s: any) => s.id && isGuid(s.id));

        if (list.length > 0) {
          setShowrooms(list);
          if (!selectedStore || !isGuid(selectedStore)) setSelectedStore(list[0].id);
          return;
        }
      }
    } catch {
      // Ignore
    }

    setShowrooms(defaultShowrooms);
    if (!selectedStore || !isGuid(selectedStore)) setSelectedStore(defaultShowrooms[0].id);
  };

  // Helper values - Dynamic multi-angle images per color (ưu tiên ảnh đúng màu)
  const currentImages = getMultiAngleImages(product.images, selectedColor);
  const mainImage = currentImages[activeImageIndex] || currentImages[0];

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const handleColorChange = (colorName: string) => {
    setSelectedColor(colorName);
    setActiveImageIndex(0); // Reset thumbnail to the first image when color swaps
  };

  const incrementQty = () => {
    if (quantity < 10) setQuantity(quantity + 1);
  };

  const decrementQty = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleOrder = async () => {
    // Validate
    if (!buyerName.trim() || !buyerPhone.trim() || !buyerEmail.trim()) {
      setOrderError("Vui lòng điền đầy đủ họ tên, số điện thoại và email.");
      return;
    }
    setIsOrdering(true);
    setOrderError(null);
    try {
      const validStoreId = (selectedStore && isGuid(selectedStore)) 
        ? selectedStore 
        : "7ade971e-16e8-4e4e-bc75-54c7e4843062";

      const payload = {
        customerId: "c1111111-1111-1111-1111-111111111111",
        customerName: buyerName.trim(),
        customerEmail: buyerEmail.trim(),
        customerPhone: buyerPhone.trim(),
        customerIdCard: buyerIdCard.trim() || "012345678912",
        storeId: validStoreId,
        totalAmount: product.price * quantity,
        depositAmount: Math.round(product.price * quantity * 0.1),
        depositType: 0, // LinhHoat
        batteryOption: 1, // ThuePin
        items: [
          {
            productId: "e0000000-0000-0000-0000-000000000001",
            productName: `${product.name} (${selectedColor})`,
            unitPrice: product.price,
            quantity: quantity,
          },
        ],
      };

      const res = await fetch(`${ORDER_API}/api/orders/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Lỗi ${res.status}`);
      }

      const data = await res.json();
      const orderId = data.id || data.orderId;
      setCreatedOrderId(orderId || null);
      localStorage.setItem("lastOrderPhone", buyerPhone.trim());
      localStorage.setItem("userPhone", buyerPhone.trim());

      // Gọi API VNPAY Payment để chuyển hướng thẳng sang cổng thanh toán VNPAY Sandbox
      if (orderId) {
        const payRes = await fetch(`${ORDER_API}/api/orders/${orderId}/payment`, {
          method: "POST",
        });
        if (payRes.ok) {
          const payData = await payRes.json();
          if (payData.paymentUrl) {
            window.location.href = payData.paymentUrl;
            return;
          }
        }
      }

      setIsBuyNowOpen(false);
      setOrderSuccess(true);
      setTimeout(() => setOrderSuccess(false), 8000);
    } catch (err: any) {
      setOrderError(err.message || "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <div className="bg-[var(--color-surface)] min-h-screen py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        
        {/* ── Breadcrumbs ── */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-subtle)] uppercase tracking-wider mb-8">
          <Link href="/" className="hover:text-[var(--color-primary)] transition-colors duration-200">
            Trang chủ
          </Link>
          <span>/</span>
          <span className="text-[var(--color-text-muted)]">Sản phẩm</span>
          <span>/</span>
          <span className="text-[var(--color-text-muted)]">Xe máy điện</span>
          <span>/</span>
          <span className="text-[var(--color-primary)]">{product.name}</span>
        </nav>

        {/* ── Order Alert Success Pop-up ── */}
        {orderSuccess && (
          <div className="fixed top-6 right-6 z-50 max-w-sm rounded-2xl bg-emerald-50 border border-emerald-200 p-4 shadow-2xl">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-900">🎉 Đặt hàng thành công!</h4>
                <p className="mt-1 text-xs text-emerald-700">
                  Đơn <strong>{product.name} ({selectedColor})</strong> đã được tạo.
                  {createdOrderId && (
                    <span className="block mt-1 font-mono text-[10px] text-emerald-600">
                      Mã đơn: {createdOrderId.substring(0, 8).toUpperCase()}
                    </span>
                  )}
                </p>
                <Link
                  href="/user/lich-su-dat-coc"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-700 underline hover:text-emerald-900"
                >
                  Xem lịch sử đặt hàng →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── Buy Now Modal ── */}
        {isBuyNowOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-emerald-600 px-6 py-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-white">🛒 Mua ngay</h2>
                  <p className="text-xs text-emerald-100 mt-0.5">{product.name} — {selectedColor}</p>
                </div>
                <button
                  onClick={() => setIsBuyNowOpen(false)}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Product summary */}
              <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 rounded-xl bg-white border border-emerald-100 overflow-hidden">
                  <Image src={mainImage} alt={product.name} fill className="object-contain p-1" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">{product.name}</p>
                  <p className="text-xs text-gray-500">Màu: {selectedColor} · SL: {quantity}</p>
                  <p className="text-base font-black text-emerald-700 mt-0.5">
                    {(product.price * quantity).toLocaleString("vi-VN")} đ
                  </p>
                </div>
              </div>

              {/* Form */}
              <div className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Họ và tên *</label>
                    <input
                      value={buyerName}
                      onChange={e => setBuyerName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Số điện thoại *</label>
                    <input
                      value={buyerPhone}
                      onChange={e => setBuyerPhone(e.target.value)}
                      placeholder="0901234567"
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Email *</label>
                    <input
                      value={buyerEmail}
                      onChange={e => setBuyerEmail(e.target.value)}
                      placeholder="email@gmail.com"
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">CCCD / CMND</label>
                    <input
                      value={buyerIdCard}
                      onChange={e => setBuyerIdCard(e.target.value)}
                      placeholder="012345678901"
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                  {showrooms.length > 0 && (
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Showroom nhận xe</label>
                      <select
                        value={selectedStore}
                        onChange={e => setSelectedStore(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                      >
                        {showrooms.map((s, index) => (
                          <option key={s.id ? `${s.id}-${index}` : index} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {orderError && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-semibold">
                    ⚠️ {orderError}
                  </div>
                )}

                <button
                  onClick={handleOrder}
                  disabled={isOrdering}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-extrabold py-3.5 rounded-2xl text-sm uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {isOrdering ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Đang xử lý...
                    </>
                  ) : (
                    <>💳 Thanh toán cọc qua VNPAY</>  
                  )}
                </button>
                <p className="text-center text-xs text-gray-400">Đặt cọc 10% · Thanh toán phần còn lại khi nhận xe</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Main Detail Block: 2 Columns ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* ── Left Column: Large Image & Thumbnail Selector ── */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Main Showcase Image */}
            <div className="relative aspect-[4/3] rounded-3xl bg-neutral-50/70 border border-[var(--color-border)] p-12 overflow-hidden flex items-center justify-center group shadow-sm">
              {/* Pink backdrop circle behind the scooter */}
              <div className="absolute h-80 w-80 rounded-full bg-rose-100/60 filter blur-[1px] transition-transform duration-700 group-hover:scale-110" />
              
              <div className="relative z-10 w-full h-full max-h-[360px] transition-transform duration-500 group-hover:scale-105">
                <Image
                  src={mainImage}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* Thumbnail Images Selector */}
            <div className="grid grid-cols-4 gap-4">
              {currentImages.map((imgUrl, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImageIndex(index)}
                  className={`relative aspect-[4/3] rounded-2xl bg-neutral-50 border overflow-hidden p-2 transition-all duration-300 ${
                    activeImageIndex === index
                      ? "border-[var(--color-primary)] ring-2 ring-[var(--color-brand-200)] shadow-md"
                      : "border-[var(--color-border)] hover:border-[var(--color-text-subtle)] hover:bg-neutral-100"
                  }`}
                >
                  <div className="relative w-full h-full">
                    <Image
                      src={imgUrl}
                      alt={`${product.name} thumbnail ${index + 1}`}
                      fill
                      sizes="(max-width: 768px) 25vw, (max-width: 1200px) 15vw, 10vw"
                      className="object-contain"
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Right Column: Specs, Promo Box, Colors, Qty, Checkout Button ── */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Header info */}
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary)]">
                {product.category}
              </span>
              <h1 className="mt-2 text-3xl font-black text-[var(--color-text-base)] tracking-tight">
                {product.name}
              </h1>
              <p className="mt-1 text-xs font-semibold text-[var(--color-text-subtle)] tracking-wider">
                MÃ SP: <span className="font-mono text-[var(--color-text-muted)]">{product.sku}</span>
              </p>
            </div>

            {/* Price display */}
            <div className="flex items-baseline gap-3 border-y border-[var(--color-border)] py-4">
              <span className="text-3xl font-black text-[var(--color-primary)] tracking-tight">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-md text-[var(--color-text-subtle)] line-through font-semibold">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>

            {/* Red Gift Box ("Khung quà tặng màu đỏ") */}
            <div className="border-2 border-[var(--color-primary)] bg-rose-50/50 rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
              {/* Background Accent */}
              <div className="absolute right-0 top-0 h-16 w-16 bg-[var(--color-primary)] opacity-[0.03] rounded-bl-full pointer-events-none" />
              
              <div className="flex items-center gap-2 pb-2 border-b border-rose-200">
                <svg className="h-5 w-5 text-[var(--color-primary)] shrink-0 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h17.25c.621 0 1.125-.504 1.125-1.125V9.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                </svg>
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-[var(--color-primary)]">
                  Quà tặng & Ưu đãi đặc biệt
                </h3>
              </div>
              <ul className="space-y-2">
                {product.gifts.map((gift, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs font-semibold text-[var(--color-text-base)]">
                    <span className="text-[var(--color-primary)] shrink-0 mt-0.5">🎁</span>
                    <span>{gift}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Colors Option selection */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-subtle)]">
                Chọn màu sắc: <span className="text-[var(--color-text-base)] font-extrabold">{selectedColor}</span>
              </span>
              <div className="flex gap-3">
                {product.colors.map((color) => {
                  const isActive = selectedColor === color.name;
                  return (
                    <button
                      key={color.name}
                      onClick={() => handleColorChange(color.name)}
                      className={`h-9 w-9 rounded-full relative flex items-center justify-center shadow-inner transition-all duration-300 ${
                        isActive
                          ? "ring-2 ring-offset-2 ring-[var(--color-primary)] scale-110 shadow-md"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {/* White color gets a subtle border for visualization */}
                      {color.hex === "#FFFFFF" && (
                        <div className="absolute inset-0 rounded-full border border-neutral-300 pointer-events-none" />
                      )}
                      {isActive && (
                        <svg
                          className={`h-4 w-4 ${color.hex === "#FFFFFF" ? "text-neutral-900" : "text-white"}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Selector input */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-subtle)]">
                Số lượng:
              </span>
              <div className="flex items-center w-36 border border-[var(--color-border)] rounded-full overflow-hidden bg-white shadow-sm">
                <button
                  type="button"
                  onClick={decrementQty}
                  disabled={quantity <= 1}
                  className="w-12 h-10 flex items-center justify-center font-bold text-lg text-[var(--color-text-muted)] hover:bg-neutral-100 hover:text-[var(--color-text-base)] disabled:opacity-40 disabled:hover:bg-transparent transition-colors duration-150"
                >
                  −
                </button>
                <span className="flex-1 text-center text-sm font-bold text-[var(--color-text-base)] select-none">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={incrementQty}
                  disabled={quantity >= 10}
                  className="w-12 h-10 flex items-center justify-center font-bold text-lg text-[var(--color-text-muted)] hover:bg-neutral-100 hover:text-[var(--color-text-base)] disabled:opacity-40 disabled:hover:bg-transparent transition-colors duration-150"
                >
                  +
                </button>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              <button
                onClick={handleOpenDeposit}
                className="w-full bg-[#E30613] hover:bg-[#b8040d] text-white font-extrabold py-4 px-6 rounded-2xl shadow-lg hover:shadow-rose-100 hover:shadow-2xl transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center gap-2 text-md uppercase tracking-wider"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                </svg>
                Đặt cọc ngay
              </button>

              <button
                onClick={openBuyNow}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-4 px-6 rounded-2xl shadow-lg hover:shadow-emerald-200/50 hover:shadow-2xl transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center gap-2 text-md uppercase tracking-wider"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
                Mua ngay
              </button>
            </div>

            {/* Description / Info */}
            <div className="pt-6 border-t border-[var(--color-border)]">
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-subtle)]">
                Mô tả chi tiết:
              </span>
              <p className="mt-2 text-sm text-[var(--color-text-muted)] leading-relaxed">
                {product.description}
              </p>
            </div>

          </div>

        </div>

      </div>

      <DepositWizardModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        product={{
          id: product.id,
          name: product.name,
          price: product.price
        }}
        selectedColor={selectedColor}
      />
    </div>
  );
}
