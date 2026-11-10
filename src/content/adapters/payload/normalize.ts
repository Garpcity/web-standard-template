/**
 * Normalisering fra Payload-dokumenter til kontrakten. Rene funksjoner.
 * Lexical (Payloads rik tekst) oversettes til RichText.
 */
import {
  article,
  block as blockSchema,
  brandGuide,
  menu,
  page,
  person,
  siteSettings,
  type Article,
  type Block,
  type BrandGuide,
  type ImageRef,
  type Menu,
  type Page,
  type Person,
  type RichText,
  type RichTextNode,
  type SiteSettings,
} from "../../schema";

/* ---------- Payload-former (bare det vi leser) ---------- */

export type PlMedia =
  | {
      url?: string | null;
      alt?: string | null;
      caption?: string | null;
      width?: number | null;
      height?: number | null;
      focalX?: number | null;
      focalY?: number | null;
    }
  | number
  | string
  | null
  | undefined;

type Rel<T> = T | number | string | null | undefined;
type StrArr = { value: string }[] | null | undefined;

export type PlSeo =
  | {
      title?: string | null;
      description?: string | null;
      image?: PlMedia;
      noindex?: boolean | null;
      canonical?: string | null;
    }
  | null
  | undefined;

export type PlPage = {
  id: number | string;
  slug: string;
  title: string;
  blocks?: unknown;
  seo?: PlSeo;
  status?: string | null;
  owner?: Rel<{ id: number | string }>;
  createdAt: string;
  updatedAt: string;
};

