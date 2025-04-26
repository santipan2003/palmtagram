// app/(auth)/layout.tsx

import type React from "react";
import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Palmtagram",
  description: "A modern social media platform",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
      {children}
    </div>
  );
}
