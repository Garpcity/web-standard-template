/**
 * Mock-adapter: leser innhold fra JSON-filer i ./data.
 * Brukes i template, i tester og når frontend utvikles uten CMS.
 * Puck-editoren lagrer tilbake til ./data/pages.json i utvikling.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  article,
  brandGuide,
  category,
  menu,
  page,
  person,
  redirect,
  siteSettings,
} from "../../schema";
import type { ContentAdapter } from "../../types";

const dataDir = path.join(process.cwd(), "src/content/adapters/mock/data");

async function readJson<T>(file: string, schema: z.ZodType<T>): Promise<T> {
  const raw = await fs.readFile(path.join(dataDir, file), "utf8");
  return schema.parse(JSON.parse(raw));
}

const pagesFile = z.array(page);
const articlesFile = z.array(article);
const peopleFile = z.array(person);
const categoriesFile = z.array(category);
const menusFile = z.array(menu);
const redirectsFile = z.array(redirect);

export function createMockAdapter(): ContentAdapter {
  return {
    name: "mock",

    getSiteSettings: () => readJson("site.json", siteSettings),

    async getMenu(name) {
      const menus = await readJson("menus.json", menusFile);
      return menus.find((m) => m.name === name) ?? { name, items: [] };
    },

    async getPage(slug, opts) {
      const pages = await readJson("pages.json", pagesFile);
      const found = pages.find((p) => p.slug === slug);
      if (!found) return null;
      if (found.status === "draft" && !opts?.includeDrafts) return null;
      return found;
    },

    async getPages() {
      const pages = await readJson("pages.json", pagesFile);
      return pages.filter((p) => p.status === "published");
    },

    async getArticles(query = {}) {
      const all = await readJson("articles.json", articlesFile);
      let list = all
        .filter((a) => query.includeDrafts || a.status === "published")
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
      if (query.categoryId)
        list = list.filter((a) => a.categoryIds.includes(query.categoryId!));
      const offset = query.offset ?? 0;
      const limit = query.limit ?? list.length;
      return list.slice(offset, offset + limit);
    },

    async getArticle(slug, opts) {
      const all = await readJson("articles.json", articlesFile);
      const found = all.find((a) => a.slug === slug);
      if (!found) return null;
      if (found.status === "draft" && !opts?.includeDrafts) return null;
      return found;
    },

    async getPeople(ids) {
      const all = await readJson("people.json", peopleFile);
      if (!ids || ids.length === 0) return all;
      return all.filter((p) => ids.includes(p.id));
    },

    async getPerson(id) {
      const all = await readJson("people.json", peopleFile);
      return all.find((p) => p.id === id || p.slug === id) ?? null;
    },

    getCategories: () => readJson("categories.json", categoriesFile),
    getRedirects: () => readJson("redirects.json", redirectsFile),

    async getBrandGuide() {
      try {
        return await readJson("brand-guide.json", brandGuide);
      } catch {
        return null;
      }
    },

    async getPreviewContext(pathname) {
      return {
        enabled: false,
        editUrl: `/edit${pathname === "/" ? "/forside" : pathname}`,
      };
    },

    async savePage(next) {
      const pages = await readJson("pages.json", pagesFile);
      const idx = pages.findIndex((p) => p.slug === next.slug);
      const validated = page.parse({ ...next, updatedAt: new Date().toISOString() });
      if (idx === -1) pages.push(validated);
      else pages[idx] = validated;
      await fs.writeFile(
        path.join(dataDir, "pages.json"),
        JSON.stringify(pages, null, 2) + "\n",
      );
    },
  };
}
