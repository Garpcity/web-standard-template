import { expect, test } from "@playwright/test";

/**
 * Innhold må vises i produksjon rett etter redigering, uten ny deploy.
 * Kjører bare mot Payload (CMS_PROVIDER=payload): endrer tittel via REST og leser siden.
 */
test.describe("revalidering (Payload)", () => {
  test.skip(process.env.CMS_PROVIDER !== "payload", "krever Payload");

  test("endret tittel vises på /tjenester uten rebuild", async ({ request, page }) => {
    const login = await request.post("/api/users/login", {
      data: {
        email: process.env.SEED_ADMIN_EMAIL ?? "admin@example.com",
        password: process.env.SEED_ADMIN_PASSWORD ?? "Ci-passord-123",
      },
    });
    const { token } = (await login.json()) as { token: string };
    const headers = { Authorization: `JWT ${token}` };
    const found = await request.get("/api/pages?where[slug][equals]=tjenester", {
      headers,
    });
    const doc = ((await found.json()) as { docs: { id: string; title: string }[] })
      .docs[0];
    expect(doc).toBeTruthy();

    await page.goto("/tjenester"); // sørg for at siden er generert/cachet først
    const stamp = `Tjenester ${Date.now()}`;
    const upd = await request.patch(`/api/pages/${doc.id}`, {
      headers,
      data: { title: stamp },
    });
    expect(upd.ok()).toBeTruthy();

    await page.goto("/tjenester");
    await expect(page).toHaveTitle(
      new RegExp(stamp.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );

    await request.patch(`/api/pages/${doc.id}`, { headers, data: { title: doc.title } });
  });
});
