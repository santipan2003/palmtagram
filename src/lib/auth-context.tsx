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
            if (response.status === 401) {
              router.push("/login");
              return;
            }
            throw new Error("Failed to fetch profile");
          }

          const data = await response.json();
          setUser(data);
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
    } else {
      setIsLoading(false);
    }
  }, [token, router, initialUser]);

  const logout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: "GET",
        credentials: "include",
      });
      document.cookie =
        "access_token=; Max-Age=0; path=/; secure; sameSite=strict";
      setUser(null);
      router.push("/");
    } catch {
      setError("Failed to logout");
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
