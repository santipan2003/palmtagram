"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import { LogIn, Chrome, Facebook } from "lucide-react";
import { useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    contactInfo: "",
    password: "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

 const handleSubmit = async (e: FormEvent) => {
   e.preventDefault();
   const resp = await fetch("/api/login", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify(formData),
   });
   if (resp.ok) {
     // หลังเซ็ต cookie แล้ว ให้ push กลับ root
     router.push("/");
     // หรือถ้าต้องการให้ SSR รีเฟรช server component:
     // router.refresh()
   } else {
     // แสดง error message
     const { error } = await resp.json();
     alert(error);
   }
 };

  return (
    <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 space-y-6">
      {/* Header */}
      <div className="text-center">
        <Image
          src="/img/logo.png"
          alt="Palmtagram Logo"
          width={150}
          height={50}
          className="mx-auto"
        />
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
          Connect with friends
        </p>
      </div>

      {/* Form */}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <Input
            type="text"
            name="contactInfo"
            placeholder="+66 123 456 7890 or email"
            value={formData.contactInfo}
            onChange={handleChange}
            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>
        <div>
          <Input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>
        <div>
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            <LogIn className="mr-2 h-4 w-4" /> Log In
          </Button>
        </div>
      </form>

      {/* Social Logins */}
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
              Or continue with
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="flex items-center justify-center gap-2 rounded-lg border-gray-300 dark:border-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            asChild
          >
            <a href="#">
              <Chrome className="h-5 w-5" />
              Google
            </a>
          </Button>
          <Button
            variant="outline"
            className="flex items-center justify-center gap-2 rounded-lg border-gray-300 dark:border-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            asChild
          >
            <a href="#">
              <Facebook className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Facebook
            </a>
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm space-y-2">
        <p>
          <Link
            href="/register"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Don&apos;t have an account? Sign up
          </Link>
        </p>
        <p>
          <Link
            href="/forgot-password"
            className="text-gray-500 dark:text-gray-400 hover:underline"
          >
            Forgot password?
          </Link>
        </p>
      </div>
    </div>
  );
}
