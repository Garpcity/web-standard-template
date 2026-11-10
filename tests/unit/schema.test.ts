import { describe, expect, it } from "vitest";
import { block, page, article, brandGuide } from "@/content/schema";
import {
  blocksToPuck,
  puckToBlocks,
  plainToRichText,
  richTextToPlain,
} from "@/puck/convert";
import { canEditField, lockedBlockFields, roleCan } from "@/content/permissions";
import pages from "@/content/adapters/mock/data/pages.json";
import articles from "@/content/adapters/mock/data/articles.json";
import guide from "@/content/adapters/mock/data/brand-guide.json";

describe("innholdsskjema", () => {
  it("validerer seed-innholdet", () => {
    for (const p of pages) expect(() => page.parse(p)).not.toThrow();
    for (const a of articles) expect(() => article.parse(a)).not.toThrow();
    expect(() => brandGuide.parse(guide)).not.toThrow();
  });

  it("avviser ugyldig slug", () => {
    expect(() => page.parse({ ...pages[0], slug: "Stor Bokstav" })).toThrow();
  });

  it("gir standardverdier på blokker", () => {
    const b = block.parse({ _type: "hero", id: "x", heading: "Hei" });
    expect(b._type === "hero" && b.layout).toBe("split");
    expect(b.tone).toBe("default");
  });

  it("krever minst ett spørsmål i FAQ", () => {
    expect(() => block.parse({ _type: "faq", id: "f", items: [] })).toThrow();
  });
});

describe("puck-konvertering", () => {
  it("er tapsfri frem og tilbake", () => {
    const original = page.parse(pages[0]);
    const data = blocksToPuck(original);
    const back = puckToBlocks(data);
    expect(back.title).toBe(original.title);
    expect(back.blocks).toEqual(original.blocks);
  });

  it("oversetter enkel tekst til RichText og tilbake", () => {
    const src = "## Overskrift\n\nAvsnitt én.\n\n- Punkt A\n\n- Punkt B\n\n> Sitat";
    const rt = plainToRichText(src);
    expect(rt[0]).toMatchObject({ style: "h2" });
    expect(rt[2]).toMatchObject({ listItem: "bullet" });
    expect(richTextToPlain(rt)).toBe(src);
  });
});

describe("rettigheter", () => {
  it("låser utseende-felt for redaktører, ikke for owner", () => {
    expect(canEditField("editor", "hero", "heading")).toBe(true);
    expect(canEditField("editor", "hero", "tone")).toBe(false);
    expect(canEditField("owner", "hero", "tone")).toBe(true);
  });

  it("lar aldri agent publisere", () => {
    expect(roleCan.agent.publish).toBe(false);
    expect(roleCan.editor.publish).toBe(false);
    expect(roleCan.admin.publish).toBe(true);
  });

  it("har låste felt definert for alle blokker", () => {
    const types = [
      "hero",
      "text",
      "textImage",
      "cardGrid",
      "people",
      "latestArticles",
      "gallery",
      "quote",
      "faq",
      "contactForm",
      "embed",
      "cta",
      "stats",
    ];
    for (const t of types) expect(lockedBlockFields[t]).toBeDefined();
  });
});

describe("siteUrl", () => {
  it("prefikser relative stier og lar absolutte være", async () => {
    const { siteUrl } = await import("@/lib/utils");
    expect(siteUrl("/x")).toMatch(/^https?:\/\/.+\/x$/);
    expect(siteUrl("https://cdn.example/a.png")).toBe("https://cdn.example/a.png");
  });
});

describe("applyLockedFields", () => {
  it("fjerner låste felt for editor, beholder verdi fra eksisterende blokk, lar owner være", async () => {
    const { applyLockedFields, lockedBlockFields } =
      await import("@/content/permissions");
    const locked = lockedBlockFields.hero[0];
    const incoming = [{ id: "b1", _type: "hero", heading: "Ny", [locked]: "hacket" }];
    const existing = [{ id: "b1", _type: "hero", [locked]: "original" }];
    expect(
      (applyLockedFields("editor", incoming, existing)[0] as Record<string, unknown>)[
        locked
      ],
    ).toBe("original");
    expect(
      (applyLockedFields("editor", incoming, [])[0] as Record<string, unknown>)[locked],
    ).toBeUndefined();
    expect(
      (applyLockedFields("agent", incoming, existing)[0] as Record<string, unknown>)[
        locked
      ],
    ).toBe("original");
    expect(
      (applyLockedFields("owner", incoming, existing)[0] as Record<string, unknown>)[
        locked
      ],
    ).toBe("hacket");
    expect(
      (applyLockedFields("editor", incoming, existing)[0] as Record<string, unknown>)
        .heading,
    ).toBe("Ny");
  });
});
