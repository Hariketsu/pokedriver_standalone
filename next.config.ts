import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Cloudflare Pages (build -> out/)
  output: "export",

  // Optimize for static client-side app
  images: {
    unoptimized: true, // We use base64 icons, no Next.js image optimization needed
  },

  // Compress large data files
  experimental: {
    optimizePackageImports: ["zustand"],
  },
};

export default nextConfig;
