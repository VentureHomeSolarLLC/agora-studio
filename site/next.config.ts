import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server mode for auth support
  // output: "export",
  // distDir: "dist",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
