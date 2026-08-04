"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
}

interface JwtPayload {
  sub?: string;
  adminUserId?: string;
  unique_name?: string;
  email?: string;
  exp?: number;
  iat?: number;
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string | string[];
  permission?: string | string[];
  [key: string]: unknown;
}

interface AdminAuthContextType {
  adminToken: string | null;
  adminRefreshToken: string | null;
  adminUser: AdminUser | null;
  isLoading: boolean;
  loginAdmin: (token: string, refreshToken: string) => void;
  logoutAdmin: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// Helper function to decode JWT token payload without third-party library
function decodeJwt(token: string): JwtPayload | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload) as JwtPayload;
  } catch {
    return null;
  }
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminRefreshToken, setAdminRefreshToken] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Helper function to call the refresh endpoint
  const refreshAdminSession = async (token: string, rToken: string): Promise<string | null> => {
    try {
      const response = await fetch("http://localhost:5022/api/admin/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          AccessToken: token,
          RefreshToken: rToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        loginAdmin(data.accessToken, data.refreshToken);
        return data.accessToken;
      } else {
        logoutAdmin();
        return null;
      }
    } catch {
      return null;
    }
  };

  // 1. Initial boot session restore
  useEffect(() => {
    const restoreSession = async () => {
      if (typeof window !== "undefined") {
        try {
          const storedToken = localStorage.getItem("adminToken");
          const storedRefreshToken = localStorage.getItem("adminRefreshToken");

          if (storedToken && storedRefreshToken) {
            const payload = decodeJwt(storedToken);
            const currentTime = Math.floor(Date.now() / 1000);
            
            if (payload && payload.exp && payload.exp > currentTime) {
              setAdminToken(storedToken);
              setAdminRefreshToken(storedRefreshToken);
              
              const rawRoles = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
              const roles = Array.isArray(rawRoles) ? rawRoles : rawRoles ? [rawRoles] : [];
              
              const rawPermissions = payload["permission"];
              const permissions = Array.isArray(rawPermissions) ? rawPermissions : rawPermissions ? [rawPermissions] : [];

              setAdminUser({
                id: payload.sub || payload.adminUserId || "",
                username: payload.unique_name || "",
                email: payload.email || "",
                roles: roles,
                permissions: permissions,
              });
            } else {
              // Access token expired, attempt to refresh immediately
              const newToken = await refreshAdminSession(storedToken, storedRefreshToken);
              if (!newToken) {
                localStorage.removeItem("adminToken");
                localStorage.removeItem("adminRefreshToken");
                document.cookie = "adminToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                document.cookie = "adminRefreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
              }
            }
          }
        } catch {
          // Silent fallback for boot session restore
        } finally {
          setIsLoading(false);
        }
      }
    };

    restoreSession();
  }, []);

  const loginAdmin = (token: string, refreshToken: string) => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("adminToken", token);
        localStorage.setItem("adminRefreshToken", refreshToken);
        
        document.cookie = `adminToken=${token}; path=/; max-age=900; SameSite=Strict`;
        document.cookie = `adminRefreshToken=${refreshToken}; path=/; max-age=604800; SameSite=Strict`;
        
        const payload = decodeJwt(token);
        if (payload) {
          const rawRoles = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
          const roles = Array.isArray(rawRoles) ? rawRoles : rawRoles ? [rawRoles] : [];
          
          const rawPermissions = payload["permission"];
          const permissions = Array.isArray(rawPermissions) ? rawPermissions : rawPermissions ? [rawPermissions] : [];

          setAdminToken(token);
          setAdminRefreshToken(refreshToken);
          setAdminUser({
            id: payload.sub || payload.adminUserId || "",
            username: payload.unique_name || "",
            email: payload.email || "",
            roles: roles,
            permissions: permissions,
          });
        }
      }
    } catch {
      // Silent error catching for admin token save
    }
  };

  const logoutAdmin = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminRefreshToken");
        document.cookie = "adminToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "adminRefreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        setAdminToken(null);
        setAdminRefreshToken(null);
        setAdminUser(null);
      }
    } catch {
      // Silent error catching for admin logout
    }
  };

  // 2. Background Auto-Refresh Loop
  useEffect(() => {
    if (isLoading || !adminToken || !adminRefreshToken) return;

    const checkAndRefreshToken = async () => {
      try {
        const payload = decodeJwt(adminToken);
        if (!payload || !payload.exp) return;

        const exp = payload.exp * 1000;
        const iat = payload.iat ? payload.iat * 1000 : exp - (15 * 60 * 1000);
        const totalDuration = exp - iat;
        const threshold = Math.min(3 * 60 * 1000, totalDuration / 3);

        const now = Date.now();
        const timeLeft = exp - now;

        if ((timeLeft > 0 && timeLeft < threshold) || timeLeft <= 0) {
          await refreshAdminSession(adminToken, adminRefreshToken);
        }
      } catch {
        // Silent catch for token check loop
      }
    };

    checkAndRefreshToken();
    const interval = setInterval(checkAndRefreshToken, 10000);
    return () => clearInterval(interval);
  }, [adminToken, adminRefreshToken, isLoading]);

  return (
    <AdminAuthContext.Provider value={{ adminToken, adminRefreshToken, adminUser, isLoading, loginAdmin, logoutAdmin }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth phải được sử dụng bên trong AdminAuthProvider");
  }
  return context;
}
