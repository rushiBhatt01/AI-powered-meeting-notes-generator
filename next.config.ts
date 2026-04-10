import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: process.cwd(),
  },
  env: {
    NEXT_PUBLIC_VERCEL_BLOB_API_URL:
      process.env.NEXT_PUBLIC_VERCEL_BLOB_API_URL ??
      process.env.VERCEL_BLOB_API_URL ??
      "https://vercel.com/api/blob",
    NEXT_PUBLIC_VERCEL_BLOB_PROXY_THROUGH_ALTERNATIVE_API:
      process.env.NEXT_PUBLIC_VERCEL_BLOB_PROXY_THROUGH_ALTERNATIVE_API ??
      process.env.VERCEL_BLOB_PROXY_THROUGH_ALTERNATIVE_API ??
      "1",
  },

  experimental: {
    // Keep server action payloads below Vercel Function request limits.
    serverActions: {
      bodySizeLimit: "4mb",
    },
    proxyClientMaxBodySize: "4mb",
  },
};

export default nextConfig;
