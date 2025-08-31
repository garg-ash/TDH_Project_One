import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable Next.js dev indicators (removes the small "N" bubble in dev)
  devIndicators: {
    buildActivity: false,
    appIsrStatus: false,
  },
};

export default nextConfig;
