"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import { UserPlus, Chrome, Facebook, Eye, EyeOff } from "lucide-react";
import { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import zxcvbn from "zxcvbn";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    contactInfo: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Check password strength when password field changes
    if (name === "password" && value) {
      const result = zxcvbn(value);
      setPasswordStrength(result.score);
      setPasswordFeedback(result.feedback.suggestions[0] || "");
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Basic validation
    if (!formData.username || !formData.contactInfo || !formData.password) {
      alert("Please fill in all fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    // In a real app, you would call an API to register the user here
    console.log("Registration successful", formData);

    // Redirect to login page
    router.push("/login");
  };

  // Password strength indicator colors and labels
  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 0:
        return "bg-red-500";
      case 1:
        return "bg-orange-500";
      case 2:
        return "bg-yellow-500";
      case 3:
        return "bg-blue-500";
      case 4:
        return "bg-green-500";
      default:
        return "bg-gray-300";
    }
  };

  const getStrengthLabel = () => {
    switch (passwordStrength) {
      case 0:
        return "Very Weak";
      case 1:
        return "Weak";
      case 2:
        return "Fair";
      case 3:
        return "Good";
      case 4:
        return "Strong";
      default:
        return "";
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
          Join the community
        </p>
      </div>

      {/* Form */}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <Input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>
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
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500 transition-all pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {formData.password && (
          <div className="space-y-1">
            <div className="flex gap-1 h-1">
              <div
                className={`h-full w-1/5 rounded-sm ${
                  passwordStrength >= 0 ? getStrengthColor() : "bg-gray-300"
                }`}
              ></div>
              <div
                className={`h-full w-1/5 rounded-sm ${
                  passwordStrength >= 1 ? getStrengthColor() : "bg-gray-300"
                }`}
              ></div>
              <div
                className={`h-full w-1/5 rounded-sm ${
                  passwordStrength >= 2 ? getStrengthColor() : "bg-gray-300"
                }`}
              ></div>
              <div
                className={`h-full w-1/5 rounded-sm ${
                  passwordStrength >= 3 ? getStrengthColor() : "bg-gray-300"
                }`}
              ></div>
              <div
                className={`h-full w-1/5 rounded-sm ${
                  passwordStrength >= 4 ? getStrengthColor() : "bg-gray-300"
                }`}
              ></div>
            </div>
            <div className="flex justify-between text-xs">
              <span>{getStrengthLabel()}</span>
              {passwordFeedback && (
                <span className="text-gray-500 dark:text-gray-400">
                  {passwordFeedback}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="relative">
          <Input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            placeholder="Repeat password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500 transition-all pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400"
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div>
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            <UserPlus className="mr-2 h-4 w-4" /> Sign Up
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
              Or sign up with
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
      <div className="text-center text-sm">
        <p>
          <Link
            href="/login"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Already have an account? Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
