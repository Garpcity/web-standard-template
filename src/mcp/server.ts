/**
 * MCP-server: kundens egne agenter kobler seg til nettsiden her.
 * Verktøy: lese alt, lage utkast, sjekke mot profilmanual. Aldri publisere, slette eller endre profilmanualen.
 * Oppgavemaler (prompts) gir forutsigbare resultater uansett LLM.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  block as blockSchema,
  blockSchemas,
  richText as richTextSchema,
  slugSchema,
  type Article,
  type Page,
  type SocialPost,
} from "@/content/schema";
import type { ContentAdapter } from "@/content/types";
import { lockedBlockFields } from "@/content/permissions";
import { siteConfig } from "../../site.config";
import { markdownToRichText } from "@/content/markdown";
import { iconNames } from "@/design/icons";
import { checkAgainstGuide } from "./guard";
import { prompts } from "./prompts";
import type { AgentIdentity } from "./auth";

export const MCP_SERVER_VERSION = "1.0.0";

type Deps = {
  adapter: ContentAdapter;
  agent: AgentIdentity;
  /** Innhold i tokens.css, for get_design_tokens. */
  tokensCss?: string;
};

const text = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

export function createMcpServer({ adapter, agent, tokensCss }: Deps): McpServer {
  const server = new McpServer({
    name: "web-standard-template",
    version: MCP_SERVER_VERSION,
  });
  const meta = (template?: string, templateVersion?: string, issues?: number) => ({
    createdBy: `agent:${agent.name}`,
    template,
    templateVersion,
    checkedAt: new Date().toISOString(),
    issues,
  });

  /* ---------- Lese ---------- */

  server.registerTool(
    "get_brand_guide",
    {
      title: "Hent profilmanualen",
      description:
        "Profilmanualen er kilden for identitet, tone, godkjente fakta og kanalregler. Kall denne først i enhver oppgave.",
      inputSchema: {
        part: z
          .enum(["all", "identity", "voice", "facts", "channels", "legal"])
          .default("all"),
      },
    },
    async ({ part }) => {
      const guide = await adapter.getBrandGuide();
      if (!guide)
        return text({ error: "Ingen profilmanual er satt opp for denne siden." });
      if (part === "all") return text(guide);
      if (part === "facts")
        return text({ facts: guide.facts, neverClaim: guide.neverClaim });
      return text(guide[part]);
    },
  );

  server.registerTool(
    "get_content",
    {
      title: "Hent innhold",
      description: "Hent en side, artikkel eller person med slug. Inkluderer utkast.",
      inputSchema: {
        type: z.enum(["page", "article", "person"]),
        slug: z.string().min(1),
      },
    },
    async ({ type, slug }) => {
      const doc =
        type === "page"
          ? await adapter.getPage(slug, { includeDrafts: true })
          : type === "article"
            ? await adapter.getArticle(slug, { includeDrafts: true })
            : await adapter.getPerson(slug);
      return text(doc ?? { error: `Fant ikke ${type} med slug "${slug}".` });
    },
  );

  server.registerTool(
    "search_content",
    {
      title: "Søk i innhold",
      description:
        "Enkelt tekstsøk i sider, artikler og personer. Returnerer slug, type og tittel.",
      inputSchema: {
        query: z.string().min(1),
        limit: z.number().int().min(1).max(50).default(10),
      },
    },
    async ({ query, limit }) => {
      const q = query.toLowerCase();
      const [pages, articles, people] = await Promise.all([
        adapter.getPages(),
        adapter.getArticles({ includeDrafts: true }),
        adapter.getPeople(),
      ]);
      const hits = [
        ...pages
          .filter((p) => JSON.stringify(p).toLowerCase().includes(q))
          .map((p) => ({ type: "page", slug: p.slug, title: p.title, status: p.status })),
        ...articles
          .filter((a) => JSON.stringify(a).toLowerCase().includes(q))
          .map((a) => ({
            type: "article",
            slug: a.slug,
            title: a.title,
            status: a.status,
          })),
        ...people
          .filter((p) => JSON.stringify(p).toLowerCase().includes(q))
          .map((p) => ({
            type: "person",
            slug: p.slug,
            title: p.name,
            status: p.status,
          })),
      ].slice(0, limit);
      return text({ query, hits });
    },
  );

  server.registerTool(
    "get_blocks",
    {
      title: "Tilgjengelige blokker",
      description:
        "Blokkene en side kan bygges av, med felter (JSON Schema) og hvilke felt som er låst for agenter.",
      inputSchema: { name: z.string().optional() },
    },
    async ({ name }) => {
      const names = name ? [name] : [...siteConfig.enabledBlocks];
      const out = names
        .filter((n): n is keyof typeof blockSchemas => n in blockSchemas)
        .map((n) => ({
          name: n,
          locked: lockedBlockFields[n] ?? [],
          schema: z.toJSONSchema(blockSchemas[n], { target: "draft-7", io: "input" }),
        }));
      return text(out);
    },
  );

  server.registerTool(
    "get_design_tokens",
    {
      title: "Design-tokens",
      description:
        "Farger, typografi, avstander og tilgjengelige ikonnavn (lesing). Agenter endrer aldri tokens.",
      inputSchema: {},
    },
    async () =>
      text({ icons: iconNames, tokensCss: tokensCss ?? "tokens.css ikke tilgjengelig" }),
  );

  /* ---------- Sjekk ---------- */

  server.registerTool(
    "check_against_guide",
    {
      title: "Sjekk mot profilmanualen",
      description:
        "Regelbasert sjekk: unngå-ord, forbudte påstander/emner, tall uten kilde, kanallengde, tiltaleform. Kjør før alt lagres.",
      inputSchema: {
        text: z.string().min(1),
        channel: z.string().optional(),
        claims: z.array(z.string()).optional(),
      },
    },
    async ({ text: body, channel, claims }) =>
      text(checkAgainstGuide(body, await adapter.getBrandGuide(), { channel, claims })),
  );

  /* ---------- Utkast ---------- */

  const seoInput = z
    .object({
      title: z.string().max(70).optional(),
      description: z.string().max(170).optional(),
    })
    .optional();

  server.registerTool(
    "create_draft_page",
    {
      title: "Lag sideutkast",
      description:
        "Oppretter eller oppdaterer en side som UTKAST, bygget av godkjente blokker. Låste felt ignoreres. Validerer mot skjemaet.",
      inputSchema: {
        slug: slugSchema,
        title: z.string().min(1).max(120),
        blocks: z.array(z.record(z.string(), z.unknown())).min(1),
        seo: seoInput,
        template: z.string().optional(),
        templateVersion: z.string().optional(),
      },
    },
    async ({ slug, title, blocks, seo, template, templateVersion }) => {
      if (!adapter.savePage)
        return text({ error: "Dette CMS-et støtter ikke lagring via MCP." });
      const existing = await adapter.getPage(slug, { includeDrafts: true });
      const cleaned = blocks.map((b, i) => {
        const type = String(b._type ?? "");
        const locked = new Set(lockedBlockFields[type] ?? []);
        const copy: Record<string, unknown> = { id: `b-${i + 1}`, ...b };
        for (const k of locked) delete copy[k];
        // Agenter kan sende body som Markdown i text/textImage-blokker.
        if (typeof copy.body === "string") copy.body = markdownToRichText(copy.body);
        // Behold låste verdier fra eksisterende blokk med samme id, ellers standard.
        const prev = existing?.blocks.find((x) => x.id === copy.id);
        if (prev) for (const k of locked) copy[k] = (prev as Record<string, unknown>)[k];
        return copy;
      });
      const parsed = z.array(blockSchema).safeParse(cleaned);
      if (!parsed.success)
        return text({
          error: "Ugyldige blokker",
          issues: parsed.error.issues.slice(0, 10),
        });
      const texts = parsed.data.map((b) => JSON.stringify(b)).join("\n");
      const report = checkAgainstGuide(texts, await adapter.getBrandGuide());
      if (!report.ok)
        return text({
          error: "Teksten bryter profilmanualen. Rett feilene og prøv igjen.",
          report,
        });
      const now = new Date().toISOString();
      const page: Page = {
        _type: "page",
        id: existing?.id ?? `pg-${slug}`,
        slug,
        title,
        blocks: parsed.data,
        seo: { noindex: existing?.seo.noindex ?? false, ...existing?.seo, ...seo },
        status: "draft",
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        ownerId: existing?.ownerId,
        agentMeta: meta(template, templateVersion, report.issues.length),
      };
      await adapter.savePage(page);
      return text({
        ok: true,
        slug,
        status: "draft",
        editUrl: `/edit/${slug}`,
        warnings: report.issues,
      });
    },
  );

  server.registerTool(
    "create_draft_article",
    {
      title: "Lag artikkelutkast",
      description:
        "Oppretter en artikkel som UTKAST. summary = svaret i 40–60 ord. body = Markdown (## overskrifter, avsnitt, lister, > sitat, **fet**, [lenke](url)) – eller RichText-noder hvis du kjenner formatet. Kilder inline + i sources.",
      inputSchema: {
        slug: slugSchema,
        title: z.string().min(1).max(140),
        summary: z.string().min(1).max(400),
        authorSlug: z.string().min(1),
        body: z.union([
          z.string().min(1),
          z.array(z.record(z.string(), z.unknown())).min(1),
        ]),
        sources: z
          .array(z.object({ label: z.string(), href: z.string().url() }))
          .default([]),
        seo: seoInput,
        template: z.string().optional(),
        templateVersion: z.string().optional(),
      },
    },
    async ({
      slug,
      title,
      summary,
      authorSlug,
      body,
      sources,
      seo,
      template,
      templateVersion,
    }) => {
      if (!adapter.saveArticle)
        return text({ error: "Dette CMS-et støtter ikke artikkelutkast via MCP." });
      const author = await adapter.getPerson(authorSlug);
      if (!author)
        return text({
          error: `Fant ikke forfatter "${authorSlug}". Bruk search_content for å finne personer.`,
        });
      const parsedBody = richTextSchema.safeParse(
        typeof body === "string" ? markdownToRichText(body) : body,
      );
      if (!parsedBody.success)
        return text({
          error: "Ugyldig body (RichText)",
          issues: parsedBody.error.issues.slice(0, 10),
        });
      const plain =
        summary +
        "\n" +
        parsedBody.data
          .flatMap((n) => (n._type === "block" ? n.children.map((c) => c.text) : []))
          .join(" ");
      const report = checkAgainstGuide(plain, await adapter.getBrandGuide());
      if (!report.ok)
        return text({
          error: "Teksten bryter profilmanualen. Rett feilene og prøv igjen.",
          report,
        });
      const words = summary.trim().split(/\s+/).length;
      if (words < 25 || words > 80)
        report.issues.push({
          severity: "warning",
          rule: "summary-length",
          message: `Kort svar er ${words} ord; sikt mot 40–60.`,
        });
      const now = new Date().toISOString();
      const existing = await adapter.getArticle(slug, { includeDrafts: true });
      const article: Article = {
        _type: "article",
        id: existing?.id ?? `a-${slug}`,
        slug,
        title,
        summary,
        authorId: author.id,
        publishedAt: existing?.publishedAt ?? now,
        categoryIds: existing?.categoryIds ?? [],
        body: parsedBody.data,
        sources: sources.map((s) => ({
          ...s,
          external: true,
          variant: "ghost" as const,
        })),
        seo: { noindex: false, ...existing?.seo, ...seo },
        status: "draft",
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        agentMeta: meta(template, templateVersion, report.issues.length),
      };
      await adapter.saveArticle(article);
      return text({ ok: true, slug, status: "draft", warnings: report.issues });
    },
  );

  server.registerTool(
    "create_social_post",
    {
      title: "Lag utkast til sosial post",
      description:
        "Lager en post for én kanal som UTKAST. Kanalreglene (maks lengde, hashtags) håndheves. Publisering skjer via n8n etter godkjenning.",
      inputSchema: {
        channel: z.string().min(1),
        text: z.string().min(1).max(5000),
        hashtags: z.array(z.string()).default([]),
        sourceSlug: z.string().optional(),
        template: z.string().optional(),
        templateVersion: z.string().optional(),
      },
    },
    async ({ channel, text: body, hashtags, sourceSlug, template, templateVersion }) => {
      if (!adapter.saveSocialPost)
        return text({ error: "Dette CMS-et støtter ikke sosiale poster via MCP." });
      const report = checkAgainstGuide(body, await adapter.getBrandGuide(), { channel });
      if (!report.ok)
        return text({
          error: "Posten bryter profilmanualen eller kanalreglene.",
          report,
        });
      const now = new Date().toISOString();
      const id = `sp-${Date.now().toString(36)}`;
      const post: SocialPost = {
        _type: "socialPost",
        id,
        slug: id,
        channel,
        text: body,
        hashtags,
        sourceSlug,
        status: "draft",
        createdAt: now,
        updatedAt: now,
        agentMeta: meta(template, templateVersion, report.issues.length),
      };
      await adapter.saveSocialPost(post);
      return text({ ok: true, id, channel, status: "draft", warnings: report.issues });
    },
  );

  /* ---------- Oppgavemaler ---------- */

  for (const p of prompts) {
    const argsShape: Record<string, z.ZodString | z.ZodOptional<z.ZodString>> = {};
    for (const a of p.args)
      argsShape[a.name] = a.required
        ? z.string().describe(a.description)
        : z.string().optional().describe(a.description);
    server.registerPrompt(
      p.name,
      {
        title: `${p.title} (v${p.version})`,
        description: p.description,
        argsSchema: argsShape,
      },
      async (args) => ({
        messages: [
          {
            role: "user",
            content: { type: "text", text: p.build(args as Record<string, string>) },
          },
        ],
      }),
    );
  }

  return server;
}
