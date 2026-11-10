/**
 * Normalisering fra WordPress/WPGraphQL til kontrakten.
 * Rene funksjoner – testes med fixtures uten nettverk.
 */
import {
  article,
  block as blockSchema,
  brandGuide,
  menu,
  page,
  person,
  redirect,
  siteSettings,
  type Article,
  type Block,
  type BrandGuide,
  type ImageRef,
  type Menu,
  type Page,
  type Person,
  type Redirect,
  type RichText,
  type RichTextNode,
  type SiteSettings,
} from "../../schema";
import { z } from "zod";

/* ---------- WPGraphQL-former (bare det vi leser) ---------- */

export type WpMedia = {
  sourceUrl?: string | null;
  altText?: string | null;
  caption?: string | null;
  mediaDetails?: { width?: number | null; height?: number | null } | null;
} | null;

export type WpSeo = {
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoNoindex?: boolean | null;
  seoCanonical?: string | null;
  seoImage?: WpMedia;
};

export type WpPage = WpSeo & {
  databaseId: number;
  slug: string;
  title: string;
  status: string;
  date: string;
  modified: string;
  siteBlocks?: string | null;
  isFrontPage?: boolean;
};

export type WpPost = WpSeo & {
  databaseId: number;
  slug: string;
  title: string;
  status: string;
  date: string;
  modified: string;
  content?: string | null;
  summary?: string | null;
  sources?: string | null;
  featuredImage?: { node: WpMedia } | null;
  author?: { node: { databaseId: number; slug: string } } | null;
  categories?: { nodes: { databaseId: number; slug: string; name: string }[] } | null;
};

export type WpPerson = {
  databaseId: number;
  slug: string;
  title: string;
  status: string;
  date: string;
  modified: string;
  content?: string | null;
  featuredImage?: { node: WpMedia } | null;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  knowsAbout?: string | null;
  credentials?: string | null;
  sameAs?: string | null;
};

export type WpMenuItem = {
  databaseId: number;
  label: string;
  url: string;
  target?: string | null;
  parentDatabaseId?: number | null;
};

/* ---------- Hjelpere ---------- */

function toIso(wpDate: string): string {
  // WPGraphQL gir "2026-11-10T09:00:00" uten sone. Vi tolker som UTC.
  const d = new Date(
    wpDate.endsWith("Z") || /[+-]\d\d:\d\d$/.test(wpDate) ? wpDate : `${wpDate}Z`,
  );
  return isNaN(d.getTime()) ? new Date(0).toISOString() : d.toISOString();
}

function parseJson<T>(
  raw: string | null | undefined,
  schema: z.ZodType<T>,
  fallback: T,
): T {
  if (!raw) return fallback;
  try {
    return schema.parse(JSON.parse(raw));
  } catch {
    return fallback;
  }
}

export function toImageRef(media: WpMedia): ImageRef | undefined {
  if (!media?.sourceUrl) return undefined;
  return {
    url: media.sourceUrl,
    alt: media.altText ?? "",
    width: media.mediaDetails?.width ?? 1600,
    height: media.mediaDetails?.height ?? 900,
    caption: media.caption ? stripTags(media.caption).trim() || undefined : undefined,
  };
}

