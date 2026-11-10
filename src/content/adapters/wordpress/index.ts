/**
 * WordPress-adapter (headless via WPGraphQL + site-core-plugin).
 *
 * Miljø: WORDPRESS_GRAPHQL_URL, WORDPRESS_REST_URL (valgfri, utledes),
 *        WORDPRESS_APP_USER + WORDPRESS_APP_PASSWORD (for lagring fra Puck),
 *        WORDPRESS_PREVIEW_SECRET.
 */
import { category, type Category, type Page } from "../../schema";
import type { ContentAdapter } from "../../types";
import { Q } from "./queries";
import {
  toArticle,
  toBrandGuide,
  toMenu,
  toPage,
  toPerson,
  toRedirects,
  toSiteSettings,
  type WpMenuItem,
  type WpPage,
  type WpPerson,
  type WpPost,
} from "./normalize";

type GraphQLFetcher = <T>(
  query: string,
  variables?: Record<string, unknown>,
) => Promise<T>;

export type WordPressAdapterOptions = {
  graphqlUrl: string;
  restUrl?: string;
  appUser?: string;
  appPassword?: string;
  /** Overstyr henting (tester). */
  fetcher?: GraphQLFetcher;
  /** Next.js cache-tag/revalidate. */
  revalidate?: number;
};

export function createGraphQLFetcher(url: string, revalidate = 60): GraphQLFetcher {
  return async <T>(query: string, variables?: Record<string, unknown>) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(8000),
      next: { revalidate, tags: ["wordpress"] },
    });
    if (!res.ok) throw new Error(`WPGraphQL ${res.status}: ${await res.text()}`);
    const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
    if (json.errors?.length)
      throw new Error(`WPGraphQL: ${json.errors.map((e) => e.message).join("; ")}`);
    return json.data as T;
  };
}

export function createWordPressAdapter(
  opts?: Partial<WordPressAdapterOptions>,
): ContentAdapter {
  const graphqlUrl = opts?.graphqlUrl ?? process.env.WORDPRESS_GRAPHQL_URL;
  if (!graphqlUrl) throw new Error("WORDPRESS_GRAPHQL_URL mangler i .env.local");
  const siteOrigin = new URL(graphqlUrl).origin;
  const restUrl =
    opts?.restUrl ?? process.env.WORDPRESS_REST_URL ?? `${siteOrigin}/wp-json`;
  const appUser = opts?.appUser ?? process.env.WORDPRESS_APP_USER;
  const appPassword = opts?.appPassword ?? process.env.WORDPRESS_APP_PASSWORD;
  const gql = opts?.fetcher ?? createGraphQLFetcher(graphqlUrl, opts?.revalidate);
  const frontendUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const locationEnum = (name: "main" | "footer" | "legal") => name.toUpperCase();

  return {
    name: "wordpress",

    async getSiteSettings() {
      const d = await gql<{
        settings: string | null;
        generalSettings: { title: string };
      }>(Q.settings);
      return toSiteSettings(d.settings, d.generalSettings.title);
    },

    async getMenu(name) {
      const d = await gql<{ menuItems: { nodes: WpMenuItem[] } }>(Q.menu, {
        location: locationEnum(name),
      });
      return toMenu(name, d.menuItems.nodes, frontendUrl);
    },

    async getPage(slug, o) {
      const d =
        slug === "forside"
          ? await gql<{ nodeByUri: WpPage | null }>(Q.frontPage).then((r) => ({
              page: r.nodeByUri,
            }))
          : await gql<{ page: WpPage | null }>(Q.pageBySlug, { slug });
      if (!d.page) return null;
      const p = toPage(d.page);
      if (p.status === "draft" && !o?.includeDrafts) return null;
      return p;
    },

    async getPages() {
      const d = await gql<{ pages: { nodes: WpPage[] } }>(Q.pages);
      return d.pages.nodes.map(toPage);
    },

    async getArticles(q = {}) {
      const first = Math.min(q.limit ?? 50, 100);
      const d = await gql<{ posts: { nodes: WpPost[] } }>(Q.posts, {
        first: first + (q.offset ?? 0),
        categoryId: q.categoryId ? Number(q.categoryId) : null,
        status: q.includeDrafts ? ["PUBLISH", "DRAFT"] : ["PUBLISH"],
      });
      return d.posts.nodes.slice(q.offset ?? 0, (q.offset ?? 0) + first).map(toArticle);
    },

    async getArticle(slug, o) {
      const d = await gql<{ post: WpPost | null }>(Q.postBySlug, { slug });
      if (!d.post) return null;
      const a = toArticle(d.post);
      if (a.status === "draft" && !o?.includeDrafts) return null;
      return a;
    },

    async getPeople(ids) {
      const d = await gql<{ people: { nodes: WpPerson[] } }>(Q.people);
      const all = d.people.nodes.map(toPerson);
      return ids && ids.length ? all.filter((p) => ids.includes(p.id)) : all;
    },

    async getPerson(id) {
      const d = await gql<{ person: WpPerson | null }>(Q.personById, { id });
      return d.person ? toPerson(d.person) : null;
    },

    async getCategories(): Promise<Category[]> {
      const d = await gql<{
        categories: {
          nodes: {
            databaseId: number;
            slug: string;
            name: string;
            description?: string | null;
          }[];
        };
      }>(Q.categories);
      return d.categories.nodes.map((c) =>
        category.parse({
          id: String(c.databaseId),
          slug: c.slug,
          name: c.name,
          description: c.description ?? undefined,
        }),
      );
    },

    async getRedirects() {
      const d = await gql<{ redirects: string | null }>(Q.settings);
      return toRedirects(d.redirects);
    },

    async getBrandGuide() {
      const d = await gql<{ brandGuide: string | null }>(Q.settings);
      return toBrandGuide(d.brandGuide);
    },

    async getPreviewContext(pathname) {
      return {
        enabled: false,
        editUrl: `${siteOrigin}/wp-admin/` + (pathname ? "" : ""),
      };
    },

    async savePage(p: Page) {
      // REST-endepunktet skriver rett i den publiserte siden og kjenner ikke status.
      // Utkast fra agenter (MCP) må derfor avvises til pluginen får egen utkastlagring.
      if (p.status === "draft")
        throw new Error(
          "WordPress-adapteren støtter ikke utkast via REST ennå. Bruk Payload for agentforslag, eller la redaktøren lime inn i Puck.",
        );
      if (!appUser || !appPassword)
        throw new Error("WORDPRESS_APP_USER/WORDPRESS_APP_PASSWORD mangler for lagring.");
      const res = await fetch(
        `${restUrl}/site-core/v1/pages/${encodeURIComponent(p.slug)}/blocks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Basic " + Buffer.from(`${appUser}:${appPassword}`).toString("base64"),
          },
          body: JSON.stringify({ blocks: p.blocks, title: p.title }),
        },
      );
      if (!res.ok) throw new Error(`WordPress REST ${res.status}: ${await res.text()}`);
    },
  };
}
