/**
 * seed.ts – importerer mock-innholdet til Payload via lokalt API.
 * Kalles fra scripts/seed-payload.mts (Node 24) eller POST /api/seed i utvikling.
 *
 * Oppretter første bruker (owner) hvis ingen finnes: SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Payload } from "payload";
import type { RichText } from "@/content/schema";
import { richTextToLexical } from "./lexical";

const dataDir = path.join(process.cwd(), "src/content/adapters/mock/data");
const read = async <T>(f: string): Promise<T> =>
  JSON.parse(await fs.readFile(path.join(dataDir, f), "utf8")) as T;
const arr = (xs: string[] | undefined) => (xs ?? []).map((value) => ({ value }));

async function upload(
  payload: Payload,
  file: string,
  alt: string,
  cache: Map<string, number | string>,
) {
  if (cache.has(file)) return cache.get(file)!;
  const abs = path.join(process.cwd(), "public", file);
  const data = await fs.readFile(abs);
  const existing = await payload.find({
    collection: "media",
    where: { alt: { equals: alt } },
    limit: 1,
  });
  if (existing.docs[0]) {
    cache.set(file, existing.docs[0].id);
    return existing.docs[0].id;
  }
  const doc = await payload.create({
    collection: "media",
    data: { alt },
    file: {
      data,
      name: path.basename(file),
      mimetype: "image/svg+xml",
      size: data.byteLength,
    },
  });
  cache.set(file, doc.id);
  return doc.id;
}

export async function seedPayload(
  payload: Payload,
  log: (m: string) => void = console.log,
) {
  const media = new Map<string, number | string>();
  const img = async (ref?: { url: string; alt: string }) =>
    ref ? await upload(payload, ref.url, ref.alt || ref.url, media) : undefined;

  // Første bruker
  const users = await payload.find({
    collection: "users",
    limit: 1,
    overrideAccess: true,
  });
  if (users.totalDocs === 0) {
    await payload.create({
      collection: "users",
      data: {
        email: process.env.SEED_ADMIN_EMAIL ?? "admin@example.com",
        password: process.env.SEED_ADMIN_PASSWORD ?? "change-me-now",
        name: "Owner",
        role: "owner",
      },
      overrideAccess: true,
    });
    log("→ Owner-bruker opprettet");
  }

  // Globals
  const site = await read<
    Record<string, unknown> & {
      logo?: { url: string; alt: string };
      defaultSeo?: { image?: { url: string; alt: string } };
      sameAs?: string[];
    }
  >("site.json");
  await payload.updateGlobal({
    slug: "site-settings",
    data: {
      ...site,
      logo: await img(site.logo),
      defaultSeo: {
        ...(site.defaultSeo ?? {}),
        image: await img(site.defaultSeo?.image),
      },
      sameAs: arr(site.sameAs),
    } as never,
    overrideAccess: true,
  });
  const menus = await read<{ name: string; items: unknown[] }[]>("menus.json");
  await payload.updateGlobal({
    slug: "menus",
    data: Object.fromEntries(menus.map((m) => [m.name, m.items])) as never,
    overrideAccess: true,
  });
  const guide = await read<
    Record<string, Record<string, unknown>> & {
      neverClaim?: string[];
      channels?: Record<string, unknown>[];
      version?: string;
    }
  >("brand-guide.json");
  await payload.updateGlobal({
    slug: "brand-guide",
    data: {
      version: guide.version,
      identity: {
        ...guide.identity,
        values: arr(guide.identity.values as string[]),
        audiences: arr(guide.identity.audiences as string[]),
      },
      voice: {
        ...guide.voice,
        tone: arr(guide.voice.tone as string[]),
        useWords: arr(guide.voice.useWords as string[]),
        avoidWords: arr(guide.voice.avoidWords as string[]),
        goodExamples: arr(guide.voice.goodExamples as string[]),
        badExamples: arr(guide.voice.badExamples as string[]),
      },
      facts: guide.facts,
      neverClaim: arr(guide.neverClaim),
      channels: (guide.channels ?? []).map((c) => ({
        ...c,
        hashtags: arr(c.hashtags as string[]),
      })),
      legal: {
        requiresApproval: arr(guide.legal.requiresApproval as string[]),
        forbiddenTopics: arr(guide.legal.forbiddenTopics as string[]),
        imageRights: guide.legal.imageRights,
      },
    } as never,
    overrideAccess: true,
  });
  log("→ Globals");

  // Kategorier
  const catMap = new Map<string, number | string>();
  for (const c of await read<
    { id: string; slug: string; name: string; description?: string }[]
  >("categories.json")) {
    const ex = await payload.find({
      collection: "categories",
      where: { slug: { equals: c.slug } },
      limit: 1,
    });
    const doc =
      ex.docs[0] ??
      (await payload.create({
        collection: "categories",
        data: { name: c.name, slug: c.slug, description: c.description },
      }));
    catMap.set(c.id, doc.id);
  }

  // Personer
  const personMap = new Map<string, number | string>();
  type SeedPerson = {
    id: string;
    slug: string;
    name: string;
    role?: string;
    email?: string;
    image?: { url: string; alt: string };
    bio: RichText;
    knowsAbout: string[];
    credentials: string[];
    sameAs: string[];
  };
  for (const p of await read<SeedPerson[]>("people.json")) {
    const ex = await payload.find({
      collection: "people",
      where: { slug: { equals: p.slug } },
      limit: 1,
    });
    const data = {
      name: p.name,
      slug: p.slug,
      role: p.role,
      email: p.email,
      image: await img(p.image),
      bio: richTextToLexical(p.bio),
      knowsAbout: arr(p.knowsAbout),
      credentials: arr(p.credentials),
      sameAs: arr(p.sameAs),
      status: "published",
    } as never;
    const doc = ex.docs[0]
      ? await payload.update({ collection: "people", id: ex.docs[0].id, data })
      : await payload.create({ collection: "people", data });
    personMap.set(p.id, doc.id);
  }
  log(`→ Personer: ${personMap.size}`);

  // Sider
  for (const pg of await read<
    { slug: string; title: string; blocks: unknown[]; seo: Record<string, unknown> }[]
  >("pages.json")) {
    const ex = await payload.find({
      collection: "pages",
      where: { slug: { equals: pg.slug } },
      limit: 1,
    });
    const data = {
      title: pg.title,
      slug: pg.slug,
      blocks: pg.blocks,
      seo: { ...pg.seo, image: undefined },
      status: "published",
    } as never;
    if (ex.docs[0])
      await payload.update({ collection: "pages", id: ex.docs[0].id, data });
    else await payload.create({ collection: "pages", data });
  }
  log("→ Sider");

  // Artikler
  for (const a of await read<
    {
      slug: string;
      title: string;
      summary: string;
      image?: { url: string; alt: string };
      authorId: string;
      publishedAt: string;
      categoryIds: string[];
      body: RichText;
      sources: unknown[];
      seo: Record<string, unknown>;
    }[]
  >("articles.json")) {
    const ex = await payload.find({
      collection: "articles",
      where: { slug: { equals: a.slug } },
      limit: 1,
    });
    const data = {
      title: a.title,
      slug: a.slug,
      summary: a.summary,
      image: await img(a.image),
      author: personMap.get(a.authorId),
      publishedAt: a.publishedAt,
      categories: a.categoryIds.map((c) => catMap.get(c)).filter(Boolean),
      body: richTextToLexical(a.body),
      sources: a.sources,
      seo: { ...a.seo, image: undefined },
      status: "published",
    } as never;
    if (ex.docs[0])
      await payload.update({ collection: "articles", id: ex.docs[0].id, data });
    else await payload.create({ collection: "articles", data });
  }
  log("→ Artikler");

  // Redirects
  for (const r of await read<{ from: string; to: string; permanent: boolean }[]>(
    "redirects.json",
  )) {
    const ex = await payload.find({
      collection: "redirects",
      where: { from: { equals: r.from } },
      limit: 1,
    });
    if (!ex.docs[0]) await payload.create({ collection: "redirects", data: r });
  }

  log("Payload seed ferdig. Admin: /admin");
}
