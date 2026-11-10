import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/utils";
import { siteConfig } from "../../site.config";

/**
 * Standard: alle AI-crawlere slippes inn (vi optimaliserer for synlighet).
 * Endres i site.config.ts etter beslutning fra kunden.
 */
export default function robots(): MetadataRoute.Robots {
  const disallow = ["/edit", "/api/"];
  const aiRules = siteConfig.aiCrawlers.agents.map((userAgent) => ({
    userAgent,
    ...(siteConfig.aiCrawlers.allow ? { allow: "/", disallow } : { disallow: "/" }),
  }));
  return {
    rules: [{ userAgent: "*", allow: "/", disallow }, ...aiRules],
    sitemap: siteUrl("/sitemap.xml"),
    host: siteUrl("/"),
  };
}
