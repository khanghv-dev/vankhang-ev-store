import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import ClientLayout from "@/components/ClientLayout";
import GoogleAuthProviderWrapper from "@/components/GoogleAuthProviderWrapper";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "VinFast O2O — Hệ thống Đặt cọc & Quản lý Xe",
    template: "%s | VinFast O2O",
  },
  description:
    "Nền tảng O2O (Online-to-Offline) dành riêng cho hệ sinh thái VinFast — đặt cọc trực tuyến, kích hoạt bảo hành điện tử và theo dõi đơn hàng thời gian thực.",
  keywords: ["VinFast", "O2O", "đặt cọc xe", "bảo hành điện tử", "quản lý đơn hàng"],
  authors: [{ name: "VinFast O2O Team" }],
  creator: "VinFast",
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "VinFast O2O",
    title: "VinFast O2O — Hệ thống Đặt cọc & Quản lý Xe",
    description:
      "Nền tảng O2O dành riêng cho hệ sinh thái VinFast — đặt cọc trực tuyến, theo dõi đơn hàng thời gian thực.",
  },
};

export const viewport: Viewport = {
  themeColor: "#E30613",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col bg-[#F5F7FA]">
        <GoogleAuthProviderWrapper>
          <AuthProvider>
            <ClientLayout>{children}</ClientLayout>
          </AuthProvider>
        </GoogleAuthProviderWrapper>
      </body>
    </html>
  );
}
