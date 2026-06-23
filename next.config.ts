import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export — required for Capacitor to bundle into native iOS/Android app
  output: "export",
  trailingSlash: true,
  images: {
    // Static export does not support Next.js Image Optimization
    unoptimized: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
