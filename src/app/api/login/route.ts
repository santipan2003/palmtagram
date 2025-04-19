// app/api/login/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { contactInfo, password } = await req.json();
  // TODO: เช็ค username/password จริงจังตามระบบคุณ
  const isValid = contactInfo === "demo" && password === "demo";
  if (!isValid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // ถ้าสำเร็จ ให้เซ็ต cookie httpOnly
  const res = NextResponse.json({ success: true });
  res.cookies.set("token", "some-generated-token", {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
  return res;
}
