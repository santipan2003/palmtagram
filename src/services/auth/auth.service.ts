import { UserProfile } from "@/interfaces/auth.interface";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Helper สำหรับการอ่าน token จาก cookie
export const getAuthToken = (): string => {
  if (typeof document === "undefined") return "";

  const cookies = document.cookie.split(";");
  const tokenCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("access_token=")
  );
  return tokenCookie ? tokenCookie.split("=")[1] : "";
};

// Service สำหรับ Authentication
export const authService = {
  // ดึงข้อมูลโปรไฟล์ผู้ใช้
  getProfile: async (token: string): Promise<UserProfile> => {
    const response = await fetch(`${API_URL}/users/profile`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized");
      }
      throw new Error("Failed to fetch profile");
    }

    return await response.json();
  },

  // ล็อกเอาท์
  logout: async (): Promise<void> => {
    const response = await fetch(`${API_URL}/auth/logout`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to logout");
    }

    // ลบ cookie
    document.cookie =
      "access_token=; Max-Age=0; path=/; secure; sameSite=strict";
  },

  // สร้าง URL สำหรับ OAuth login
  getOAuthURL: (provider: "google" | "facebook"): string => {
    return `${API_URL}/auth/${provider}`;
  },

  // ตรวจสอบว่ามีการล็อกอินอยู่หรือไม่
  isAuthenticated: async (): Promise<boolean> => {
    try {
      const token = getAuthToken();
      if (!token) return false;

      const response = await fetch(`${API_URL}/auth/verify`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error("Error checking authentication:", error);
      return false;
    }
  },

  // ล็อกอินด้วย credentials (อาจใช้ในอนาคต)
  loginWithCredentials: async (
    email: string,
    password: string
  ): Promise<{ user: UserProfile; token: string }> => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to login");
    }

    const data = await response.json();
    return data;
  },

  // อัพเดทโปรไฟล์
  updateProfile: async (
    userData: {
      name?: string;
      bio?: string;
      avatarFile?: File;
    },
    token: string
  ): Promise<UserProfile> => {
    const formData = new FormData();
    if (userData.name) formData.append("name", userData.name);
    if (userData.bio) formData.append("bio", userData.bio);
    if (userData.avatarFile) formData.append("avatar", userData.avatarFile);

    const response = await fetch(`${API_URL}/users/profile`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to update profile");
    }

    return await response.json();
  },
};
