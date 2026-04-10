/**
 * API Configuration
 *
 * Serverless-only setup:
 * - Uses Next.js Route Handlers (/api/*) for all backend requests
 * - Ignores local FastAPI backend paths
 */

const endpoints = {
  summarize: "/api/summarize",
  transcribe: "/api/transcribe",
} as const;

function stripTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function getServerBaseUrl() {
  if (typeof window !== "undefined") {
    return "";
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return stripTrailingSlash(process.env.NEXT_PUBLIC_APP_URL);
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export const API_CONFIG = {
  mode: "serverless" as const,
  endpoints,

  get baseUrl() {
    return getServerBaseUrl();
  },

  getUrl(endpoint: keyof typeof endpoints) {
    return `${this.baseUrl}${endpoints[endpoint]}`;
  },
};

if (process.env.NODE_ENV === "development") {
  console.log(`API Mode: ${API_CONFIG.mode} (${API_CONFIG.baseUrl})`);
}
