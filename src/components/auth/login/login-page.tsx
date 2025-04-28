"use client";

import { Button } from "@/components/ui/button";
import { Chrome, Facebook } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { authService } from "@/services/auth/auth.service";

export default function LoginPage() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    // ใช้ authService แทนการเขียน URL โดยตรง
    window.location.href = authService.getOAuthURL("google");
    // ใช้ window.location.href แทน router.push เนื่องจากเป็นการนำทางไปยัง OAuth provider
  };

  const handleFacebookLogin = () => {
    setIsFacebookLoading(true);
    // ใช้ authService แทนการเขียน URL โดยตรง
    window.location.href = authService.getOAuthURL("facebook");
    // ใช้ window.location.href แทน router.push เนื่องจากเป็นการนำทางไปยัง OAuth provider
  };

  // Typewriter animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  const TypewriterText = ({ text }: { text: string }) => {
    return (
      <motion.span
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {text.split("").map((char, index) => (
          <motion.span key={index} variants={letterVariants}>
            {char}
          </motion.span>
        ))}
      </motion.span>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-md w-full bg-white dark:bg-black shadow-lg  rounded-2xl p-8 relative overflow-hidden"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center mb-2"
        >
          <Image
            src="/img/logo2.png"
            alt="App Logo"
            width={200}
            height={200}
            className="object-contain"
            priority
          />
        </motion.div>

        {/* Header with Typewriter Effect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mb-8"
        >
          <h1 className="text-xl md:text-3xl font-bold text-gray-800 dark:text-gray-50">
            <TypewriterText text="Welcome to Palmtagram" />
          </h1>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-300 mt-2">
            <TypewriterText text="Join your community with a single click" />
          </p>
        </motion.div>

        {/* Buttons */}
        <div className="flex flex-col gap-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-3 py-6 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
            >
              <Chrome className="h-6 w-6 text-red-500 dark:text-red-400" />
              <span className="font-medium">
                {isGoogleLoading ? "Connecting..." : "Continue with Google"}
              </span>
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-3 py-6 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleFacebookLogin}
              disabled={isFacebookLoading}
            >
              <Facebook className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <span className="font-medium">
                {isFacebookLoading ? "Connecting..." : "Continue with Facebook"}
              </span>
            </Button>
          </motion.div>
        </div>

        {/* Decorative Element */}
        <motion.div
          className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-200 dark:bg-indigo-800 opacity-20 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>
    </div>
  );
}
