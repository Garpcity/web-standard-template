# web-standard-template

Startpunkt for alle nettsider bygget etter **Standard for nettsideutvikling**. Klon, kjør `pnpm setup`, bytt tokens – og en tom kundeside er på preview-URL innen en time.

- **Frontend:** Next.js 16 (App Router), TypeScript strict, Tailwind v4, design-tokens
- **Innhold:** utskiftbart CMS bak ett innholdslag (`src/content`). Adaptere: `mock` (JSON, følger med), `wordpress` (fase 3), `payload` (fase 4)
- **Visuell redigering:** Puck på `/edit/[slug]` – bygg sider av godkjente blokker, låste utseende-felt
- **Bevegelse:** navngitte oppskrifter (CSS + Motion), alltid synlig uten JS, respekterer reduced motion
- **SEO/AEO/GEO:** metadata, JSON-LD-builders, sitemap, robots med AI-crawlere, `llms.txt`, profilmanual
- **MCP for kundens agenter:** `/api/mcp` med verktøy, oppgavemaler og profilsjekk – se `docs/mcp-for-kunder.md`
- **3D:** `model3d`-blokk med React Three Fiber, Cinema 4D-pipeline i `src/design/3D-PIPELINE.md`
- **Kvalitet:** ESLint, Prettier, Vitest, Playwright, Lighthouse CI (100/100/100/100 på templaten)
- **Lisens:** MIT. Alle avhengigheter i kjernen er MIT/Apache/GPL og kan selvhostes.

> **CMS-valg:** Payload er standard for nye kunder; WordPress-sporet er for migrasjon fra eksisterende WordPress (se `docs/decisions/0002-payload-primaer-cms.md`).

## Kom i gang

```bash
pnpm install
pnpm seed            # eksempelinnhold + plassholderbilder
cp .env.example .env.local
pnpm dev             # http://localhost:3000
```

Editor: http://localhost:3000/edit/forside (sett `EDITOR_PASSWORD` i `.env.local`; `?role=owner` viser låste felt i dev).

## Kommandoer

| Kommando | Gjør |
| --- | --- |
| `pnpm dev` / `pnpm build` / `pnpm start` | Utvikling / bygg / kjør bygget |
| `pnpm check` | Lint + typer + format + enhetstester. Kjør før PR. |
| `pnpm test:e2e` | Playwright (bygger og starter selv). Lokalt uten nedlastet Chromium: `PLAYWRIGHT_CHANNEL=chrome` |
| `pnpm lighthouse` | Lighthouse CI med terskler (ytelse ≥ 90, tilgjengelighet ≥ 95, SEO ≥ 95) |
| `pnpm generate:schema` | Regenererer `generated/` fra Zod. CI feiler ved diff. |
| `pnpm seed` | Skriver mock-innhold |
| `pnpm setup` | Nytt prosjekt: navn, slug, CMS |
| `docker compose --profile wordpress up` | WordPress lokalt på :8080 (fase 3) |
| `docker compose --profile n8n up` | n8n lokalt på :5678 |

## Struktur

```
AGENTS.md                 Konvensjoner for AI (CLAUDE.md og .cursorrules peker hit)
site.config.ts            Grunnstruktur: språk, aktive blokker, AI-crawlere, integrasjoner
src/
  app/                    Ruter. (site)/ = offentlige sider, edit/ = Puck, api/ = skjema, puck, brand-guide
  components/
    ui/                   Button, Section, Card, SmartImage
    blocks/               Én komponent per innholdsblokk + BlockRenderer
    layout/               Header, Footer, MobileNav
    motion/               Reveal, Stagger, CountUp, HeroParallax, RevealObserver
  content/
    schema/               Zod-skjemaer = kilden til alt (common, blocks, documents)
    types.ts              Kontrakten (utledet fra Zod)
    index.ts              getPage, getArticles … velger adapter via CMS_PROVIDER
    permissions.ts        Roller, redigeringsnivåer, låste felt
    adapters/             mock/ (JSON), wordpress/, payload/
  design/
    tokens.css            Byttes per kunde
    motion.ts             Bevegelsesoppskrifter
    DESIGN.md             Estetiske prinsipper + logg
  puck/                   Puck-config og konvertering Block[] ↔ Puck Data
  seo/                    buildMetadata, JsonLd, schema/ (builders)
generated/json-schema/    Generert fra Zod – kilde for ACF/Payload-definisjoner
scripts/                  seed, generate-schema, setup
tests/                    unit/ (Vitest), e2e/ (Playwright)
docs/                     launch-checklist, seo-playbook, hosting-servetheworld, mcp-for-kunder, decisions/
```

## Avvik fra standard

Ingen. (Oppdater denne seksjonen i hvert kundeprosjekt.)

## AI-crawlere

Standard: alle AI-crawlere slippes inn (`site.config.ts` → `aiCrawlers`). Vi optimaliserer for synlighet. Endring er kundens beslutning og dokumenteres her.

## Overtakelse

En annen leverandør kan ta over slik: klon repoet, `pnpm install`, sett miljøvariabler fra `.env.example`, `pnpm build && pnpm start`. Innholdet ligger i CMS-et (eller `src/content/adapters/mock/data/` i template-modus). Ingen hemmeligheter i kode.

## Lisens

MIT.
