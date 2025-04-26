// middleware.ts (วางที่ root ของโปรเจกต์)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;

  // ป้องกันการเข้าถึงหน้าที่ต้องการ auth ถ้าไม่มี token
  if (
    request.nextUrl.pathname.startsWith("/feed") ||
    request.nextUrl.pathname.startsWith("/profile")
  ) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // ตรวจสอบความถูกต้องของ token
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/profile`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // อนุญาตให้เข้าถึงหน้า login ถ้ามี token แล้ว
  if (request.nextUrl.pathname === "/login" && token) {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/profile`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        return NextResponse.redirect(new URL("/feed", request.url));
      }
    } catch {
      // ถ้า token ไม่ถูกต้อง อนุญาตให้เข้าถึงหน้า login
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"], // ใช้กับทุก path ยกเว้น static files
};
