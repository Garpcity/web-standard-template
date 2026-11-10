import { describe, expect, it } from "vitest";
import {
  htmlToRichText,
  toArticle,
  toMenu,
  toPage,
  toPerson,
} from "@/content/adapters/wordpress/normalize";
import { createWordPressAdapter } from "@/content/adapters/wordpress";
import pages from "@/content/adapters/mock/data/pages.json";

const gutenbergHtml = `
<!-- wp:heading -->
<h2 class="wp-block-heading">Tre ting avgjør</h2>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p>Det er ikke <strong>domeneautoritet</strong> som avgjør. Les <a href="https://example.com/kilde">kilden</a>.</p>
<!-- /wp:paragraph -->
<!-- wp:list -->
<ul class="wp-block-list"><li>Navngitte fagpersoner</li><li>Originale <em>data</em></li></ul>
<!-- /wp:list -->
<!-- wp:quote -->
<blockquote class="wp-block-quote"><p>Et sitat.</p></blockquote>
<!-- /wp:quote -->
<!-- wp:image -->
<figure class="wp-block-image"><img src="https://cms.example/wp-content/uploads/bilde.jpg" alt="Et bilde" width="1200" height="800"/><figcaption>Bildetekst &amp; mer</figcaption></figure>
<!-- /wp:image -->
`;

describe("WordPress: HTML → RichText", () => {
  it("oversetter Gutenberg-HTML til normaliserte noder", () => {
    const rt = htmlToRichText(gutenbergHtml);
    expect(rt[0]).toMatchObject({ _type: "block", style: "h2" });
    expect(rt[1]).toMatchObject({ _type: "block", style: "normal" });
    const p = rt[1];
    if (p._type !== "block") throw new Error();
    expect(p.children.find((c) => c.marks.includes("strong"))?.text).toBe(
      "domeneautoritet",
    );
    expect(p.children.find((c) => c.href)?.href).toBe("https://example.com/kilde");
    expect(rt[2]).toMatchObject({ listItem: "bullet" });
    expect(rt[3]).toMatchObject({ listItem: "bullet" });
    expect(rt[4]).toMatchObject({ style: "blockquote" });
    expect(rt[5]).toMatchObject({
      _type: "image",
      image: { width: 1200, height: 800, caption: "Bildetekst & mer" },
    });
  });

  it("tåler tom og ukjent HTML", () => {
    expect(htmlToRichText("")).toEqual([]);
    expect(htmlToRichText(null)).toEqual([]);
    const rt = htmlToRichText("<div>Løs tekst</div>");
    expect(rt).toHaveLength(1);
  });
});

describe("WordPress: dokumenter", () => {
  it("normaliserer en side med site_blocks JSON og dropper ugyldige blokker", () => {
    const blocks = [...pages[0].blocks, { _type: "ukjent", id: "x" }];
    const p = toPage({
      databaseId: 7,
      slug: "hjem",
      title: "Hjem",
      status: "publish",
      date: "2026-11-10T09:00:00",
      modified: "2026-11-10T10:00:00",
      isFrontPage: true,
      siteBlocks: JSON.stringify(blocks),
      seoNoindex: false,
    });
    expect(p.slug).toBe("forside");
    expect(p.blocks).toHaveLength(pages[0].blocks.length);
    expect(p.updatedAt).toBe("2026-11-10T10:00:00.000Z");
  });

  it("normaliserer artikkel med forfatter, kategorier og kilder", () => {
    const a = toArticle({
      databaseId: 12,
      slug: "test",
      title: "Test",
      status: "publish",
      date: "2026-11-01T08:00:00",
      modified: "2026-11-02T08:00:00",
      content: "<p>Brødtekst.</p>",
      summary: "Kort svar.",
      sources: JSON.stringify([{ label: "Kilde", href: "https://example.com" }]),
      featuredImage: {
        node: {
          sourceUrl: "https://cms.example/img.jpg",
          altText: "Alt",
          mediaDetails: { width: 1600, height: 900 },
        },
      },
      author: { node: { databaseId: 3, slug: "kari" } },
      categories: { nodes: [{ databaseId: 5, slug: "synlighet", name: "Synlighet" }] },
    });
    expect(a.authorId).toBe("3");
    expect(a.categoryIds).toEqual(["5"]);
    expect(a.sources[0]).toMatchObject({ external: true, variant: "ghost" });
    expect(a.image?.width).toBe(1600);
  });

  it("normaliserer person med JSON-felt", () => {
    const p = toPerson({
      databaseId: 3,
      slug: "kari",
      title: "Kari",
      status: "publish",
      date: "2026-01-01T00:00:00",
      modified: "2026-01-01T00:00:00",
      role: "Leder",
      knowsAbout: JSON.stringify(["SEO", "CMS"]),
      credentials: "ikke json",
    });
    expect(p.knowsAbout).toEqual(["SEO", "CMS"]);
    expect(p.credentials).toEqual([]);
  });

  it("gjør menyer relative og markerer eksterne", () => {
    const m = toMenu(
      "main",
      [
        { databaseId: 1, label: "Tjenester", url: "http://localhost:3000/tjenester" },
        { databaseId: 2, label: "Ekstern", url: "https://annen.no/side" },
        { databaseId: 3, label: "Under", url: "/tjenester/a", parentDatabaseId: 1 },
      ],
      "http://localhost:3000",
    );
    expect(m.items[0]).toMatchObject({ href: "/tjenester", external: false });
    expect(m.items[0].children[0].href).toBe("/tjenester/a");
    expect(m.items[1]).toMatchObject({ href: "https://annen.no/side", external: true });
  });
});

