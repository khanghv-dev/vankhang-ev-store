"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "../../../../context/AdminAuthContext";
import { API_CONFIG } from "@/config/apiConfig";

interface ColorVariant {
  name: string;
  hex: string;
  initialStock: number;
}

interface ProductItem {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  isActive: boolean;
  image?: string;
  specs?: string[];
  discountText?: string;
}

interface ImportResult {
  totalRows: number;
  successCount: number;
  failureCount: number;
  errors: string[];
}

const DEFAULT_COLOR_VARIANTS: ColorVariant[] = [
  { name: "Đỏ Candy", hex: "#E30613", initialStock: 10 },
  { name: "Trắng Ngọc Trai", hex: "#FFFFFF", initialStock: 15 },
  { name: "Xám Xi Măng", hex: "#8E9296", initialStock: 8 },
];

/// <summary>
/// Premium Admin Products Catalog page.
/// Provides product listing table, dynamic filters/search,
/// and "Thêm sản phẩm mới" overlay modal with direct API linkage and 4-tab form splitting.
/// </summary>
export default function AdminProductsPage() {
  const { adminUser, logoutAdmin, adminToken } = useAdminAuth();
  const router = useRouter();

  // Search & Filter state
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchName, setSearchName] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterActive, setFilterActive] = useState<string>("all"); // "all", "true", "false"
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState("");

  // Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "colors" | "specs" | "images">("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalError, setModalError] = useState("");

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSku, setEditSku] = useState("");
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editOriginalPrice, setEditOriginalPrice] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editDiscountText, setEditDiscountText] = useState("");

  // Color variants state
  const [colorVariants, setColorVariants] = useState<ColorVariant[]>(DEFAULT_COLOR_VARIANTS);

  const handleAddVariant = () => {
    setColorVariants((prev) => [
      ...prev,
      { name: "Màu mới", hex: "#3b82f6", initialStock: 10 },
    ]);
  };

  const handleUpdateVariant = (index: number, key: keyof ColorVariant, value: string | number) => {
    setColorVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [key]: value } : v))
    );
  };

  const handleDeleteVariant = (index: number) => {
    setColorVariants((prev) => prev.filter((_, i) => i !== index));
  };

  // Import Modal States
  const [showImportModal, setShowImportModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [dragActiveImport, setDragActiveImport] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState("");

  const handleDragImport = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveImport(true);
    } else if (e.type === "dragleave") {
      setDragActiveImport(false);
    }
  };

  const handleDropImport = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveImport(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetImportFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChangeImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetImportFile(e.target.files[0]);
    }
  };

  const validateAndSetImportFile = (file: File) => {
    setImportError("");
    setImportResult(null);

    if (file.size > 5 * 1024 * 1024) {
      setImportError("Kích thước file Excel vượt quá giới hạn 5MB.");
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "xlsx" && ext !== "xls") {
      setImportError("Định dạng file không hỗ trợ. Vui lòng chọn file .xlsx hoặc .xls");
      return;
    }

    setImportFile(file);
  };

  const handleUploadExcel = async () => {
    if (!importFile) return;

    setIsImporting(true);
    setImportError("");
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", importFile);

      const response = await fetch(`${API_CONFIG.INVENTORY_URL}/api/admin/products/import-excel`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${adminToken}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setImportResult(data);
        if (data.successCount > 0) {
          fetchProducts();
        }
      } else {
        const errorData = await response.json();
        setImportError(errorData.message || "Nhập file Excel thất bại.");
      }
    } catch (err) {
      console.error("Lỗi khi nhập Excel:", err);
      setImportError("Lỗi kết nối tới máy chủ.");
    } finally {
      setIsImporting(false);
    }
  };

  // Upload States
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  // Form State for new motorcycle
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Xe điện");
  const [isActiveProduct, setIsActiveProduct] = useState(true);

  // Specifications (Tab 2)
  const [dimensions, setDimensions] = useState("1800 x 700 x 1100 mm");
  const [batteryType, setBatteryType] = useState("Pin LFP");
  const [enginePower, setEnginePower] = useState("1500W");
  const [maxSpeed, setMaxSpeed] = useState("70 km/h");
  const [rangePerCharge, setRangePerCharge] = useState("150 km");

  // Fetch product list function
  const fetchProducts = useCallback(async () => {
    setIsProductsLoading(true);
    setProductsError("");
    try {
      const activeParam = filterActive === "all" ? "" : `&isActive=${filterActive === "true"}`;
      const nameParam = searchName ? `&name=${encodeURIComponent(searchName)}` : "";
      const categoryParam = filterCategory ? `&category=${encodeURIComponent(filterCategory)}` : "";

      const response = await fetch(
        `${API_CONFIG.INVENTORY_URL}/api/admin/products?pageNumber=${page}&pageSize=${pageSize}${nameParam}${categoryParam}${activeParam}`,
        {
          headers: {
            "Authorization": `Bearer ${adminToken || ""}`,
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setProducts(data.items || []);
        setTotalProducts(data.totalCount || 0);
      } else {
        setProductsError("Không thể tải danh sách sản phẩm.");
      }
    } catch (err) {
      console.error("Lỗi khi tải sản phẩm:", err);
      setProductsError("Lỗi kết nối tới Inventory API.");
    } finally {
      setIsProductsLoading(false);
    }
  }, [page, searchName, filterCategory, filterActive, adminToken]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDeleteProduct = async (sku: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm ${sku}?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.INVENTORY_URL}/api/admin/products/${sku}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${adminToken || ""}`
        }
      });

      if (response.ok) {
        alert("Xóa sản phẩm thành công!");
        fetchProducts();
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Xóa sản phẩm thất bại.");
      }
    } catch (err) {
      console.error("Lỗi khi xóa sản phẩm:", err);
      alert("Lỗi kết nối tới máy chủ.");
    }
  };

  const handleOpenEditModal = (product: ProductItem) => {
    setEditSku(product.id);
    setEditName(product.name);
    setEditPrice(product.price.toString());
    setEditOriginalPrice(product.originalPrice ? product.originalPrice.toString() : "");
    setEditImageUrl(product.image || "");
    setEditDiscountText(product.discountText || "Giảm 11%");
    setModalError("");
    setModalMessage("");
    setShowEditModal(true);
  };

  const handleEditProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalMessage("");
    setModalError("");

    if (!editName.trim()) {
      setModalError("Tên xe không được để trống.");
      return;
    }
    const priceNum = parseFloat(editPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setModalError("Giá bán phải là số lớn hơn hoặc bằng 0.");
      return;
    }
    const origPriceNum = editOriginalPrice ? parseFloat(editOriginalPrice) : null;
    if (origPriceNum !== null && (isNaN(origPriceNum) || origPriceNum < priceNum)) {
      setModalError("Giá gốc phải là số lớn hơn hoặc bằng giá bán.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: editName.trim(),
        price: priceNum,
        originalPrice: origPriceNum,
        image: editImageUrl.trim(),
        discountText: editDiscountText.trim() || "Giảm 11%"
      };

      const response = await fetch(`${API_CONFIG.INVENTORY_URL}/api/admin/products/${editSku}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setModalMessage("Cập nhật sản phẩm thành công!");
        fetchProducts();
        setTimeout(() => {
          setShowEditModal(false);
          setModalMessage("");
        }, 1500);
      } else {
        const errorData = await response.json();
        setModalError(errorData.message || "Đã xảy ra lỗi khi cập nhật sản phẩm.");
      }
    } catch (err) {
      console.error("Lỗi khi cập nhật sản phẩm:", err);
      setModalError("Lỗi kết nối tới máy chủ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Search Input Change / Enter Key
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setSearchName(searchQuery);
      setPage(1);
    }
  };

  const handleSearchClick = () => {
    setSearchName(searchQuery);
    setPage(1);
  };

  // Drag-and-drop Events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleUploadFile(e.target.files[0]);
    }
  };

  // Upload Logic communicating with our S3/MinIO service
  const handleUploadFile = async (file: File) => {
    // Size check: 5MB
    if (file.size > 5 * 1024 * 1024) {
      setModalError("Kích thước file ảnh vượt quá giới hạn 5MB.");
      return;
    }

    // MIME check
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setModalError("Định dạng file không hỗ trợ. Cho phép: JPG, JPEG, PNG, WEBP, GIF.");
      return;
    }

    setIsUploading(true);
    setModalError("");
    setModalMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_CONFIG.INVENTORY_URL}/api/admin/products/upload-image`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${adminToken}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        const uploadedUrl = data.url;
        if (showEditModal) {
          setEditImageUrl(uploadedUrl);
        } else {
          setImageUrl(uploadedUrl); // Auto set uploaded URL as primary
          setUploadedImages((prev) => [...prev, uploadedUrl]);
        }
        setModalMessage("Tải file ảnh lên MinIO thành công!");
      } else {
        const errorData = await response.json();
        setModalError(errorData.message || "Tải ảnh lên thất bại.");
      }
    } catch (err) {
      console.error("Lỗi khi tải ảnh lên:", err);
      setModalError("Lỗi kết nối tới máy chủ.");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Product Creation Submission
  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalMessage("");
    setModalError("");

    // Basic validation check
    if (!sku.trim()) {
      setModalError("Mã SKU không được để trống.");
      setActiveTab("basic");
      return;
    }
    if (!name.trim()) {
      setModalError("Tên xe không được để trống.");
      setActiveTab("basic");
      return;
    }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      setModalError("Giá bán phải là số lớn hơn hoặc bằng 0.");
      setActiveTab("basic");
      return;
    }

    setIsSubmitting(true);

    try {
      const commandPayload = {
        sku: sku.trim().toLowerCase(),
        name: name.trim(),
        price: priceNum,
        imageUrl: imageUrl.trim() || (uploadedImages.length > 0 ? uploadedImages[0] : "https://images.unsplash.com/photo-1615887023516-9b6bcd559e87?w=300"),
        description: description.trim() || "Mô tả sản phẩm xe máy điện VinFast.",
        dimensions: dimensions.trim(),
        batteryType: batteryType.trim(),
        enginePower: enginePower.trim(),
        maxSpeed: maxSpeed.trim(),
        rangePerCharge: rangePerCharge.trim(),
        colors: colorVariants.map(v => ({ name: v.name, hex: v.hex, initialStock: v.initialStock }))
      };

      const response = await fetch(`${API_CONFIG.INVENTORY_URL}/api/admin/products/electric`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`
        },
        body: JSON.stringify(commandPayload)
      });

      if (response.ok) {
        setModalMessage("Thêm mới xe máy điện thành công!");
        // Reset states
        setSku("");
        setName("");
        setPrice("");
        setOriginalPrice("");
        setImageUrl("");
        setDescription("");
        setUploadedImages([]);
        setColorVariants(DEFAULT_COLOR_VARIANTS);
        
        // Refresh grid
        fetchProducts();
        
        // Auto close modal
        setTimeout(() => {
          setShowCreateModal(false);
          setModalMessage("");
        }, 1500);
      } else {
        const errorData = await response.json();
        setModalError(errorData.message || "Đã xảy ra lỗi khi tạo sản phẩm.");
      }
    } catch (err) {
      console.error("Lỗi khi thêm xe máy điện:", err);
      setModalError("Lỗi kết nối tới máy chủ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logoutAdmin();
    router.push("/admin/login");
  };

  if (!adminUser) return null;

  return (
    <div className="min-h-screen bg-[#F5F7FB] font-sans text-[#374151] p-4 sm:p-8 select-none">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation / Header Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.04)] relative overflow-hidden gap-4">
          <div className="relative">
            <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Hệ Thống Quản Trị O2O</h1>
            <p className="text-xs text-[#6B7280] mt-1">
              Phân hệ: <span className="font-semibold text-[#E11D2E]">Quản lý Sản phẩm</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin")}
              className="px-4 py-2 bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#374151] rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 shadow-sm"
            >
              📊 Tổng quan Dashboard
            </button>
            <button
              onClick={() => router.push("/admin/inventory")}
              className="px-4 py-2 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 font-bold shadow-sm"
            >
              ⚙️ Kho Phụ tùng
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-50 border border-red-200 hover:bg-red-100 text-[#EF4444] rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 shadow-sm"
            >
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Catalog List Container */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.04)] relative overflow-hidden">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-[#111827] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E11D2E] animate-pulse"></span>
                Danh Sách Sản Phẩm Xe VinFast
              </h2>
              <p className="text-xs text-[#6B7280] mt-1">
                Lọc, tìm kiếm và tạo các dòng xe máy điện, ô tô điện trong cơ sở dữ liệu.
              </p>
            </div>
            
            {/* Add New / Excel Import triggers */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setImportFile(null);
                  setImportResult(null);
                  setImportError("");
                  setShowImportModal(true);
                }}
                className="px-4 py-2.5 bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#374151] font-semibold rounded-xl text-xs shadow-sm hover:scale-[1.02] transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
              >
                📥 Nhập từ Excel
              </button>

              <button
                type="button"
                onClick={() => {
                  setModalError("");
                  setModalMessage("");
                  setUploadedImages([]);
                  setColorVariants(DEFAULT_COLOR_VARIANTS);
                  setActiveTab("basic");
                  setShowCreateModal(true);
                }}
                className="px-5 py-2.5 bg-[#E11D2E] hover:bg-[#C8102E] text-white font-semibold rounded-xl text-xs shadow-sm hover:scale-[1.02] transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
              >
                ➕ Thêm sản phẩm mới
              </button>
            </div>
          </div>

          {/* Search and Filters row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Search Input Box */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyPress}
                placeholder="Tìm tên xe và nhấn Enter..."
                className="w-full bg-white border border-[#E5E7EB] text-[#111827] placeholder:text-[#9CA3AF] rounded-xl pl-4 pr-10 py-2.5 text-xs outline-none focus:border-[#E11D2E] focus:ring-1 focus:ring-[#E11D2E] transition-colors duration-200"
              />
              <button
                onClick={handleSearchClick}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#E11D2E] transition-colors"
              >
                🔍
              </button>
            </div>

            {/* Category selection */}
            <div>
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-white border border-[#E5E7EB] text-[#111827] rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#E11D2E] transition-colors duration-200"
              >
                <option value="">Tất cả phân loại</option>
                <option value="Xe điện">Xe điện</option>
                <option value="Xe 50cc">Xe 50cc</option>
                <option value="Phụ tùng">Phụ tùng</option>
              </select>
            </div>

            {/* Status selection */}
            <div>
              <select
                value={filterActive}
                onChange={(e) => {
                  setFilterActive(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-white border border-[#E5E7EB] text-[#111827] rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#E11D2E] transition-colors duration-200"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="true">Đang bán</option>
                <option value="false">Ẩn</option>
              </select>
            </div>

            {/* Reset option */}
            <div className="flex items-center justify-between text-xs text-[#6B7280]">
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSearchName("");
                  setFilterCategory("");
                  setFilterActive("all");
                  setPage(1);
                }}
                className="text-[11px] text-[#6B7280] hover:text-[#111827] transition-colors duration-150 py-1.5"
              >
                🔄 Xóa bộ lọc
              </button>
              <div>
                Tổng số: <span className="font-mono text-[#E11D2E] font-semibold">{totalProducts}</span>
              </div>
            </div>
          </div>

          {/* Core Table Grid */}
          <div className="overflow-x-auto border border-[#E5E7EB] rounded-xl bg-white">
            {isProductsLoading ? (
              <div className="p-12 text-center text-[#6B7280] flex flex-col items-center justify-center gap-3">
                <div className="w-6 h-6 border-2 border-red-200 border-t-[#E11D2E] rounded-full animate-spin"></div>
                <span className="text-xs">Đang truy vấn dữ liệu sản phẩm...</span>
              </div>
            ) : productsError ? (
              <div className="p-12 text-center text-red-500 text-xs">
                ⚠️ {productsError}
              </div>
            ) : products.length === 0 ? (
              <div className="p-12 text-center text-[#6B7280] text-xs">
                Không tìm thấy dòng xe nào.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] text-[#6B7280] font-semibold uppercase tracking-wider">
                    <th className="p-4 w-20 text-center">Ảnh</th>
                    <th className="p-4">Tên xe</th>
                    <th className="p-4 w-32">Phân loại</th>
                    <th className="p-4 w-40">Giá bán (VND)</th>
                    <th className="p-4 w-32">Trạng thái</th>
                    <th className="p-4 hidden md:table-cell">Thông số chính</th>
                    <th className="p-4 w-28 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-[#F9FAFB] transition-colors duration-150">
                      {/* Cột 1: Ảnh */}
                      <td className="p-4 text-center">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-12 h-12 object-cover rounded-xl border border-[#E5E7EB] hover:scale-105 transition-transform duration-200 mx-auto"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1615887023516-9b6bcd559e87?w=100&auto=format&fit=crop&q=80";
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] mx-auto flex items-center justify-center text-[#9CA3AF] text-[10px]">
                            No Img
                          </div>
                        )}
                      </td>
                      {/* Cột 2: Tên xe */}
                      <td className="p-4 font-medium text-[#111827]">
                        <div className="font-semibold text-[#111827] text-sm">{p.name}</div>
                        <div className="text-[10px] text-[#6B7280] font-mono mt-0.5">{p.id}</div>
                      </td>
                      {/* Cột 3: Phân loại */}
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-semibold tracking-wide uppercase ${
                          p.category === "Xe điện" ? "bg-cyan-50 text-cyan-700 border border-cyan-200" :
                          p.category === "Xe 50cc" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                          "bg-purple-50 text-purple-700 border border-purple-200"
                        }`}>
                          {p.category}
                        </span>
                      </td>
                      {/* Cột 4: Giá bán */}
                      <td className="p-4 font-mono font-semibold text-[#111827] text-sm">
                        <div>{p.price.toLocaleString("vi-VN")} đ</div>
                        {p.originalPrice && p.originalPrice > p.price && (
                          <div className="text-[10px] text-[#9CA3AF] line-through font-normal mt-0.5">
                            {p.originalPrice.toLocaleString("vi-VN")} đ
                          </div>
                        )}
                      </td>
                      {/* Cột 5: Trạng thái */}
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                          p.isActive 
                             ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                             : "bg-red-50 text-red-700 border border-red-200"
                        }`}>
                          {p.isActive ? "Đang bán" : "Ẩn"}
                        </span>
                      </td>
                      {/* Cột 6: Thông số chính */}
                      <td className="p-4 hidden md:table-cell max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {p.specs && p.specs.length > 0 ? (
                            p.specs.slice(0, 3).map((spec: string, idx: number) => (
                              <span key={idx} className="bg-[#F9FAFB] border border-[#E5E7EB] text-[#374151] text-[9px] px-1.5 py-0.5 rounded">
                                {spec}
                              </span>
                            ))
                          ) : (
                            <span className="text-[#9CA3AF] italic">Không có thông số</span>
                          )}
                          {p.specs && p.specs.length > 3 && (
                            <span className="text-[#6B7280] text-[9px] px-1">+{p.specs.length - 3}</span>
                          )}
                        </div>
                      </td>
                      {/* Cột 7: Thao tác */}
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(p)}
                            className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 font-bold rounded-xl text-[10px] transition-all duration-150 cursor-pointer"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p.id)}
                            className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-[#EF4444] font-bold rounded-xl text-[10px] transition-all duration-150 cursor-pointer"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Table Pagination */}
          {totalProducts > pageSize && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#E5E7EB]">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1 || isProductsLoading}
                className="px-4 py-2 bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#374151] text-[11px] font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                ◀ Trang trước
              </button>
              
              <span className="text-xs text-[#6B7280] font-medium">
                Trang <span className="text-[#E11D2E] font-bold">{page}</span> / {Math.ceil(totalProducts / pageSize)}
              </span>

              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, Math.ceil(totalProducts / pageSize)))}
                disabled={page >= Math.ceil(totalProducts / pageSize) || isProductsLoading}
                className="px-4 py-2 bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#374151] text-[11px] font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                Trang sau ▶
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Multi-Tab Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 select-none">
          <div className="bg-white border border-[#E5E7EB] w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            {/* Close Button */}
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute right-5 top-5 text-[#6B7280] hover:text-[#111827] text-lg font-bold transition-colors"
            >
              ✕
            </button>

            {/* Modal Headers */}
            <h3 className="text-lg font-bold text-[#111827] mb-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E11D2E]"></span>
              Thêm dòng xe máy mới
            </h3>
            <p className="text-xs text-[#6B7280] mb-5">
              Vui lòng hoàn thành thông tin ở các Tab bên dưới để lưu sản phẩm.
            </p>

            {/* Tab Selection Navigation Bar */}
            <div className="flex border-b border-[#E5E7EB] mb-6 gap-2 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab("basic")}
                className={`pb-3 px-4 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all duration-200 shrink-0 ${
                  activeTab === "basic"
                    ? "border-[#E11D2E] text-[#E11D2E]"
                    : "border-transparent text-[#6B7280] hover:text-[#111827]"
                }`}
              >
                📝 Thông tin cơ bản
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("colors")}
                className={`pb-3 px-4 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all duration-200 shrink-0 ${
                  activeTab === "colors"
                    ? "border-[#E11D2E] text-[#E11D2E]"
                    : "border-transparent text-[#6B7280] hover:text-[#111827]"
                }`}
              >
                🎨 Màu sắc & Tồn kho
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("specs")}
                className={`pb-3 px-4 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all duration-200 shrink-0 ${
                  activeTab === "specs"
                    ? "border-[#E11D2E] text-[#E11D2E]"
                    : "border-transparent text-[#6B7280] hover:text-[#111827]"
                }`}
              >
                ⚙️ Thông số kỹ thuật
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("images")}
                className={`pb-3 px-4 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all duration-200 shrink-0 ${
                  activeTab === "images"
                    ? "border-[#E11D2E] text-[#E11D2E]"
                    : "border-transparent text-[#6B7280] hover:text-[#111827]"
                }`}
              >
                🖼️ Bộ sưu tập ảnh
              </button>
            </div>

            {/* Success/Error Alerts */}
            {modalMessage && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-medium">
                ✓ {modalMessage}
              </div>
            )}

            {modalError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-medium">
                ⚠️ {modalError}
              </div>
            )}

            <form onSubmit={handleCreateProductSubmit} className="space-y-6">
              
              {/* TAB 1: BASIC INFORMATION & PRICING */}
              {activeTab === "basic" && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold tracking-wider text-[#6B7280] uppercase mb-1.5">
                        Mã SKU sản phẩm <span className="text-[#E11D2E]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        placeholder="Ví dụ: vinfast-feliz-s"
                        disabled={isSubmitting}
                        className="w-full bg-white border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs outline-none focus:border-[#E11D2E] focus:ring-1 focus:ring-[#E11D2E] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold tracking-wider text-[#6B7280] uppercase mb-1.5">
                        Tên dòng xe <span className="text-[#E11D2E]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ví dụ: VinFast Feliz S"
                        disabled={isSubmitting}
                        className="w-full bg-white border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs outline-none focus:border-[#E11D2E] focus:ring-1 focus:ring-[#E11D2E] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold tracking-wider text-[#6B7280] uppercase mb-1.5">
                        Giá niêm yết (VND) <span className="text-[#E11D2E]">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="Ví dụ: 27000000"
                        disabled={isSubmitting}
                        className="w-full bg-white border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs outline-none focus:border-[#E11D2E] focus:ring-1 focus:ring-[#E11D2E] transition-colors font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold tracking-wider text-[#6B7280] uppercase mb-1.5">
                        Giá gốc (Khuyến mãi - Tùy chọn)
                      </label>
                      <input
                        type="number"
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(e.target.value)}
                        placeholder="Ví dụ: 29900000"
                        disabled={isSubmitting}
                        className="w-full bg-white border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs outline-none focus:border-[#E11D2E] focus:ring-1 focus:ring-[#E11D2E] transition-colors font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold tracking-wider text-[#6B7280] uppercase mb-1.5">
                        Phân loại
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full bg-white border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs outline-none focus:border-[#E11D2E] transition-colors"
                      >
                        <option value="Xe điện">Xe điện</option>
                        <option value="Xe 50cc">Xe 50cc</option>
                        <option value="Phụ tùng">Phụ tùng</option>
                      </select>
                    </div>

                    <div className="flex items-center pt-5 pl-2">
                      <input
                        type="checkbox"
                        id="isActiveProduct"
                        checked={isActiveProduct}
                        onChange={(e) => setIsActiveProduct(e.target.checked)}
                        disabled={isSubmitting}
                        className="w-4 h-4 rounded bg-white border-[#E5E7EB] text-[#E11D2E] focus:ring-[#E11D2E]/20"
                      />
                      <label htmlFor="isActiveProduct" className="ml-2 text-xs font-semibold text-[#374151] cursor-pointer">
                        Đang mở bán trên hệ thống
                      </label>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold tracking-wider text-[#6B7280] uppercase mb-1.5">
                        Mô tả tóm tắt
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Nhập mô tả xe..."
                        disabled={isSubmitting}
                        rows={3}
                        className="w-full bg-white border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs outline-none focus:border-[#E11D2E] focus:ring-1 focus:ring-[#E11D2E] transition-colors resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: VEHICLE COLORS & STOCK */}
              {activeTab === "colors" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
                    <span className="text-base text-blue-600 mt-0.5">💡</span>
                    <div className="text-[11px] text-blue-800 leading-relaxed">
                      <span className="font-semibold text-blue-900">Thiết lập màu sắc & kho hàng:</span> Khai báo các phiên bản màu sắc xe và nhập số lượng tồn kho dự kiến ban đầu tại các showroom/nhà kho. Mỗi biến thể màu sắc sẽ được đăng ký làm một mã SKU con độc lập.
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {colorVariants.map((variant, index) => (
                      <div
                        key={index}
                        className="flex flex-col md:flex-row items-stretch md:items-center gap-3 p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl hover:border-[#D1D5DB] transition-all duration-200"
                      >
                        {/* Swatch & Picker */}
                        <div className="flex items-center gap-3">
                          <div className="relative group w-10 h-10 rounded-xl overflow-hidden border border-[#E5E7EB] flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-150 shrink-0">
                            <input
                              type="color"
                              value={variant.hex}
                              onChange={(e) => handleUpdateVariant(index, "hex", e.target.value)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div
                              className="w-6 h-6 rounded-full shadow-inner border border-black/10"
                              style={{ backgroundColor: variant.hex }}
                            />
                            <span className="absolute inset-0 bg-black/55 text-[8px] text-white opacity-0 group-hover:opacity-100 flex items-center justify-center pointer-events-none transition-opacity duration-150 font-bold uppercase">
                              Chọn
                            </span>
                          </div>

                          <div className="w-28 shrink-0">
                            <span className="block text-[9px] font-bold text-[#6B7280] uppercase mb-1">Mã màu Hex</span>
                            <input
                              type="text"
                              value={variant.hex.toUpperCase()}
                              onChange={(e) => handleUpdateVariant(index, "hex", e.target.value)}
                              placeholder="#HEX"
                              className="w-full bg-white border border-[#E5E7EB] text-[#111827] rounded-lg py-1.5 px-2.5 text-xs outline-none focus:border-[#E11D2E] transition-colors font-mono"
                            />
                          </div>
                        </div>

                        {/* Name */}
                        <div className="flex-1">
                          <span className="block text-[9px] font-bold text-[#6B7280] uppercase mb-1">Tên màu sắc (Hiển thị)</span>
                          <input
                            type="text"
                            value={variant.name}
                            onChange={(e) => handleUpdateVariant(index, "name", e.target.value)}
                            placeholder="Đỏ Candy, Trắng Ngọc Trai, Xám Xi Măng..."
                            className="w-full bg-white border border-[#E5E7EB] text-[#111827] rounded-lg py-1.5 px-2.5 text-xs outline-none focus:border-[#E11D2E] transition-colors"
                          />
                        </div>

                        {/* Quantity controls */}
                        <div className="w-full md:w-32">
                          <span className="block text-[9px] font-bold text-[#6B7280] uppercase mb-1">Tồn kho dự kiến</span>
                          <div className="flex items-center bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
                            <button
                              type="button"
                              onClick={() => handleUpdateVariant(index, "initialStock", Math.max(0, variant.initialStock - 1))}
                              className="px-2.5 py-1.5 text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={variant.initialStock}
                              onChange={(e) => handleUpdateVariant(index, "initialStock", Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-full bg-transparent text-center text-xs text-[#111827] outline-none font-mono py-1.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateVariant(index, "initialStock", variant.initialStock + 1)}
                              className="px-2.5 py-1.5 text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Delete button */}
                        <div className="flex items-center justify-end pt-2 md:pt-4">
                          <button
                            type="button"
                            onClick={() => handleDeleteVariant(index)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-150 cursor-pointer"
                            title="Xóa biến thể"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary & Add button */}
                  <div className="flex flex-col sm:flex-row justify-between items-center bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-4 gap-4">
                    <div className="text-xs text-[#6B7280] text-center sm:text-left">
                      Tổng số màu: <span className="text-[#2563EB] font-bold font-mono">{colorVariants.length}</span> | 
                      Tổng tồn kho ban đầu: <span className="text-[#10B981] font-bold font-mono ml-1">{colorVariants.reduce((sum, v) => sum + v.initialStock, 0)} xe</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddVariant}
                      className="px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 font-semibold rounded-xl text-xs transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
                    >
                      ➕ Thêm màu sắc mới
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: VEHICLE SPECIFICATIONS */}
              {activeTab === "specs" && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4">
                    <p className="text-[11px] text-blue-800 leading-relaxed">
                      💡 Các thông số kỹ thuật bên dưới sẽ được lưu trữ dạng động vào MongoDB Catalog của dòng xe tương ứng để hỗ trợ hiển thị so sánh chi tiết.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold tracking-wider text-[#6B7280] uppercase mb-1.5">
                        Kích thước (Dài x Rộng x Cao)
                      </label>
                      <input
                        type="text"
                        value={dimensions}
                        onChange={(e) => setDimensions(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full bg-white border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs outline-none focus:border-[#E11D2E] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold tracking-wider text-[#6B7280] uppercase mb-1.5">
                        Loại Pin
                      </label>
                      <input
                        type="text"
                        value={batteryType}
                        onChange={(e) => setBatteryType(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full bg-white border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs outline-none focus:border-[#E11D2E] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold tracking-wider text-[#6B7280] uppercase mb-1.5">
                        Công suất động cơ
                      </label>
                      <input
                        type="text"
                        value={enginePower}
                        onChange={(e) => setEnginePower(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full bg-white border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs outline-none focus:border-[#E11D2E] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold tracking-wider text-[#6B7280] uppercase mb-1.5">
                        Vận tốc tối đa
                      </label>
                      <input
                        type="text"
                        value={maxSpeed}
                        onChange={(e) => setMaxSpeed(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full bg-white border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs outline-none focus:border-[#E11D2E] transition-colors"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold tracking-wider text-[#6B7280] uppercase mb-1.5">
                        Quãng đường di chuyển / sạc đầy
                      </label>
                      <input
                        type="text"
                        value={rangePerCharge}
                        onChange={(e) => setRangePerCharge(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full bg-white border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs outline-none focus:border-[#E11D2E] transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PRODUCT IMAGES COLLECTION (DRAG AND DROP UPLOAD) */}
              {activeTab === "images" && (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Drag and Drop Zone Container */}
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[180px] transition-all duration-300 relative ${
                      dragActive 
                        ? "border-[#E11D2E] bg-red-50/50 scale-[1.01]" 
                        : "border-[#E5E7EB] bg-[#F9FAFB] hover:border-[#D1D5DB]"
                    }`}
                  >
                    <input
                      type="file"
                      id="file-upload-input"
                      multiple={false}
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*"
                    />

                    {isUploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-3 border-red-200 border-t-[#E11D2E] rounded-full animate-spin"></div>
                        <p className="text-xs text-[#E11D2E] font-semibold tracking-wide">Đang tải ảnh lên MinIO S3...</p>
                      </div>
                    ) : (
                      <label htmlFor="file-upload-input" className="cursor-pointer flex flex-col items-center gap-2.5">
                        <div className="w-12 h-12 bg-white border border-[#E5E7EB] rounded-full flex items-center justify-center text-[#6B7280] shadow-sm">
                          📁
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#111827]">
                            Kéo thả file ảnh vào đây hoặc <span className="text-[#E11D2E] hover:underline">Click chọn file</span>
                          </p>
                          <p className="text-[10px] text-[#6B7280] mt-1">
                            Hỗ trợ định dạng JPG, PNG, WEBP, GIF (Tối đa 5MB)
                          </p>
                        </div>
                      </label>
                    )}
                  </div>

                  {/* Manual URL input field as fallback */}
                  <div>
                    <label className="block text-[10px] font-bold tracking-wider text-[#6B7280] uppercase mb-1.5">
                      Hoặc nhập trực tiếp URL ảnh chính
                    </label>
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Đường dẫn URL ảnh..."
                      className="w-full bg-white border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs outline-none focus:border-[#E11D2E] transition-colors"
                    />
                  </div>

                  {/* Uploaded Gallery Grid Preview */}
                  {uploadedImages.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold tracking-wider text-[#6B7280] uppercase mb-3">
                        Hình ảnh trong phiên làm việc
                      </h4>
                      <div className="grid grid-cols-4 gap-4">
                        {uploadedImages.map((url, index) => {
                          const isMain = imageUrl === url;
                          return (
                            <div 
                              key={index} 
                              onClick={() => setImageUrl(url)}
                              className={`relative group rounded-xl overflow-hidden border cursor-pointer transition-all duration-200 aspect-square bg-[#F9FAFB] flex items-center justify-center ${
                                isMain ? "border-[#E11D2E] ring-2 ring-[#E11D2E]/20 scale-102" : "border-[#E5E7EB] hover:border-[#D1D5DB]"
                              }`}
                            >
                              <img src={url} alt={`Preview ${index}`} className="object-cover w-full h-full" />
                              
                              {/* Hover Overlay */}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                                <span className="text-[9px] text-white font-semibold">Chọn làm ảnh chính</span>
                              </div>

                              {/* Main Indicator Badge */}
                              {isMain && (
                                <div className="absolute top-1.5 left-1.5 bg-[#E11D2E] text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow">
                                  Ảnh chính
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between items-center border-t border-[#E5E7EB] pt-4 mt-6">
                
                {/* Tab Navigation Shortcuts */}
                <div className="flex gap-2">
                  {activeTab !== "basic" && (
                    <button
                      type="button"
                      onClick={() => {
                        if (activeTab === "colors") setActiveTab("basic");
                        if (activeTab === "specs") setActiveTab("colors");
                        if (activeTab === "images") setActiveTab("specs");
                      }}
                      className="px-4 py-2 bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#374151] text-[11px] font-semibold rounded-xl transition-colors"
                    >
                      ◀ Quay lại
                    </button>
                  )}
                  
                  {activeTab !== "images" && (
                    <button
                      type="button"
                      onClick={() => {
                        if (activeTab === "basic") setActiveTab("colors");
                        if (activeTab === "colors") setActiveTab("specs");
                        if (activeTab === "specs") setActiveTab("images");
                      }}
                      className="px-4 py-2 bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#374151] text-[11px] font-semibold rounded-xl transition-colors"
                    >
                      Tiếp tục ▶
                    </button>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#374151] font-semibold rounded-xl text-xs transition-colors"
                  >
                    Hủy
                  </button>
                  
                  {/* Save button visible on all tabs but only clickable when valid */}
                  <button
                    type="submit"
                    disabled={isSubmitting || isUploading}
                    className="px-6 py-2.5 bg-[#E11D2E] hover:bg-[#C8102E] text-white font-semibold rounded-xl text-xs shadow-sm hover:scale-[1.02] transition-all duration-200 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        <span>Đang tạo...</span>
                      </>
                    ) : (
                      <span>Lưu sản phẩm</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Excel Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 select-none">
          <div className="bg-white border border-[#E5E7EB] w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            {/* Close Button */}
            <button
              onClick={() => setShowImportModal(false)}
              className="absolute right-5 top-5 text-[#6B7280] hover:text-[#111827] text-lg font-bold transition-colors cursor-pointer"
            >
              ✕
            </button>

            {/* Headers */}
            <h3 className="text-lg font-bold text-[#111827] mb-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E11D2E]"></span>
              Nhập sản phẩm hàng loạt từ Excel
            </h3>
            <p className="text-xs text-[#6B7280] mb-5">
              Tải lên file dữ liệu Excel (.xlsx, .xls) để nhập hàng loạt phụ tùng/phụ kiện vào hệ thống.
            </p>

            {/* Error alerts */}
            {importError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-[#EF4444] text-xs font-medium">
                ⚠️ {importError}
              </div>
            )}

            {/* Main content */}
            <div className="space-y-6">
              
              {/* Drag & Drop Zone */}
              <div
                onDragEnter={handleDragImport}
                onDragOver={handleDragImport}
                onDragLeave={handleDragImport}
                onDrop={handleDropImport}
                className={`border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[160px] transition-all duration-300 relative ${
                  dragActiveImport 
                    ? "border-[#E11D2E] bg-red-50/50 scale-[1.01]" 
                    : "border-[#E5E7EB] bg-[#F9FAFB] hover:border-[#D1D5DB]"
                }`}
              >
                <input
                  type="file"
                  id="excel-import-input"
                  onChange={handleFileChangeImport}
                  className="hidden"
                  accept=".xlsx, .xls"
                />

                {isImporting ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-red-200 border-t-[#E11D2E] rounded-full animate-spin"></div>
                    <p className="text-xs text-[#E11D2E] font-semibold tracking-wide">Đang đọc dữ liệu và kiểm tra tính hợp lệ...</p>
                  </div>
                ) : (
                  <label htmlFor="excel-import-input" className="cursor-pointer flex flex-col items-center gap-2.5 w-full">
                    <div className="w-12 h-12 bg-white border border-[#E5E7EB] rounded-full flex items-center justify-center text-[#6B7280] shadow-sm">
                      📊
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#111827]">
                        Kéo thả file Excel vào đây hoặc <span className="text-[#E11D2E] hover:underline">Click chọn file</span>
                      </p>
                      <p className="text-[10px] text-[#6B7280] mt-1">
                        Hỗ trợ file .XLSX, .XLS (Tối đa 5MB)
                      </p>
                    </div>
                  </label>
                )}
              </div>

              {/* Selected file preview */}
              {importFile && !isImporting && (
                <div className="flex items-center justify-between p-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg shrink-0">📄</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#111827] truncate">{importFile.name}</p>
                      <p className="text-[10px] text-[#6B7280] font-mono">{(importFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImportFile(null)}
                    className="text-[10px] font-bold text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    Xóa chọn
                  </button>
                </div>
              )}

              {/* Import results summary & errors */}
              {importResult && (
                <div className="space-y-4 border-t border-[#E5E7EB] pt-5">
                  <h4 className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                    📊 Kết quả xử lý file:
                  </h4>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-center">
                      <span className="block text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">Tổng số dòng</span>
                      <span className="text-lg font-bold font-mono text-[#111827]">{importResult.totalRows}</span>
                    </div>
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                      <span className="block text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">Thành công</span>
                      <span className="text-lg font-bold font-mono text-emerald-600">+{importResult.successCount}</span>
                    </div>
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-center">
                      <span className="block text-[10px] font-semibold text-red-700 uppercase tracking-wider">Thất bại</span>
                      <span className="text-lg font-bold font-mono text-red-600">-{importResult.failureCount}</span>
                    </div>
                  </div>

                  {/* Errors details list */}
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="space-y-2">
                      <span className="block text-[10px] font-bold text-red-600 uppercase tracking-wider">Chi tiết lỗi dòng:</span>
                      <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-3 max-h-[160px] overflow-y-auto text-[11px] font-mono text-[#374151] divide-y divide-[#E5E7EB]">
                        {importResult.errors.map((err: string, idx: number) => (
                          <div key={idx} className="py-1.5 first:pt-0 last:pb-0 text-red-600 leading-relaxed flex items-start gap-1.5">
                            <span className="shrink-0">❌</span>
                            <span>{err}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {importResult.failureCount === 0 && importResult.successCount > 0 && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-medium">
                      ✓ Đã nhập thành công tất cả sản phẩm vào cơ sở dữ liệu!
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action buttons footer */}
            <div className="flex justify-end gap-3 border-t border-[#E5E7EB] pt-4 mt-6">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                disabled={isImporting}
                className="px-5 py-2.5 bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#374151] font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Đóng
              </button>

              {importFile && !importResult && (
                <button
                  type="button"
                  onClick={handleUploadExcel}
                  disabled={isImporting}
                  className="px-6 py-2.5 bg-[#E11D2E] hover:bg-[#C8102E] text-white font-semibold rounded-xl text-xs shadow-sm transition-all duration-200 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isImporting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <span>Bắt đầu nhập dữ liệu</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 select-none">
          <div className="bg-white border border-[#E5E7EB] w-full max-w-lg rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            {/* Close Button */}
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute right-5 top-5 text-[#6B7280] hover:text-[#111827] text-lg font-bold transition-colors"
            >
              ✕
            </button>

            {/* Modal Headers */}
            <h3 className="text-lg font-bold text-[#111827] mb-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E11D2E]"></span>
              Chỉnh sửa thông tin xe
            </h3>
            <p className="text-xs text-[#6B7280] mb-5">
              Thay đổi thông tin xe và hình ảnh hiển thị trên trang chủ.
            </p>

            <form onSubmit={handleEditProductSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold tracking-wider text-[#6B7280] uppercase mb-1.5">
                  SKU (Mã dòng xe - Không thể sửa)
                </label>
                <input
                  type="text"
                  value={editSku}
                  disabled
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] text-[#6B7280] rounded-xl p-3 text-xs outline-none cursor-not-allowed font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-wider text-[#6B7280] uppercase mb-1.5">
                  Tên xe
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nhập tên xe..."
                  disabled={isSubmitting}
                  className="w-full bg-white border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs outline-none focus:border-[#E11D2E] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold tracking-wider text-[#6B7280] uppercase mb-1.5">
                    Giá bán (VND)
                  </label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    placeholder="27000000"
                    disabled={isSubmitting}
                    className="w-full bg-white border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs outline-none focus:border-[#E11D2E] transition-colors font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold tracking-wider text-[#6B7280] uppercase mb-1.5">
                    Giá gốc (VND - Không bắt buộc)
                  </label>
                  <input
                    type="number"
                    value={editOriginalPrice}
                    onChange={(e) => setEditOriginalPrice(e.target.value)}
                    placeholder="30240000"
                    disabled={isSubmitting}
                    className="w-full bg-white border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs outline-none focus:border-[#E11D2E] transition-colors font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-wider text-[#6B7280] uppercase mb-1.5">
                  Nhãn giảm giá (VD: Giảm 11%)
                </label>
                <input
                  type="text"
                  value={editDiscountText}
                  onChange={(e) => setEditDiscountText(e.target.value)}
                  placeholder="Giảm 11%"
                  disabled={isSubmitting}
                  className="w-full bg-white border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs outline-none focus:border-[#E11D2E] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-wider text-[#6B7280] uppercase mb-1.5">
                  Tải lên ảnh mới từ máy tính
                </label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    id="edit-file-upload-input"
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                  />
                  <label
                    htmlFor="edit-file-upload-input"
                    className="px-4 py-2 bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#374151] font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    📁 Chọn file ảnh mới
                  </label>
                  {isUploading && (
                    <span className="text-xs text-[#E11D2E] font-semibold flex items-center gap-1.5 animate-pulse">
                      ⏳ Đang tải ảnh...
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-wider text-[#6B7280] uppercase mb-1.5">
                  Hoặc nhập trực tiếp URL ảnh
                </label>
                <input
                  type="text"
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  placeholder="/products/feliz-s.png"
                  disabled={isSubmitting}
                  className="w-full bg-white border border-[#E5E7EB] text-[#111827] rounded-xl p-3 text-xs outline-none focus:border-[#E11D2E] transition-colors font-mono"
                />
              </div>

              {/* Status messages inside Modal */}
              {modalError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-[#EF4444] text-xs font-medium">
                  ⚠️ {modalError}
                </div>
              )}
              {modalMessage && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-medium">
                  ✅ {modalMessage}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#374151] rounded-xl text-xs font-semibold tracking-wide uppercase transition-all duration-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#E11D2E] hover:bg-[#C8102E] text-white font-semibold rounded-xl text-xs shadow-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
