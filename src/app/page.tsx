// app/page.tsx  (Server Component)
import { cookies } from "next/headers";
import LoginPage from "@/components/auth/login/login-page";
import FeedPage from "@/components/feed/feed-page";
import AuthLayout from "./(auth)/layout";
import MainLayout from "./(main)/layout";

export default async function RootPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token)
    return (
      <AuthLayout>
        <LoginPage />
      </AuthLayout>
    );
  return (
    <MainLayout>
      <FeedPage />
    </MainLayout>
  );
}
