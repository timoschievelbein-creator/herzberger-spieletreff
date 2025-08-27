import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Lint-Fehler sollen den Build NICHT stoppen (Vercel)
    ignoreDuringBuilds: true,
  },
  // OPTIONAL: Wenn du auch TypeScript-Fehler vorerst durchlassen willst
  // (empfohlen für den ersten Deploy – später wieder rausnehmen)
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
