import type { MetadataRoute } from "next";
import { getArticles, getPages } from "@/content";
import { siteUrl } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, articles] = await Promise.all([getPages(), getArticles()]);
  const pageEntries = pages
    .filter((p) => !p.seo.noindex)
    .map((p) => ({
      url: siteUrl(p.slug === "forside" ? "/" : `/${p.slug}`),
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: p.slug === "forside" ? 1 : 0.7,
    }));
  const articleEntries = articles.map((a) => ({
    url: siteUrl(`/artikler/${a.slug}`),
    lastModified: a.updatedAt,
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));
  return [
    ...pageEntries,
    {
      url: siteUrl("/artikler"),
      lastModified: articles[0]?.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...articleEntries,
  ];
}
