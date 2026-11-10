import { getArticles, getBrandGuide, getPages, getSiteSettings } from "@/content";
import { siteUrl } from "@/lib/utils";

export const dynamic = "force-static";

/**
 * llms.txt – kort, maskinlesbar oversikt for AI-crawlere og agenter.
 * Genereres fra innholdet og profilmanualen. Spesifikasjon: llmstxt.org.
 */
export async function GET() {
  const [settings, pages, articles, guide] = await Promise.all([
    getSiteSettings(),
    getPages(),
    getArticles(),
    getBrandGuide(),
  ]);

  const lines: string[] = [];
  lines.push(`# ${settings.name}`);
  lines.push("");
  lines.push(`> ${guide?.identity.oneLiner ?? settings.tagline ?? settings.description}`);
  lines.push("");
  lines.push(settings.description);
  if (guide?.facts.length) {
    lines.push("");
    lines.push("## Fakta");
    for (const f of guide.facts.filter((x) => x.approved)) {
      lines.push(`- ${f.claim}${f.source ? ` (kilde: ${f.source})` : ""}`);
    }
  }
  lines.push("");
  lines.push("## Sider");
  for (const p of pages.filter((x) => !x.seo.noindex)) {
    const path = p.slug === "forside" ? "/" : `/${p.slug}`;
    lines.push(
      `- [${p.title}](${siteUrl(path)})${p.seo.description ? `: ${p.seo.description}` : ""}`,
    );
  }
  lines.push("");
  lines.push("## Artikler");
  for (const a of articles) {
    lines.push(
      `- [${a.title}](${siteUrl(`/artikler/${a.slug}`)}): ${a.summary.slice(0, 160)}`,
    );
  }
  lines.push("");
  lines.push("## Kontakt");
  if (settings.contact.email) lines.push(`- E-post: ${settings.contact.email}`);
  if (settings.contact.orgNumber) lines.push(`- Org.nr.: ${settings.contact.orgNumber}`);
  lines.push(`- Sitemap: ${siteUrl("/sitemap.xml")}`);

  return new Response(lines.join("\n") + "\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
