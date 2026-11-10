import { expect, test } from "@playwright/test";

/** Testdomene-vern: feil Host → noindex; kanonisk host → ingen noindex. */
test("ukjent host får X-Robots-Tag noindex, kanonisk host får det ikke", async ({
  request,
  baseURL,
}) => {
  const canonical = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? baseURL!).host;
  const preview = await request.get("/", { headers: { host: "kunde.preikestol.no" } });
  expect(preview.headers()["x-robots-tag"]).toContain("noindex");
  const real = await request.get("/", { headers: { host: canonical } });
  expect(real.headers()["x-robots-tag"]).toBeUndefined();
});
