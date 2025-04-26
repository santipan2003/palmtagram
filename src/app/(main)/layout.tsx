// app/(main)/layout.tsx
import type React from "react";
import type { Metadata } from "next";
import "../globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/layout/app-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { cookies } from "next/headers";
import { AuthProvider } from "@/lib/auth-context";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Palmtagram",
  description: "A modern social media platform",
};

interface UserProfile {
  _id: string; // เปลี่ยนจาก id เป็น _id ให้ตรงกับ backend
  email: string;
  username?: string; // เพิ่ม field อื่นๆ ที่อาจมีใน response
  profile?: {
    name: string;
    avatarUrl: string;
  };
}

async function fetchProfile(token: string): Promise<UserProfile | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      console.error("[fetchProfile] NEXT_PUBLIC_API_URL is not defined");
      return null;
    }

    const response = await fetch(`${apiUrl}/users/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: `access_token=${token}`,
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        `[fetchProfile] Failed to fetch profile: ${response.status} ${response.statusText}`
      );
      if (response.status === 401) {
        console.error(
          "[fetchProfile] Unauthorized: Check token validity or cookie"
        );
      }
      try {
        const errorData = await response.json();
        console.error("[fetchProfile] Error response:", errorData);
      } catch {
        console.error("[fetchProfile] No error response body");
      }
      return null;
    }

    const data = await response.json();

    // ตรวจสอบว่า data มี _id และ email
    if (!data?._id || !data?.email) {
      console.error(
        "[fetchProfile] Invalid profile data, missing _id or email:",
        data
      );
      return null;
    }

    // แปลง data ให้ตรงกับ UserProfile interface
    const userProfile: UserProfile = {
      _id: data._id,
      email: data.email,
      username: data.username,
      profile: data.profile,
    };

    console.log("[fetchProfile] Successfully fetched profile:", userProfile);
    return userProfile;
  } catch (error) {
    console.error("[fetchProfile] Error fetching profile:", error);
    return null;
  }
}

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  // Redirect to login if no token
  if (!token) {
    redirect("/login");
  }

  // Fetch profile on the server
  const initialUser = await fetchProfile(token);
  console.log("[MainLayout] Initial user profile:", initialUser);

  // Redirect to login if profile fetch fails
  if (!initialUser) {
    redirect("/login");
  }

  // Get sidebar state from cookies
  const sidebarState = cookieStore.get("sidebar:state")?.value;
  const defaultOpen = sidebarState !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AuthProvider initialUser={initialUser} token={token}>
        <AppSidebar />
        <SidebarInset>
          <main className="min-h-screen p-4 md:p-6">{children}</main>
        </SidebarInset>
      </AuthProvider>
    </SidebarProvider>
  );
}
