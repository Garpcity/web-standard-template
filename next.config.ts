import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig: NextConfig = {
  output: "standalone",
  // Payload laster drizzle-kit dynamisk (skjema-push). Fil-sporingen ser det ikke, så vi tvinger
  // pakken med i standalone-bygget (Docker). pnpm: både symlinken og den reelle mappen.
  serverExternalPackages: ["drizzle-kit"],
  outputFileTracingIncludes: {
    "/**": ["./node_modules/drizzle-kit/**", "./node_modules/.pnpm/drizzle-kit@*/**"],
  },
  reactStrictMode: true,
  // Next 16 vil generere AGENTS.md selv; vår er håndskrevet og er kilden.
  agentRules: false,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default withPayload(nextConfig);
