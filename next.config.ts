import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  experimental: {
    // Keep server action payloads below Vercel Function request limits.
    serverActions: {
      bodySizeLimit: "4mb",
    },
    proxyClientMaxBodySize: "4mb",
  },
};

export default nextConfig;
