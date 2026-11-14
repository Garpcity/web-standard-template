/**
 * MCP-serveren testet med en ekte MCP-klient over in-memory-transport.
 * Adapteren er mock-adapteren med seed-innholdet, men lagring omdirigeres til minne.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMockAdapter } from "@/content/adapters/mock";
import type { Article, ContentAdapter, Page, SocialPost } from "@/content/types";
import { createMcpServer } from "@/mcp/server";
import { checkAgainstGuide } from "@/mcp/guard";
import { parseAgentKeys, identify } from "@/mcp/auth";
import guideJson from "@/content/adapters/mock/data/brand-guide.json";
import { brandGuide } from "@/content/schema";

const saved: { pages: Page[]; articles: Article[]; posts: SocialPost[] } = {
  pages: [],
  articles: [],
  posts: [],
};

function memoryAdapter(): ContentAdapter {
  const base = createMockAdapter();
  return {
    ...base,
    savePage: async (p) => void saved.pages.push(p),
    saveArticle: async (a) => void saved.articles.push(a),
    saveSocialPost: async (p) => void saved.posts.push(p),
  };
}

const textOf = (r: unknown) => {
  const c = (r as { content: { type: string; text: string }[] }).content[0];
  return c.text;
};
const jsonOf = (r: unknown) => JSON.parse(textOf(r));

describe("MCP-server", () => {
  let client: Client;

  beforeAll(async () => {
    const server = createMcpServer({
      adapter: memoryAdapter(),
      agent: { name: "test-agent", role: "agent" },
      tokensCss: ":root{--brand:#0f4c5c}",
    });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    client = new Client({ name: "test-client", version: "1.0.0" });
    await client.connect(clientTransport);
  });

  it("eksponerer verktøy og oppgavemaler", async () => {
    const tools = (await client.listTools()).tools.map((t) => t.name).sort();
    expect(tools).toEqual(
      [
        "check_against_guide",
        "create_draft_article",
        "create_draft_page",
        "create_social_post",
        "get_blocks",
        "get_brand_guide",
        "get_content",
        "get_design_tokens",
        "search_content",
      ].sort(),
    );
    const promptNames = (await client.listPrompts()).prompts.map((p) => p.name).sort();
    expect(promptNames).toEqual([
      "kvalitetssjekk",
      "ny-artikkel",
      "ny-landingsside",
      "oppdater-side",
      "some-serie",
    ]);
  });

  it("en oppgavemal bygger en instruksjon med fast første og siste steg", async () => {
    const p = await client.getPrompt({
      name: "ny-artikkel",
      arguments: { tema: "Hva koster en nettside?" },
    });
    const txt = (p.messages[0].content as { text: string }).text;
    expect(txt).toContain("get_brand_guide først");
    expect(txt).toContain("check_against_guide");
    expect(txt).toContain("Hva koster en nettside?");
    expect(txt).toContain("Alt du lager er utkast");
  });

  it("get_brand_guide og get_blocks gir strukturerte data", async () => {
    const guide = jsonOf(
      await client.callTool({ name: "get_brand_guide", arguments: { part: "voice" } }),
    );
    expect(guide.avoidWords).toContain("sømløs");
    const blocks = jsonOf(
      await client.callTool({ name: "get_blocks", arguments: { name: "hero" } }),
    );
    expect(blocks[0].locked).toContain("tone");
    expect(blocks[0].schema.properties.heading).toBeDefined();
  });

  it("search_content finner artikler og personer", async () => {
    const r = jsonOf(
      await client.callTool({
        name: "search_content",
        arguments: { query: "åpen kildekode" },
      }),
    );
    expect(r.hits.some((h: { type: string }) => h.type === "article")).toBe(true);
  });

  it("create_draft_article lagrer som utkast med agent-spor og forfatter", async () => {
    const r = jsonOf(
      await client.callTool({
        name: "create_draft_article",
        arguments: {
          slug: "test-artikkel",
          title: "Hva koster en bedriftsnettside?",
          summary:
            "En standard bedriftsnettside med 8–12 sider tar 10–15 arbeidsdager fra oppstart til lansering. Prisen avhenger av innhold, ikke teknikk, fordi alt bygges på samme template.",
          authorSlug: "ansatt-1",
          body: [
            {
              _type: "block",
              style: "normal",
              children: [
                { _type: "span", text: "Du eier kode, innhold og domene.", marks: [] },
              ],
            },
          ],
          sources: [{ label: "Standard", href: "https://example.com/standard" }],
          template: "ny-artikkel",
          templateVersion: "1.0.0",
        },
      }),
    );
    expect(r.ok).toBe(true);
    expect(saved.articles[0].status).toBe("draft");
    expect(saved.articles[0].agentMeta?.createdBy).toBe("agent:test-agent");
    expect(saved.articles[0].agentMeta?.template).toBe("ny-artikkel");
    expect(saved.articles[0].authorId).toBe("p-1");
  });

  it("agentforslag rører aldri en publisert side (lagres som <slug>--forslag)", async () => {
    const base = createMockAdapter();
    const published = await base.getPage("tjenester");
    expect(published?.status).toBe("published");
    const before = JSON.stringify(published);
    const r = jsonOf(
      await client.callTool({
        name: "create_draft_page",
        arguments: {
          slug: "tjenester",
          title: "Tjenester (forslag fra agent)",
          blocks: [{ _type: "hero", id: "b1", heading: "Nytt forslag", links: [] }],
        },
      }),
    );
    expect(r.ok).toBe(true);
    expect(r.slug).toBe("tjenester--forslag");
    expect(r.note).toContain("ble ikke endret");
    const savedProposal = saved.pages.find((p) => p.slug === "tjenester--forslag");
    expect(savedProposal?.status).toBe("draft");
    expect(savedProposal?.seo.noindex).toBe(true);
    expect(saved.pages.some((p) => p.slug === "tjenester")).toBe(false);
    expect(JSON.stringify(await base.getPage("tjenester"))).toBe(before);
  });

  it("agentforslag rører aldri en publisert artikkel", async () => {
    const base = createMockAdapter();
    const [first] = await base.getArticles({ limit: 1 });
    const r = jsonOf(
      await client.callTool({
        name: "create_draft_article",
        arguments: {
          slug: first.slug,
          title: "Omskrevet av agent",
          summary:
            "Dette er et sammendrag på rundt førti ord som beskriver hva artikkelen handler om, slik at kort svar-regelen i verktøyet er tilfredsstilt og testen ikke gir unødvendige advarsler om lengde her.",
          authorSlug: "ansatt-1",
          body: "## Forslag\n\nNy tekst.",
        },
      }),
    );
    expect(r.ok).toBe(true);
    expect(r.slug).toBe(`${first.slug}--forslag`);
    expect(saved.articles.some((a) => a.slug === first.slug)).toBe(false);
  });

  it("create_draft_page fjerner låste felt og lagrer som utkast", async () => {
    const r = jsonOf(
      await client.callTool({
        name: "create_draft_page",
        arguments: {
          slug: "kampanje",
          title: "Kampanje",
          blocks: [
            {
              _type: "hero",
              id: "b1",
              heading: "Få en nettside du eier",
              tone: "dark",
              layout: "fullBleed",
              links: [],
            },
            {
              _type: "cta",
              id: "b2",
              heading: "Ta kontakt",
              links: [{ label: "Kontakt", href: "/kontakt" }],
            },
          ],
        },
      }),
    );
    expect(r.ok).toBe(true);
    const page = saved.pages[0];
    expect(page.status).toBe("draft");
    const hero = page.blocks[0];
    expect(hero._type === "hero" && hero.tone).toBe("default");
    expect(hero._type === "hero" && hero.layout).toBe("split");
  });

  it("avviser innhold som bryter profilmanualen", async () => {
    const r = jsonOf(
      await client.callTool({
        name: "create_social_post",
        arguments: {
          channel: "LinkedIn",
          text: "Vi gir garantert førsteplass i Google med vår banebrytende løsning!",
        },
      }),
    );
    expect(r.error).toBeDefined();
    expect(r.report.issues.some((i: { rule: string }) => i.rule === "never-claim")).toBe(
      true,
    );
    expect(r.report.issues.some((i: { rule: string }) => i.rule === "avoid-word")).toBe(
      true,
    );
    expect(saved.posts).toHaveLength(0);
  });

  it("håndhever kanalens maks lengde", async () => {
    const r = jsonOf(
      await client.callTool({
        name: "create_social_post",
        arguments: { channel: "LinkedIn", text: "x".repeat(1400) },
      }),
    );
    expect(
      r.report.issues.some((i: { rule: string }) => i.rule === "channel-length"),
    ).toBe(true);
  });

  it("lagrer en gyldig sosial post", async () => {
    const r = jsonOf(
      await client.callTool({
        name: "create_social_post",
        arguments: {
          channel: "LinkedIn",
          text: "Du eier kode, innhold og domene. Les hvorfor.",
          hashtags: ["#nettside"],
          sourceSlug: "hvorfor-vi-bygger-pa-apen-kildekode",
        },
      }),
    );
    expect(r.ok).toBe(true);
    expect(saved.posts[0].status).toBe("draft");
  });
});

describe("Profilsjekk", () => {
  const guide = brandGuide.parse(guideJson);
  it("flagger tall uten kilde og godkjenner kjente fakta", () => {
    const bad = checkAgainstGuide("Vi har 500 kunder i Norge.", guide);
    expect(bad.issues.some((i) => i.rule === "unverified-number")).toBe(true);
    const good = checkAgainstGuide("AD.Moment har tre ansatte.", guide);
    expect(good.ok).toBe(true);
  });
  it("flagger emner som krever godkjenning", () => {
    const r = checkAgainstGuide("Våre priser starter på et lavt nivå.", guide);
    expect(r.issues.some((i) => i.rule === "requires-approval")).toBe(true);
  });
});

describe("Agent-nøkler", () => {
  it("parser nøkler og identifiserer via header eller bearer", () => {
    const keys = parseAgentKeys("kunde-ai:abc123,studio:xyz:owner,red:r1:editor");
    expect(
      identify(new Request("http://x", { headers: { "x-agent-key": "abc123" } }), keys),
    ).toEqual({ name: "kunde-ai", role: "agent" });
    expect(
      identify(
        new Request("http://x", { headers: { authorization: "Bearer xyz" } }),
        keys,
      ),
    ).toEqual({ name: "studio", role: "agent" }); // owner via nøkkel nedgraderes
    expect(identify(new Request("http://x"), keys)).toBeNull();
  });
});

describe("guard: tone og løfter", () => {
  const guide = brandGuide.parse(guideJson);
  it("stopper skrik, caps og garantier", () => {
    const r = checkAgainstGuide(
      "KJØP NÅ!!! Beste i verden, garantert 100% resultat.",
      guide,
    );
    expect(r.ok).toBe(false);
    expect(r.issues.map((i) => i.rule)).toEqual(
      expect.arrayContaining([
        "shouting",
        "unsubstantiated-promise",
        "unverified-number",
      ]),
    );
  });
  it("slipper forkortelser i B2B-tekst", () => {
    expect(checkAgainstGuide("Vi er GDPR- og ISO 9001-sertifisert", guide).ok).toBe(true);
    expect(checkAgainstGuide("Vi samarbeider med NAV og UDI.", guide).ok).toBe(true);
  });
  it("store ord uten utropstegn gir bare advarsel", () => {
    const r = checkAgainstGuide("Vi leverer RASKE og TRYGGE nettsider.", guide);
    expect(r.ok).toBe(true);
    expect(r.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: "shouting", severity: "warning" }),
      ]),
    );
  });
  it("teller ikke store ord fra godkjente fakta eller useWords", () => {
    const g = {
      ...guide,
      voice: { ...guide.voice, useWords: [...guide.voice.useWords, "HTTPS"] },
      facts: [
        ...guide.facts,
        { claim: "Vi følger GDPR.", source: "Kunden", approved: true },
        { claim: "Vi er ARKIV-godkjent.", source: "Kunden", approved: false },
      ],
    };
    const r = checkAgainstGuide("Alt går over HTTPS og følger GDPR. MER info.", g);
    expect(r.issues.filter((i) => i.rule === "shouting")).toEqual([]);
    const u = checkAgainstGuide("Vi er ARKIV-godkjent. SJEKK selv.", g);
    expect(u.issues.map((i) => i.rule)).toContain("shouting");
  });
  it("slipper rolig tekst", () => {
    const r = checkAgainstGuide("Vi bygger nettsider du kan redigere selv.", guide);
    expect(r.ok).toBe(true);
  });
});
