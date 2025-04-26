import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    // ถ้ายังเจอปัญหา ลองใช้ remotePatterns แทน
    domains: [
      "lh3.googleusercontent.com",
      "googleusercontent.com",
      "storage.googleapis.com",
      "avatars.githubusercontent.com",
      "cdn.discordapp.com",
      "images.unsplash.com",
      "i.imgur.com",
    ],
    // หรือก็คอนฟิกแบบละเอียดด้วย remotePatterns
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
