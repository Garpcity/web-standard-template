/**
 * Én funksjon for «innholdet endret seg» – kalles fra Payload-hooks (samme prosess) og
 * fra /api/revalidate (WordPress-pluginen). Reglene for hvilke ruter som påvirkes bor her,
 * ikke i hvert CMS.
 */
import { revalidatePath, revalidateTag } from "next/cache";

export type ContentKind =
  | "page"
  | "article"
  | "person"
  | "category"
  | "media"
  | "settings"
  | "menu"
  | "brandGuide"
  | "redirect"
  | "all";

export function revalidateContent(kind: ContentKind, slug?: string): string[] {
  const paths = new Set<string>();
  const add = (p: string) => paths.add(p);
  switch (kind) {
    case "page":
      add(slug && slug !== "forside" ? `/${slug}` : "/");
      add("/sitemap.xml");
      add("/llms.txt");
      break;
    case "article":
      if (slug) add(`/artikler/${slug}`);
      add("/artikler");
      add("/"); // latestArticles-blokk
      add("/sitemap.xml");
      add("/llms.txt");
      break;
    case "person":
    case "category":
    case "media":
    case "redirect":
    case "all":
      add("/");
      break;
    case "settings":
    case "menu":
      add("/");
      add("/llms.txt");
      break;
    case "brandGuide":
      add("/profil");
      add("/llms.txt");
      break;
  }
  // Personer, kategorier, media, innstillinger og meny vises i layout/mange sider → hele treet.
  const layoutWide = [
    "person",
    "category",
    "media",
    "settings",
    "menu",
    "redirect",
    "all",
  ];
  if (layoutWide.includes(kind)) revalidatePath("/", "layout");
  for (const p of paths) revalidatePath(p);
  revalidateTag("wordpress", "max");
  return [...paths];
}