describe("WordPress: adapter med fixture-fetcher", () => {
  it("henter innstillinger og forside gjennom kontrakten", async () => {
    const fetcher = async <T>(query: string): Promise<T> => {
      if (query.includes("query Settings")) {
        return {
          settings: null,
          brandGuide: null,
          redirects: null,
          generalSettings: { title: "Fixture AS" },
        } as T;
      }
      if (query.includes("query FrontPage")) {
        return {
          nodeByUri: {
            databaseId: 1,
            slug: "hjem",
            title: "Hjem",
            status: "publish",
            date: "2026-11-10T09:00:00",
            modified: "2026-11-10T09:00:00",
            isFrontPage: true,
            siteBlocks: JSON.stringify(pages[0].blocks),
          },
        } as T;
      }
      throw new Error(`Uventet spørring: ${query.slice(0, 40)}`);
    };
    const adapter = createWordPressAdapter({
      graphqlUrl: "http://cms.local/graphql",
      fetcher,
    });
    const settings = await adapter.getSiteSettings();
    expect(settings.name).toBe("Fixture AS");
    const home = await adapter.getPage("forside");
    expect(home?.blocks[0]._type).toBe("hero");
  });
});

describe("WordPress: ekte WPGraphQL-svar fra Studio (fixture)", async () => {
  const probe = (await import("../fixtures/wpgraphql-probe.json")).default as Record<
    string,
    { data: unknown }
  >;
  const byName: Record<string, string> = {
    "query Settings": "settings",
    "query Menu": "menu",
    "query FrontPage": "frontPage",
    "query Page(": "pageBySlug",
    "query Pages": "pages",
    "query Posts": "posts",
    "query Post(": "postBySlug",
    "query People": "people",
    "query Person(": "personById",
    "query Categories": "categories",
  };
  const fetcher = async <T>(query: string): Promise<T> => {
    const key = Object.keys(byName).find((k) => query.includes(k));
    if (!key) throw new Error("Ukjent spørring");
    return probe[byName[key]].data as T;
  };
  const adapter = createWordPressAdapter({
    graphqlUrl: "http://localhost:8884/graphql",
    fetcher,
  });

  it("forsiden rendres med alle blokker og riktige typer", async () => {
    const home = await adapter.getPage("forside");
    expect(home?.blocks.map((b) => b._type)).toEqual(pages[0].blocks.map((b) => b._type));
  });

  it("innstillinger, meny, personer og kategorier normaliseres", async () => {
    const s = await adapter.getSiteSettings();
    expect(s.name).toBe("AD.Moment");
    expect(s.contact.orgNumber).toBe("838 722 822");
    const m = await adapter.getMenu("main");
    expect(m.items.map((i) => i.href)).toEqual([
      "/tjenester",
      "/om-oss",
      "/artikler",
      "/kontakt",
    ]);
    const people = await adapter.getPeople();
    expect(people).toHaveLength(3);
    expect(people[0].knowsAbout.length).toBeGreaterThan(0);
    const cats = await adapter.getCategories();
    expect(cats.map((c) => c.slug)).toContain("synlighet");
  });

  it("artikkel fra Gutenberg-HTML får RichText, kort svar og kilder", async () => {
    const a = await adapter.getArticle("slik-blir-bedriften-din-sitert-av-ai");
    expect(a?.summary.startsWith("AI-motorer")).toBe(true);
    expect(a?.body.some((n) => n._type === "block" && n.style === "h2")).toBe(true);
    expect(a?.body.some((n) => n._type === "block" && n.listItem === "bullet")).toBe(
      true,
    );
    expect(a?.sources[0]?.href).toContain("launchcodex");
  });

  it("profilmanualen kommer gjennom", async () => {
    const g = await adapter.getBrandGuide();
    expect(g?.identity.name).toBe("AD.Moment");
    expect(g?.facts.some((f) => f.claim.includes("838 722 822"))).toBe(true);
  });
});
