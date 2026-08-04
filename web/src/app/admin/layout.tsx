"use client";

import React from "react";
import { AdminAuthProvider } from "../../context/AdminAuthContext";
import AdminNotificationToast from "../../components/AdminNotificationToast";

/// <summary>
/// Root admin layout wrapper ensuring all administrative routes share the AdminAuthProvider & SignalR Real-Time Notifications.
/// </summary>
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminNotificationToast />
      {children}
    </AdminAuthProvider>
  );
}
