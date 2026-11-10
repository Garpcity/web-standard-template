/**
 * WordPress-adapter (headless via WPGraphQL). Bygges i fase 3 – pilot A.
 *
 * Plan:
 * - Core-plugin i ./wordpress/plugins/site-core registrerer post types og felter
 *   generert fra Zod-skjemaene (ACF Local JSON i generated/acf/).
 * - Denne adapteren henter via WORDPRESS_GRAPHQL_URL og normaliserer til kontrakten:
 *   Gutenberg-blokker -> Block[], HTML -> RichText[], media -> ImageRef.
 * - Forhåndsvisning via WORDPRESS_PREVIEW_SECRET.
 */
import type { ContentAdapter } from "../../types";

export function createWordPressAdapter(): ContentAdapter {
  const url = process.env.WORDPRESS_GRAPHQL_URL;
  if (!url) throw new Error("WORDPRESS_GRAPHQL_URL mangler i .env.local");
  const notReady = () => {
    throw new Error("WordPress-adapteren er ikke implementert ennå (fase 3).");
  };
  return {
    name: "wordpress",
    getSiteSettings: notReady,
    getMenu: notReady,
    getPage: notReady,
    getPages: notReady,
    getArticles: notReady,
    getArticle: notReady,
    getPeople: notReady,
    getPerson: notReady,
    getCategories: notReady,
    getRedirects: notReady,
    getBrandGuide: notReady,
    getPreviewContext: notReady,
  };
}
