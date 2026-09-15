import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for the small production Docker image: `next build` emits
  // `apps/web/.next/standalone/server.js` with only the files needed at
  // runtime (no devDeps, no source tree).
  output: "standalone",
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
