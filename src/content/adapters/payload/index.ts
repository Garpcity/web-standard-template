/**
 * Payload-adapter. Bruker Payloads lokale API – ingen nettverkskall.
 * Payload kjører i samme Next.js-app (src/app/(payload)); admin på /admin.
 */
import type { Payload, Where } from "payload";
import {
  category,
  socialPost,
  type Article,
  type Category,
  type Page,
  type SocialPost,
} from "../../schema";
import type { ContentAdapter } from "../../types";
import { richTextToLexical } from "@/payload/lexical";
import {
  toArticle,
  toBrandGuide,
  toMenu,
  toPage,
  toPerson,
  toSiteSettings,
  type PlArticle,
  type PlMenuItem,
  type PlPage,
  type PlPerson,
} from "./normalize";

async function loadPayload(): Promise<Payload> {
  const [{ getPayload }, { default: config }] = await Promise.all([
    import("payload"),
    import("@payload-config"),
  ]);
  return getPayload({ config });
}

export function createPayloadAdapter(opts?: { payload?: Payload }): ContentAdapter {
  const get = async () => opts?.payload ?? (await loadPayload());
  const published = { status: { equals: "published" } } as const;

  return {
    name: "payload",

    async getSiteSettings() {
      const p = await get();
      const g = (await p.findGlobal({ slug: "site-settings", depth: 1 })) as Record<
        string,
        unknown
      >;
      return toSiteSettings(g);
    },

    async getMenu(name) {
      const p = await get();
      const g = (await p.findGlobal({ slug: "menus", depth: 0 })) as Record<
        string,
        PlMenuItem[] | undefined
      >;
      return toMenu(name, g[name]);
    },

    async getPage(slug, o) {
      const p = await get();
      const res = await p.find({
        collection: "pages",
        where: o?.includeDrafts
          ? { slug: { equals: slug } }
          : { and: [{ slug: { equals: slug } }, published] },
        limit: 1,
        depth: 1,
        overrideAccess: true,
      });
      const doc = res.docs[0] as PlPage | undefined;
      return doc ? toPage(doc) : null;
    },

    async getPages() {
      const p = await get();
      const res = await p.find({
        collection: "pages",
        where: published,
        limit: 500,
        depth: 1,
        overrideAccess: true,
      });
      return (res.docs as PlPage[]).map(toPage);
    },

    async getArticles(q = {}) {
      const p = await get();
      const where: Where[] = [];
      if (!q.includeDrafts) where.push(published);
      if (q.categoryId) where.push({ categories: { contains: q.categoryId } });
      const res = await p.find({
        collection: "articles",
        where: where.length ? { and: where } : {},
        sort: "-publishedAt",
        limit: q.limit ?? 50,
        page: q.offset && q.limit ? Math.floor(q.offset / q.limit) + 1 : 1,
        depth: 1,
        overrideAccess: true,
      });
      return (res.docs as PlArticle[]).map(toArticle);
    },

    async getArticle(slug, o) {
      const p = await get();
      const res = await p.find({
        collection: "articles",
        where: o?.includeDrafts
          ? { slug: { equals: slug } }
          : { and: [{ slug: { equals: slug } }, published] },
        limit: 1,
        depth: 1,
        overrideAccess: true,
      });
      const doc = res.docs[0] as PlArticle | undefined;
      return doc ? toArticle(doc) : null;
    },

    async getPeople(ids) {
      const p = await get();
      const res = await p.find({
        collection: "people",
        where: ids && ids.length ? { and: [published, { id: { in: ids } }] } : published,
        limit: 200,
        depth: 1,
        overrideAccess: true,
      });
      return (res.docs as PlPerson[]).map(toPerson);
    },

    async getPerson(id) {
      const p = await get();
      const res = await p.find({
        collection: "people",
        where: { or: [{ id: { equals: id } }, { slug: { equals: id } }] },
        limit: 1,
        depth: 1,
        overrideAccess: true,
      });
      const doc = res.docs[0] as PlPerson | undefined;
      return doc ? toPerson(doc) : null;
    },

    async getCategories(): Promise<Category[]> {
      const p = await get();
      const res = await p.find({
        collection: "categories",
        limit: 200,
        depth: 0,
        overrideAccess: true,
      });
      return (
        res.docs as {
          id: number | string;
          slug: string;
          name: string;
          description?: string | null;
        }[]
      ).map((c) =>
        category.parse({
          id: String(c.id),
          slug: c.slug,
          name: c.name,
          description: c.description ?? undefined,
        }),
      );
    },

    async getRedirects() {
      const p = await get();
      const res = await p.find({
        collection: "redirects",
        limit: 500,
        depth: 0,
        overrideAccess: true,
      });
      return (
        res.docs as unknown as { from: string; to: string; permanent?: boolean | null }[]
      ).map((r) => ({
        from: r.from,
        to: r.to,
        permanent: r.permanent ?? true,
      }));
    },

    async getBrandGuide() {
      const p = await get();
      const g = (await p.findGlobal({ slug: "brand-guide", depth: 0 })) as Record<
        string,
        unknown
      >;
      return toBrandGuide(g);
    },

    async getPreviewContext(pathname) {
      return {
        enabled: false,
        editUrl: `/admin/collections/pages?where[slug][equals]=${encodeURIComponent(pathname.replace(/^\//, "") || "forside")}`,
      };
    },

    async savePage(next: Page) {
      const p = await get();
      const existing = await p.find({
        collection: "pages",
        where: { slug: { equals: next.slug } },
        limit: 1,
        overrideAccess: true,
      });
      const data = {
        title: next.title,
        slug: next.slug,
        blocks: next.blocks,
        seo: next.seo,
        status: next.status,
      };
      if (existing.docs[0]) {
        await p.update({
          collection: "pages",
          id: existing.docs[0].id,
          data,
          overrideAccess: true,
        });
      } else {
        await p.create({ collection: "pages", data, overrideAccess: true });
      }
    },

    async saveArticle(a: Article) {
      const p = await get();
      const existing = await p.find({
        collection: "articles",
        where: { slug: { equals: a.slug } },
        limit: 1,
        overrideAccess: true,
      });
      const people = await p.find({
        collection: "people",
        where: { or: [{ id: { equals: a.authorId } }, { slug: { equals: a.authorId } }] },
        limit: 1,
        overrideAccess: true,
      });
      const data = {
        title: a.title,
        slug: a.slug,
        summary: a.summary,
        author: people.docs[0]?.id,
        publishedAt: a.publishedAt,
        body: richTextToLexical(a.body),
        sources: a.sources,
        seo: { ...a.seo, image: undefined },
        status: a.status,
        agentMeta: a.agentMeta,
      } as never;
      if (existing.docs[0])
        await p.update({
          collection: "articles",
          id: existing.docs[0].id,
          data,
          overrideAccess: true,
        });
      else await p.create({ collection: "articles", data, overrideAccess: true });
    },

    async saveSocialPost(post: SocialPost) {
      const p = await get();
      const existing = await p.find({
        collection: "social-posts",
        where: { slug: { equals: post.slug } },
        limit: 1,
        overrideAccess: true,
      });
      const data = {
        slug: post.slug,
        channel: post.channel,
        text: post.text,
        hashtags: post.hashtags.map((value) => ({ value })),
        sourceSlug: post.sourceSlug,
        scheduledFor: post.scheduledFor,
        status: post.status,
        agentMeta: post.agentMeta,
      } as never;
      if (existing.docs[0])
        await p.update({
          collection: "social-posts",
          id: existing.docs[0].id,
          data,
          overrideAccess: true,
        });
      else await p.create({ collection: "social-posts", data, overrideAccess: true });
    },

    async getSocialPosts() {
      const p = await get();
      const res = await p.find({
        collection: "social-posts",
        limit: 200,
        depth: 0,
        overrideAccess: true,
        sort: "-updatedAt",
      });
      return (res.docs as unknown as Record<string, unknown>[]).map((d) =>
        socialPost.parse({
          _type: "socialPost",
          id: String(d.id),
          slug: d.slug,
          channel: d.channel,
          text: d.text,
          hashtags: ((d.hashtags as { value: string }[]) ?? []).map((h) => h.value),
          sourceSlug: d.sourceSlug ?? undefined,
          scheduledFor: d.scheduledFor ?? undefined,
          agentMeta: d.agentMeta ?? undefined,
          status: d.status ?? "draft",
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
        }),
      );
    },
  };
}
