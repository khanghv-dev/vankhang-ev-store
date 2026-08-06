"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  userEmail: string | null;
  userPicture: string | null;
  userName: string | null;
  login: (token: string, pictureUrl?: string, name?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const decodeEmailFromToken = (token: string): string | null => {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    return payload.email || payload.sub || null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userPicture, setUserPicture] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("accessToken");
        const pic = localStorage.getItem("userPicture");
        const name = localStorage.getItem("userName");
        if (token) {
          setIsAuthenticated(true);
          setUserEmail(decodeEmailFromToken(token));
          setUserPicture(pic);
          setUserName(name);
        }
      }
    } catch (error) {
      console.error("Lỗi khi truy xuất accessToken từ localStorage:", error);
    }
  }, []);

  const login = (token: string, pictureUrl?: string, name?: string) => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", token);
        if (pictureUrl) localStorage.setItem("userPicture", pictureUrl);
        if (name) localStorage.setItem("userName", name);
      }
      setIsAuthenticated(true);
      setUserEmail(decodeEmailFromToken(token));
      if (pictureUrl) setUserPicture(pictureUrl);
      if (name) setUserName(name);
    } catch (error) {
      console.error("Lỗi khi lưu accessToken vào localStorage:", error);
    }
  };

  const logout = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userPicture");
        localStorage.removeItem("userName");
      }
      setIsAuthenticated(false);
      setUserEmail(null);
      setUserPicture(null);
      setUserName(null);
    } catch (error) {
      console.error("Lỗi khi xóa accessToken từ localStorage:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userEmail, userPicture, userName, login, logout }}>
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