export function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ""));
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#822[01];/g, '"')
    .replace(/&#821[67];/g, "'")
    .replace(/&hellip;|&#8230;/g, "…")
    .replace(/&laquo;/g, "«")
    .replace(/&raquo;/g, "»");
}

/* ---------- HTML -> RichText ---------- */

type Span = Extract<RichTextNode, { _type: "block" }>["children"][number];

/** Oversetter innholdet i ett blokk-element (p, h2, li …) til spans med marks og lenker. */
function inlineToSpans(html: string): Span[] {
  const spans: Span[] = [];
  const re = /<(\/?)(strong|b|em|i|code|u|a)\b([^>]*)>|<br\s*\/?>/gi;
  const marks: Span["marks"] = [];
  let href: string | undefined;
  let last = 0;
  let m: RegExpExecArray | null;

  const push = (text: string) => {
    const t = decodeEntities(text.replace(/<[^>]+>/g, ""));
    if (!t) return;
    spans.push({ _type: "span", text: t, marks: [...marks], ...(href ? { href } : {}) });
  };

  while ((m = re.exec(html))) {
    push(html.slice(last, m.index));
    last = re.lastIndex;
    if (m[0].toLowerCase().startsWith("<br")) {
      spans.push({ _type: "span", text: "\n", marks: [] });
      continue;
    }
    const closing = m[1] === "/";
    const tag = m[2].toLowerCase();
    const mark = (
      {
        strong: "strong",
        b: "strong",
        em: "em",
        i: "em",
        code: "code",
        u: "underline",
      } as const
    )[tag as "strong" | "b" | "em" | "i" | "code" | "u"];
    if (tag === "a") {
      href = closing ? undefined : (m[3].match(/href="([^"]*)"/i)?.[1] ?? undefined);
    } else if (mark) {
      if (closing) {
        const i = marks.lastIndexOf(mark);
        if (i >= 0) marks.splice(i, 1);
      } else marks.push(mark);
    }
  }
  push(html.slice(last));
  return spans;
}

/**
 * Konverterer Gutenberg-/WordPress-HTML til normalisert RichText.
 * Dekker p, h2–h4, ul/ol, blockquote, figure/img. Ukjente tagger blir avsnitt.
 */
export function htmlToRichText(html: string | null | undefined): RichText {
  if (!html) return [];
  const out: RichTextNode[] = [];
  const cleaned = html.replace(/<!--[\s\S]*?-->/g, "").trim();
  const blockRe =
    /<(h[2-4]|p|blockquote|ul|ol|figure)\b[^>]*>([\s\S]*?)<\/\1>|<img\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  let last = 0;

  const textBlock = (
    style: "normal" | "h2" | "h3" | "h4" | "blockquote",
    inner: string,
  ) => {
    const children = inlineToSpans(inner);
    if (children.length) out.push({ _type: "block", style, children });
  };
  const imgNode = (imgHtml: string, caption?: string) => {
    const src = imgHtml.match(/src="([^"]*)"/i)?.[1];
    if (!src) return;
    const w = Number(imgHtml.match(/width="(\d+)"/i)?.[1] ?? 1600);
    const h = Number(imgHtml.match(/height="(\d+)"/i)?.[1] ?? 900);
    out.push({
      _type: "image",
      image: {
        url: src,
        alt: imgHtml.match(/alt="([^"]*)"/i)?.[1] ?? "",
        width: w,
        height: h,
        caption,
      },
    });
  };

  while ((m = blockRe.exec(cleaned))) {
    const stray = cleaned.slice(last, m.index).trim();
    if (stray) textBlock("normal", stray);
    last = blockRe.lastIndex;
    const tag = (m[1] ?? "img").toLowerCase();
    const inner = m[2] ?? "";
    switch (tag) {
      case "p":
        textBlock("normal", inner);
        break;
      case "h2":
      case "h3":
      case "h4":
        textBlock(tag, inner);
        break;
      case "blockquote":
        textBlock("blockquote", inner.replace(/<\/?p[^>]*>/gi, " "));
        break;
      case "ul":
      case "ol": {
        const liRe = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
        let li: RegExpExecArray | null;
        while ((li = liRe.exec(inner))) {
          const children = inlineToSpans(li[1]);
          if (children.length)
            out.push({
              _type: "block",
              style: "normal",
              listItem: tag === "ol" ? "number" : "bullet",
              level: 1,
              children,
            });
        }
        break;
      }
      case "figure": {
        const img = inner.match(/<img\b[^>]*>/i)?.[0];
        const cap = inner.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i)?.[1];
        if (img) imgNode(img, cap ? stripTags(cap).trim() : undefined);
        break;
      }
      case "img":
        imgNode(m[0]);
        break;
    }
  }
  const tail = cleaned.slice(last).trim();
  if (tail) textBlock("normal", tail);
  return out;
}

/* ---------- Dokumenter ---------- */

function seoOf(n: WpSeo) {
  return {
    title: n.seoTitle ?? undefined,
    description: n.seoDescription ?? undefined,
    image: toImageRef(n.seoImage ?? null),
    noindex: n.seoNoindex ?? false,
    canonical: n.seoCanonical ?? undefined,
  };
}

