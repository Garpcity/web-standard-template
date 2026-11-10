/**
 * Feilrapport fra frontend til Studio. Fire-and-forget, aldri i veien for svaret.
 * Krever STUDIO_URL, STUDIO_API_KEY og SITE_SLUG i miljøet; ellers bare console.error.
 */
export type ErrorReport = {
  metric: "server_error" | "cms_fallback";
  message: string;
  path?: string;
  detail?: Record<string, unknown>;
};

export function reportError(r: ErrorReport): void {
  console.error(`[${r.metric}] ${r.path ?? ""} ${r.message}`);
  const url = process.env.STUDIO_URL;
  const key = process.env.STUDIO_API_KEY;
  const siteSlug = process.env.SITE_SLUG;
  if (!url || !key || !siteSlug) return;
  void fetch(`${url.replace(/\/$/, "")}/api/metrics/ingest`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-studio-key": key },
    body: JSON.stringify({
      siteSlug,
      source: "frontend",
      metrics: [
        {
          metric: r.metric,
          value: 1,
          detail: { message: r.message.slice(0, 500), path: r.path, ...r.detail },
        },
      ],
    }),
    signal: AbortSignal.timeout(3000),
  }).catch(() => {});
}
