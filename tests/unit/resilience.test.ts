import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/report-error", () => ({ reportError: vi.fn() }));

describe("withLastKnownGood", () => {
  it("serverer sist kjente verdi når CMS feiler, og kaster hvis ingen finnes", async () => {
    const { withLastKnownGood } = await import("@/lib/resilience");
    const { reportError } = await import("@/lib/report-error");
    await expect(
      withLastKnownGood("k1", async () => {
        throw new Error("nede");
      }),
    ).rejects.toThrow("nede");
    expect(await withLastKnownGood("k1", async () => "ok")).toBe("ok");
    expect(
      await withLastKnownGood("k1", async () => {
        throw new Error("nede igjen");
      }),
    ).toBe("ok");
    expect(reportError).toHaveBeenCalledWith(
      expect.objectContaining({ metric: "cms_fallback", message: "nede igjen" }),
    );
  });
});

describe("reportError", () => {
  it("poster server_error til Studio når miljøet er satt, ellers bare logger", async () => {
    vi.resetModules();
    vi.doUnmock("@/lib/report-error");
    const calls: { url: string; body: unknown }[] = [];
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      calls.push({ url, body: JSON.parse(String(init.body)) });
      return new Response("{}");
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { reportError } = await import("@/lib/report-error");
    reportError({ metric: "server_error", message: "x", path: "/y" });
    expect(calls).toHaveLength(0);
    process.env.STUDIO_URL = "http://studio.test/";
    process.env.STUDIO_API_KEY = "k";
    process.env.SITE_SLUG = "kunde";
    reportError({ metric: "server_error", message: "boom", path: "/y" });
    expect(calls[0].url).toBe("http://studio.test/api/metrics/ingest");
    expect(calls[0].body).toMatchObject({
      siteSlug: "kunde",
      metrics: [
        { metric: "server_error", value: 1, detail: { message: "boom", path: "/y" } },
      ],
    });
    vi.unstubAllGlobals();
  });
});
