"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

/// <summary>
/// ClientLayout encapsulates the customer-facing website layout (Header + Main Content + Footer).
/// If the current route is under /admin, it bypasses the website Header and Footer completely
/// to ensure total isolation between Admin Panel and Client Website.
/// </summary>
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Completely bypass Client Website Header & Footer for Admin routes
  if (pathname && pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <div className="flex-1">{children}</div>
      <Footer />
    </>
  );
}