export function toPage(n: WpPage): Page {
  const raw = parseJson(n.siteBlocks, z.array(z.unknown()), [] as unknown[]);
  const blocks: Block[] = raw.flatMap((b) => {
    const r = blockSchema.safeParse(b);
    return r.success ? [r.data] : [];
  });
  return page.parse({
    _type: "page",
    id: String(n.databaseId),
    slug: n.isFrontPage ? "forside" : n.slug,
    title: n.title,
    status: n.status === "publish" ? "published" : "draft",
    createdAt: toIso(n.date),
    updatedAt: toIso(n.modified),
    blocks,
    seo: seoOf(n),
  });
}

export function toArticle(n: WpPost): Article {
  const linkRef = z.object({
    label: z.string(),
    href: z.string(),
    external: z.boolean().optional(),
    variant: z.string().optional(),
  });
  const sources = parseJson(n.sources, z.array(linkRef), []);
  return article.parse({
    _type: "article",
    id: String(n.databaseId),
    slug: n.slug,
    title: n.title,
    status: n.status === "publish" ? "published" : "draft",
    createdAt: toIso(n.date),
    updatedAt: toIso(n.modified),
    publishedAt: toIso(n.date),
    summary: n.summary?.trim() || stripTags(n.content ?? "").slice(0, 300) || n.title,
    image: toImageRef(n.featuredImage?.node ?? null),
    authorId: String(n.author?.node.databaseId ?? ""),
    categoryIds: (n.categories?.nodes ?? []).map((c) => String(c.databaseId)),
    body: htmlToRichText(n.content),
    sources: sources.map((s) => ({
      ...s,
      external: s.external ?? true,
      variant: (s.variant as "ghost") ?? "ghost",
    })),
    seo: seoOf(n),
  });
}

export function toPerson(n: WpPerson): Person {
  const strings = z.array(z.string());
  return person.parse({
    _type: "person",
    id: String(n.databaseId),
    slug: n.slug,
    name: n.title,
    status: n.status === "publish" ? "published" : "draft",
    createdAt: toIso(n.date),
    updatedAt: toIso(n.modified),
    role: n.role ?? undefined,
    image: toImageRef(n.featuredImage?.node ?? null),
    bio: htmlToRichText(n.content),
    email: n.email || undefined,
    phone: n.phone || undefined,
    knowsAbout: parseJson(n.knowsAbout, strings, []),
    credentials: parseJson(n.credentials, strings, []),
    sameAs: parseJson(n.sameAs, strings, []),
  });
}

export function toMenu(name: Menu["name"], items: WpMenuItem[], siteUrl: string): Menu {
  const rel = (url: string) => {
    try {
      const u = new URL(url, siteUrl);
      const external = !u.href.startsWith(siteUrl) && !url.startsWith("/");
      return {
        href: external ? u.href : u.pathname + u.search + u.hash || "/",
        external,
      };
    } catch {
      return { href: url, external: false };
    }
  };
  const top = items.filter((i) => !i.parentDatabaseId);
  return menu.parse({
    name,
    items: top.map((i) => ({
      id: String(i.databaseId),
      label: i.label,
      ...rel(i.url),
      children: items
        .filter((c) => c.parentDatabaseId === i.databaseId)
        .map((c) => ({
          id: String(c.databaseId),
          label: c.label,
          href: rel(c.url).href,
        })),
    })),
  });
}

export function toSiteSettings(
  raw: string | null | undefined,
  fallbackName: string,
): SiteSettings {
  const parsed = parseJson(raw, siteSettings, null as SiteSettings | null);
  return (
    parsed ??
    siteSettings.parse({
      name: fallbackName,
      description: fallbackName,
      contact: {},
      defaultSeo: { noindex: false },
    })
  );
}

export function toBrandGuide(raw: string | null | undefined): BrandGuide | null {
  return parseJson(raw, brandGuide, null as BrandGuide | null);
}

export function toRedirects(raw: string | null | undefined): Redirect[] {
  return parseJson(raw, z.array(redirect), []);
}