export type PlPerson = {
  id: number | string;
  slug: string;
  name: string;
  role?: string | null;
  image?: PlMedia;
  bio?: LexicalRoot | null;
  email?: string | null;
  phone?: string | null;
  knowsAbout?: StrArr;
  credentials?: StrArr;
  sameAs?: StrArr;
  status?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PlArticle = {
  id: number | string;
  slug: string;
  title: string;
  summary: string;
  image?: PlMedia;
  author: Rel<PlPerson>;
  publishedAt: string;
  categories?: Rel<{ id: number | string }>[] | null;
  body: LexicalRoot;
  sources?:
    | {
        label: string;
        href: string;
        external?: boolean | null;
        variant?: string | null;
      }[]
    | null;
  seo?: PlSeo;
  status?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PlMenuItem = {
  id?: string | null;
  label: string;
  href: string;
  external?: boolean | null;
  children?: { id?: string | null; label: string; href: string }[] | null;
};

/* ---------- Lexical ---------- */

export type LexicalNode = {
  type: string;
  tag?: string;
  text?: string;
  format?: number | string;
  listType?: "bullet" | "number" | "check";
  children?: LexicalNode[];
  fields?: { url?: string; newTab?: boolean; linkType?: string; doc?: unknown };
  value?:
    | { url?: string; alt?: string; width?: number; height?: number; caption?: string }
    | number;
  url?: string;
};
export type LexicalRoot = { root: { children: LexicalNode[] } };

const IS_BOLD = 1,
  IS_ITALIC = 2,
  IS_UNDERLINE = 8,
  IS_CODE = 16;

type Span = Extract<RichTextNode, { _type: "block" }>["children"][number];

function spansOf(nodes: LexicalNode[] | undefined, href?: string): Span[] {
  const out: Span[] = [];
  for (const n of nodes ?? []) {
    if (n.type === "text") {
      const f = typeof n.format === "number" ? n.format : 0;
      const marks: Span["marks"] = [];
      if (f & IS_BOLD) marks.push("strong");
      if (f & IS_ITALIC) marks.push("em");
      if (f & IS_UNDERLINE) marks.push("underline");
      if (f & IS_CODE) marks.push("code");
      if (n.text)
        out.push({ _type: "span", text: n.text, marks, ...(href ? { href } : {}) });
    } else if (n.type === "link" || n.type === "autolink") {
      out.push(...spansOf(n.children, n.fields?.url ?? n.url));
    } else if (n.type === "linebreak") {
      out.push({ _type: "span", text: "\n", marks: [] });
    } else if (n.children) {
      out.push(...spansOf(n.children, href));
    }
  }
  return out;
}

export function lexicalToRichText(doc: LexicalRoot | null | undefined): RichText {
  if (!doc?.root?.children) return [];
  const out: RichTextNode[] = [];
  const walk = (nodes: LexicalNode[], listType?: "bullet" | "number", level = 1) => {
    for (const n of nodes) {
      switch (n.type) {
        case "paragraph": {
          const children = spansOf(n.children);
          if (children.length) out.push({ _type: "block", style: "normal", children });
          break;
        }
        case "heading": {
          const tag = (n.tag ?? "h2") as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
          const style = tag === "h1" ? "h2" : tag === "h5" || tag === "h6" ? "h4" : tag;
          const children = spansOf(n.children);
          if (children.length) out.push({ _type: "block", style, children });
          break;
        }
        case "quote": {
          const children = spansOf(n.children);
          if (children.length)
            out.push({ _type: "block", style: "blockquote", children });
          break;
        }
        case "list":
          walk(n.children ?? [], n.listType === "number" ? "number" : "bullet", level);
          break;
        case "listitem": {
          const nested = (n.children ?? []).filter((c) => c.type === "list");
          const inline = (n.children ?? []).filter((c) => c.type !== "list");
          const children = spansOf(inline);
          if (children.length)
            out.push({
              _type: "block",
              style: "normal",
              listItem: listType ?? "bullet",
              level: Math.min(level, 3),
              children,
            });
          for (const sub of nested) walk([sub], listType, level + 1);
          break;
        }
        case "upload": {
          const img = toImageRef(n.value as PlMedia);
          if (img) out.push({ _type: "image", image: img });
          break;
        }
        default:
          if (n.children) walk(n.children, listType, level);
      }
    }
  };
  walk(doc.root.children);
  return out;
}

/* ---------- Hjelpere ---------- */

export function toImageRef(media: PlMedia): ImageRef | undefined {
  if (!media || typeof media !== "object" || !media.url) return undefined;
  return {
    url: media.url,
    alt: media.alt ?? "",
    width: media.width ?? 1600,
    height: media.height ?? 900,
    caption: media.caption ?? undefined,
    focal:
      typeof media.focalX === "number" && typeof media.focalY === "number"
        ? { x: media.focalX / 100, y: media.focalY / 100 }
        : undefined,
  };
}

const relId = (r: Rel<{ id: number | string }>): string =>
  r && typeof r === "object" ? String(r.id) : r == null ? "" : String(r);
const strs = (a: StrArr): string[] => (a ?? []).map((x) => x.value).filter(Boolean);
const seoOf = (s: PlSeo) => ({
  title: s?.title ?? undefined,
  description: s?.description ?? undefined,
  image: toImageRef(s?.image),
  noindex: s?.noindex ?? false,
  canonical: s?.canonical ?? undefined,
});

/* ---------- Dokumenter ---------- */

export function toPage(d: PlPage): Page {
  const raw = Array.isArray(d.blocks) ? (d.blocks as unknown[]) : [];
  const blocks: Block[] = raw.flatMap((b) => {
    const r = blockSchema.safeParse(b);
    return r.success ? [r.data] : [];
  });
  return page.parse({
    _type: "page",
    id: String(d.id),
    slug: d.slug,
    title: d.title,
    blocks,
    seo: seoOf(d.seo),
    status: d.status ?? "draft",
    ownerId: d.owner ? relId(d.owner) : undefined,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  });
}

export function toPerson(d: PlPerson): Person {
  return person.parse({
    _type: "person",
    id: String(d.id),
    slug: d.slug,
    name: d.name,
    role: d.role ?? undefined,
    image: toImageRef(d.image),
    bio: lexicalToRichText(d.bio),
    email: d.email ?? undefined,
    phone: d.phone ?? undefined,
    knowsAbout: strs(d.knowsAbout),
    credentials: strs(d.credentials),
    sameAs: strs(d.sameAs),
    status: d.status ?? "draft",
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  });
}

export function toArticle(d: PlArticle): Article {
  return article.parse({
    _type: "article",
    id: String(d.id),
    slug: d.slug,
    title: d.title,
    summary: d.summary,
    image: toImageRef(d.image),
    authorId: relId(d.author as Rel<{ id: number | string }>),
    publishedAt: d.publishedAt,
    categoryIds: (d.categories ?? []).map(relId).filter(Boolean),
    body: lexicalToRichText(d.body),
    sources: (d.sources ?? []).map((s) => ({
      label: s.label,
      href: s.href,
      external: s.external ?? true,
      variant: (s.variant as "ghost") ?? "ghost",
    })),
    seo: seoOf(d.seo),
    status: d.status ?? "draft",
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  });
}

export function toMenu(name: Menu["name"], items: PlMenuItem[] | null | undefined): Menu {
  return menu.parse({
    name,
    items: (items ?? []).map((i, idx) => ({
      id: i.id ?? `${name}-${idx}`,
      label: i.label,
      href: i.href,
      external: i.external ?? false,
      children: (i.children ?? []).map((c, j) => ({
        id: c.id ?? `${name}-${idx}-${j}`,
        label: c.label,
        href: c.href,
      })),
    })),
  });
}

export function toSiteSettings(g: Record<string, unknown>): SiteSettings {
  const d = g as {
    name?: string;
    tagline?: string | null;
    description?: string;
    logo?: PlMedia;
    logoDark?: PlMedia;
    defaultSeo?: PlSeo;
    contact?: Record<string, string | null>;
    social?: { platform: string; url: string }[] | null;
    footerText?: string | null;
    sameAs?: StrArr;
  };
  return siteSettings.parse({
    name: d.name ?? "Nettsted",
    tagline: d.tagline ?? undefined,
    description: d.description ?? d.name ?? "",
    logo: toImageRef(d.logo),
    logoDark: toImageRef(d.logoDark),
    defaultSeo: seoOf(d.defaultSeo),
    contact: Object.fromEntries(
      Object.entries(d.contact ?? {}).filter(([k, v]) => k !== "id" && v),
    ),
    social: d.social ?? [],
    footerText: d.footerText ?? undefined,
    sameAs: strs(d.sameAs),
  });
}

export function toBrandGuide(
  g: Record<string, unknown> | null | undefined,
): BrandGuide | null {
  if (!g || !(g as { identity?: unknown }).identity) return null;
  const d = g as Record<string, Record<string, unknown>> & {
    updatedAt?: string;
    version?: string;
  };
  const arr = (v: unknown) => strs(v as StrArr);
  const r = brandGuide.safeParse({
    identity: {
      ...d.identity,
      values: arr(d.identity?.values),
      audiences: arr(d.identity?.audiences),
    },
    voice: {
      ...d.voice,
      tone: arr(d.voice?.tone),
      useWords: arr(d.voice?.useWords),
      avoidWords: arr(d.voice?.avoidWords),
      goodExamples: arr(d.voice?.goodExamples),
      badExamples: arr(d.voice?.badExamples),
    },
    facts: (
      (d.facts as unknown as {
        claim: string;
        source?: string | null;
        approved?: boolean | null;
      }[]) ?? []
    ).map((f) => ({
      claim: f.claim,
      source: f.source ?? undefined,
      approved: f.approved ?? true,
    })),
    neverClaim: arr(d.neverClaim),
    channels: ((d.channels as unknown as Record<string, unknown>[]) ?? []).map((c) => ({
      name: c.name,
      format: c.format,
      maxLength: c.maxLength ?? undefined,
      frequency: c.frequency ?? undefined,
      hashtags: arr(c.hashtags),
    })),
    legal: {
      requiresApproval: arr(d.legal?.requiresApproval),
      forbiddenTopics: arr(d.legal?.forbiddenTopics),
      imageRights: (d.legal?.imageRights as string | null) ?? undefined,
    },
    version: d.version ?? "1.0.0",
    updatedAt: d.updatedAt ?? new Date().toISOString(),
  });
  return r.success ? r.data : null;
}
