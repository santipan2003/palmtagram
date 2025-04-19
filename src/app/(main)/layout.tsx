// app/(main)/page.tsx

import type React from "react";
import type { Metadata } from "next";
import "../globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/layout/app-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Palmtagram",
  description: "A modern social media platform",
};

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get sidebar state from cookies
  const cookieStore = await cookies();
  const sidebarState = cookieStore.get("sidebar:state")?.value;
  const defaultOpen = sidebarState !== "false"; // Default to open if not explicitly closed

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset>
        <main className="min-h-screen p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
