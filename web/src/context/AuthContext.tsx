"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("accessToken");
        if (token) {
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error("Lỗi khi truy xuất accessToken từ localStorage:", error);
    }
  }, []);

  const login = (token: string) => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", token);
      }
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Lỗi khi lưu accessToken vào localStorage:", error);
    }
  };

  const logout = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
      }
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Lỗi khi xóa accessToken từ localStorage:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth phải được sử dụng trong AuthProvider");
  }
  return context;
}
