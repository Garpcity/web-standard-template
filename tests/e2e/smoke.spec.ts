import { expect, test } from "@playwright/test";

test.describe("Sidetyper", () => {
  test("forsiden rendrer med hero, JSON-LD og uten konsollfeil", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Desktop: hovedmeny synlig. Mobil: menyknapp synlig.
    const nav = page.getByRole("navigation", { name: "Hovedmeny" });
    const burger = page.getByRole("button", { name: /meny/i });
    await expect(nav.or(burger).first()).toBeVisible();
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(ld.some((s) => s.includes('"Organization"'))).toBe(true);
    expect(ld.some((s) => s.includes('"FAQPage"'))).toBe(true);
    expect(errors).toEqual([]);
  });

  test("innhold er synlig uten JavaScript", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Det vi leverer" })).toBeVisible();
    await ctx.close();
  });

  test("artikkel har kort svar, forfatter og Article-skjema", async ({ page }) => {
    await page.goto("/artikler");
    await page
      .getByRole("link", { name: /sitert av AI/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/artikler\/slik-blir/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(ld.some((s) => s.includes('"Article"') && s.includes('"author"'))).toBe(true);
  });

  test("kontaktskjema sender og viser takk", async ({ page }) => {
    await page.goto("/kontakt");
    await page.getByLabel(/Navn/).fill("Test Person");
    await page.getByLabel(/E-post/).fill("test@example.com");
    await page.getByLabel(/Hva kan vi hjelpe med/).fill("Hei, dette er en test.");
    await page.getByRole("button", { name: /Send melding/ }).click();
    await expect(page.getByRole("status")).toContainText(/Takk/);
  });

  test("404 gir egen side", async ({ page }) => {
    const res = await page.goto("/finnes-ikke");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: /finnes ikke/ })).toBeVisible();
  });

  test("robots, sitemap og llms.txt finnes", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(await robots.text()).toContain("GPTBot");
    const sitemap = await request.get("/sitemap.xml");
    expect(await sitemap.text()).toContain("/artikler");
    const llms = await request.get("/llms.txt");
    expect(await llms.text()).toContain("# ");
  });
});
