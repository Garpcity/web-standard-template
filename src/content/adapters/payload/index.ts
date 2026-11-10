/**
 * Payload-adapter. Bygges i fase 4 – pilot B.
 *
 * Plan:
 * - Payload 3.x installeres i samme Next.js-app under src/app/(payload).
 * - Collections genereres fra Zod-skjemaene (generated/payload/).
 * - Denne adapteren bruker Payloads lokale API (ingen nettverkskall).
 * - Puck-JSON lagres i feltet `blocks` på Page.
 */
import type { ContentAdapter } from "../../types";

export function createPayloadAdapter(): ContentAdapter {
  const notReady = () => {
    throw new Error("Payload-adapteren er ikke implementert ennå (fase 4).");
  };
  return {
    name: "payload",
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
