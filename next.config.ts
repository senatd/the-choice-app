import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export — required for Capacitor to bundle into native iOS/Android app
  output: "export",
  trailingSlash: true,
  images: {
    // Static export does not support Next.js Image Optimization
    unoptimized: true,
  },
};

export default nextConfig;
