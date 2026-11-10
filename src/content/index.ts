/**
 * Innholdslaget. Dette er den eneste grensen frontend kjenner.
 * Hvilken adapter som er aktiv velges med CMS_PROVIDER.
 */
import "server-only";
import { withLastKnownGood } from "@/lib/resilience";
import type { ContentAdapter } from "./types";

export type * from "./types";

let adapterPromise: Promise<ContentAdapter> | null = null;

async function loadAdapter(): Promise<ContentAdapter> {
  const provider = process.env.CMS_PROVIDER ?? "mock";
  switch (provider) {
    case "wordpress": {
      const mod = await import("./adapters/wordpress");
      return mod.createWordPressAdapter();
    }
    case "payload": {
      const mod = await import("./adapters/payload");
      return mod.createPayloadAdapter();
    }
    case "mock":
    default: {
      const mod = await import("./adapters/mock");
      return mod.createMockAdapter();
    }
  }
}

export function getAdapter(): Promise<ContentAdapter> {
  adapterPromise ??= loadAdapter();
  return adapterPromise;
}

export const getSiteSettings = async () =>
  withLastKnownGood("settings", async () => (await getAdapter()).getSiteSettings());
export const getMenu = async (name: "main" | "footer" | "legal") =>
  withLastKnownGood(`menu:${name}`, async () => (await getAdapter()).getMenu(name));
export const getPage = async (slug: string, opts?: { includeDrafts?: boolean }) =>
  (await getAdapter()).getPage(slug, opts);
export const getPages = async () => (await getAdapter()).getPages();
export const getArticles = async (query?: import("./types").ArticleQuery) =>
  (await getAdapter()).getArticles(query);
export const getArticle = async (slug: string, opts?: { includeDrafts?: boolean }) =>
  (await getAdapter()).getArticle(slug, opts);
export const getPeople = async (ids?: string[]) => (await getAdapter()).getPeople(ids);
export const getPerson = async (id: string) => (await getAdapter()).getPerson(id);
export const getCategories = async () => (await getAdapter()).getCategories();
export const getRedirects = async () => (await getAdapter()).getRedirects();
export const getBrandGuide = async () => (await getAdapter()).getBrandGuide();
export const getPreviewContext = async (path: string) =>
  (await getAdapter()).getPreviewContext(path);
export const savePage = async (page: import("./types").Page) => {
  const adapter = await getAdapter();
  if (!adapter.savePage)
    throw new Error(`Adapter '${adapter.name}' støtter ikke lagring.`);
  return adapter.savePage(page);
};
export const saveArticle = async (a: import("./types").Article) => {
  const adapter = await getAdapter();
  if (!adapter.saveArticle)
    throw new Error(`Adapter '${adapter.name}' støtter ikke lagring av artikler.`);
  return adapter.saveArticle(a);
};
export const saveSocialPost = async (p: import("./types").SocialPost) => {
  const adapter = await getAdapter();
  if (!adapter.saveSocialPost)
    throw new Error(`Adapter '${adapter.name}' støtter ikke sosiale poster.`);
  return adapter.saveSocialPost(p);
};
