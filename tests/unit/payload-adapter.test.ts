import { describe, expect, it } from "vitest";
import {
  lexicalToRichText,
  toArticle,
  toBrandGuide,
  toMenu,
  toPage,
  toSiteSettings,
  type LexicalRoot,
} from "@/content/adapters/payload/normalize";
import pages from "@/content/adapters/mock/data/pages.json";

const lexical: LexicalRoot = {
  root: {
    children: [
      {
        type: "heading",
        tag: "h2",
        children: [{ type: "text", text: "Tre ting avgjør", format: 0 }],
      },
      {
        type: "paragraph",
        children: [
          { type: "text", text: "Det er ikke ", format: 0 },
          { type: "text", text: "domeneautoritet", format: 1 },
          { type: "text", text: " som avgjør. Les ", format: 0 },
          {
            type: "link",
            fields: { url: "https://example.com" },
            children: [{ type: "text", text: "kilden", format: 0 }],
          },
          { type: "text", text: ".", format: 0 },
        ],
      },
      {
        type: "list",
        listType: "bullet",
        children: [
          {
            type: "listitem",
            children: [{ type: "text", text: "Navngitte fagpersoner", format: 0 }],
          },
          {
            type: "listitem",
            children: [
              { type: "text", text: "Originale ", format: 0 },
              { type: "text", text: "data", format: 2 },
            ],
          },
        ],
      },
      { type: "quote", children: [{ type: "text", text: "Et sitat.", format: 0 }] },
      {
        type: "upload",
        value: { url: "/media/bilde.jpg", alt: "Et bilde", width: 1200, height: 800 },
      },
    ],
  },
};

describe("Payload: Lexical → RichText", () => {
  it("oversetter overskrift, avsnitt med marks og lenke, liste, sitat og bilde", () => {
    const rt = lexicalToRichText(lexical);
    expect(rt[0]).toMatchObject({ style: "h2" });
    const p = rt[1];
    if (p._type !== "block") throw new Error();
    expect(p.children.find((c) => c.marks.includes("strong"))?.text).toBe(
      "domeneautoritet",
    );
    expect(p.children.find((c) => c.href)?.href).toBe("https://example.com");
    expect(rt[2]).toMatchObject({ listItem: "bullet" });
    const em = rt[3];
    if (em._type !== "block") throw new Error();
    expect(em.children.some((c) => c.marks.includes("em"))).toBe(true);
    expect(rt[4]).toMatchObject({ style: "blockquote" });
    expect(rt[5]).toMatchObject({ _type: "image", image: { width: 1200 } });
  });

  it("tåler tomt dokument", () => {
    expect(lexicalToRichText(null)).toEqual([]);
    expect(lexicalToRichText({ root: { children: [] } })).toEqual([]);
  });
});

describe("Payload: dokumenter", () => {
  const now = "2026-11-10T09:00:00.000Z";

  it("side med JSON-blokker normaliseres og ugyldige blokker droppes", () => {
    const p = toPage({
      id: 1,
      slug: "forside",
      title: "Hjem",
      blocks: [...pages[0].blocks, { _type: "ukjent" }],
      seo: { noindex: false },
      status: "published",
      createdAt: now,
      updatedAt: now,
    });
    expect(p.blocks).toHaveLength(pages[0].blocks.length);
    expect(p.status).toBe("published");
  });

  it("artikkel med relasjoner (objekt og id) og media med fokuspunkt", () => {
    const a = toArticle({
      id: 10,
      slug: "test",
      title: "Test",
      summary: "Kort svar.",
      image: {
        url: "/media/x.jpg",
        alt: "x",
        width: 1600,
        height: 900,
        focalX: 25,
        focalY: 75,
      },
      author: { id: 5, slug: "p", name: "P", createdAt: now, updatedAt: now },
      publishedAt: now,
      categories: [3, { id: 4 }],
      body: lexical,
      sources: [{ label: "Kilde", href: "https://example.com" }],
      status: "published",
      createdAt: now,
      updatedAt: now,
    });
    expect(a.authorId).toBe("5");
    expect(a.categoryIds).toEqual(["3", "4"]);
    expect(a.image?.focal).toEqual({ x: 0.25, y: 0.75 });
    expect(a.sources[0].external).toBe(true);
  });

  it("globals: innstillinger, menyer og profilmanual", () => {
    const s = toSiteSettings({
      name: "AD.Moment",
      description: "Beskrivelse",
      contact: { id: "x", email: "a@b.no", orgNumber: "838 722 822", phone: null },
      social: [{ platform: "linkedin", url: "https://linkedin.com/company/x" }],
      sameAs: [{ value: "https://proff.no" }],
    });
    expect(s.contact).toEqual({ email: "a@b.no", orgNumber: "838 722 822" });
    expect(s.sameAs).toEqual(["https://proff.no"]);

    const m = toMenu("main", [
      { label: "A", href: "/a", children: [{ label: "B", href: "/a/b" }] },
    ]);
    expect(m.items[0].children[0].href).toBe("/a/b");

    const g = toBrandGuide({
      identity: {
        name: "AD.Moment",
        oneLiner: "x",
        purpose: "y",
        values: [{ value: "Åpenhet" }],
        audiences: [],
      },
      voice: { tone: [{ value: "Direkte" }], language: "nb", addressForm: "du" },
      facts: [{ claim: "Org.nr. 838 722 822", source: "Brreg", approved: true }],
      legal: { requiresApproval: [], forbiddenTopics: [] },
      updatedAt: now,
    });
    expect(g?.identity.values).toEqual(["Åpenhet"]);
    expect(g?.facts[0].claim).toContain("838");
    expect(toBrandGuide(null)).toBeNull();
  });
});
