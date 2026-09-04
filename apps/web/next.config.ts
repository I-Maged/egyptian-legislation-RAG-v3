import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@egyptian-law/rag",
    "@egyptian-law/db",
    "@egyptian-law/core",
    "@egyptian-law/ingestion",
    "@egyptian-law/generation",
    "@egyptian-law/evaluation",
  ],
};

export default nextConfig;
