"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "../context/AdminAuthContext";

interface AdminRouteGuardProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredPermission?: string;
}

/// <summary>
/// A Client-Side Router Guard wrapping protected Admin features.
/// Performs role and granular permission assertions and handles smooth loading transitions.
/// </summary>
export default function AdminRouteGuard({
  children,
  requiredRole,
  requiredPermission,
}: AdminRouteGuardProps) {
  const { adminToken, adminUser, isLoading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!adminToken || !adminUser) {
        // Redirect unauthorized request immediately to login page
        router.push("/admin/login");
        return;
      }

      // Check required role matches
      if (requiredRole && !adminUser.roles.includes(requiredRole)) {
        router.push("/admin/login?error=403_role");
        return;
      }

      // Check required permission matches
      if (requiredPermission && !adminUser.permissions.includes(requiredPermission)) {
        router.push("/admin/login?error=403_permission");
        return;
      }
    }
  }, [isLoading, adminToken, adminUser, requiredRole, requiredPermission, router]);

  // Premium glassmorphic loading spinner with Outfit font guidelines
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex flex-col justify-center items-center bg-slate-950 z-50 text-slate-100 font-sans">
        <div className="relative flex items-center justify-center mb-6">
          <div className="w-16 h-16 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
          <div className="absolute font-bold text-lg text-blue-500">V</div>
        </div>
        <div className="text-xs font-semibold tracking-widest text-slate-400 uppercase animate-pulse">
          Đang xác thực quyền hạn...
        </div>
      </div>
    );
  }

  // Block child layout render if token is absent or assertions fail to avoid DOM leakage
  if (!adminToken || !adminUser) {
    return null;
  }

  if (requiredRole && !adminUser.roles.includes(requiredRole)) {
    return null;
  }

  if (requiredPermission && !adminUser.permissions.includes(requiredPermission)) {
    return null;
  }

  return <>{children}</>;
}
