// lib/auth-context.tsx
"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserProfile, AuthContextType } from "@/interfaces/auth.interface";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
  initialUser,
  token,
}: {
  children: React.ReactNode;
  initialUser?: UserProfile | null;
  token: string;
}) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(initialUser || null);
  const [isLoading, setIsLoading] = useState(!initialUser);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // บันทึก token ลงใน localStorage สำหรับ WebSocket ทันที
    if (token) {
      try {
        localStorage.setItem("ws_auth_token", token);
        console.log("Token saved to localStorage for WebSocket");
      } catch (e) {
        console.warn("Failed to save token to localStorage:", e);
      }
    }

    // Fetch profile ในฝั่ง client ถ้าไม่มี initialUser
    if (!initialUser && token) {
      const fetchProfile = async () => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/users/profile`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              cache: "no-store",
            }
          );

          if (!response.ok) {
            // ตรวจสอบ response status และจัดการตามเหมาะสม
            if (response.status === 401) {
              // Token หมดอายุ - ลบ token และ redirect ไปยังหน้า login
              document.cookie =
                "access_token=; Max-Age=0; path=/; secure; sameSite=strict";
              localStorage.removeItem("ws_auth_token");
              localStorage.removeItem("user_data");
              router.push("/login");
              throw new Error("Session expired. Please login again.");
            }
            throw new Error(`Failed to fetch profile: ${response.statusText}`);
          }

          const data = await response.json();
          setUser(data);

          // บันทึกข้อมูลผู้ใช้ลงใน localStorage สำหรับใช้ตรวจสอบการเป็นสมาชิก
          try {
            localStorage.setItem(
              "user_data",
              JSON.stringify({
                _id: data._id,
                username: data.username,
              })
            );
            console.log("User data saved to localStorage:", data._id);

            // สถานะออนไลน์จะถูกจัดการโดยอัตโนมัติในฝั่ง backend ตอน login
          } catch (e) {
            console.error("Failed to save user data to localStorage:", e);
          }
        } catch (err) {
          setError(
            `An error occurred while fetching profile: ${
              err instanceof Error ? err.message : String(err)
            }`
          );
        } finally {
          setIsLoading(false);
        }
      };

      fetchProfile();
    } else if (initialUser) {
      // บันทึกข้อมูล initialUser ลง localStorage เพื่อใช้ในการตรวจสอบสมาชิก
      try {
        localStorage.setItem(
          "user_data",
          JSON.stringify({
            _id: initialUser._id,
            username: initialUser.username,
          })
        );
        console.log(
          "Initial user data saved to localStorage:",
          initialUser._id
        );

        // สถานะออนไลน์จะถูกจัดการโดยอัตโนมัติในฝั่ง backend ตอน login
      } catch (e) {
        console.error("Failed to save initial user data to localStorage:", e);
      }
      setIsLoading(false);
    }
  }, [token, router, initialUser]);

  // การล็อกเอาท์ - ใช้ endpoint /auth/logout ซึ่งจะจัดการสถานะออฟไลน์ให้โดยอัตโนมัติ
  const logout = async () => {
    try {
      // ลบข้อมูลใน localStorage ก่อน เพื่อป้องกันการเชื่อมต่อใหม่ระหว่างรอ API
      localStorage.removeItem("ws_auth_token");
      localStorage.removeItem("user_data");

      // หลังจากลบข้อมูลแล้วจึงแจ้ง backend
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: "GET",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // ลบ token จาก cookie
      document.cookie =
        "access_token=; Max-Age=0; path=/; secure; sameSite=strict";

      // ยืนยันอีกครั้งว่า localStorage ถูกลบแล้ว
      try {
        localStorage.removeItem("ws_auth_token");
        localStorage.removeItem("user_data");
      } catch (e) {
        console.warn("Error removing token from localStorage:", e);
      }

      setUser(null);
      router.push("/");
    } catch (err) {
      console.error("Failed to logout:", err);
      setError("Failed to logout");

      // กรณีเกิดข้อผิดพลาด ยังคงต้องลบข้อมูลในฝั่ง client
      localStorage.removeItem("ws_auth_token");
      localStorage.removeItem("user_data");
      document.cookie =
        "access_token=; Max-Age=0; path=/; secure; sameSite=strict";
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
