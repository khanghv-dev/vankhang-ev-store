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
    default: "EV O2O — Hệ sinh thái Đặt cọc & Quản lý Xe Điện",
    template: "%s | EV O2O",
  },
  description:
    "Nền tảng O2O (Online-to-Offline) dành cho hệ sinh thái xe điện (EV) — đặt cọc trực tuyến, kích hoạt bảo hành điện tử và theo dõi đơn hàng thời gian thực.",
  keywords: ["EV", "O2O", "xe điện", "đặt cọc xe điện", "bảo hành điện tử", "quản lý đơn hàng"],
  authors: [{ name: "EV O2O Team" }],
  creator: "EV O2O Ecosystem",
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "EV O2O",
    title: "EV O2O — Hệ thống Đặt cọc & Quản lý Xe Điện",
    description:
      "Nền tảng O2O dành cho hệ sinh thái xe điện — đặt cọc trực tuyến, theo dõi đơn hàng thời gian thực.",
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
