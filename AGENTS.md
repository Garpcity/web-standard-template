# AGENTS.md – konvensjoner for AI-assistert utvikling

Dette repoet følger **Standard for nettsideutvikling**. Les denne filen før du skriver kode.
`CLAUDE.md`, `.cursorrules` og tilsvarende peker hit; alle LLM-verktøy skal lese samme fil.

## Prosjekt

- Navn: `web-standard-template` – pilot A: **AD.Moment** (org.nr. 838 722 822)
- CMS: `CMS_PROVIDER` i `.env.local` – `mock` (standard i template), `wordpress`, `payload`
- Avvik fra standard: ingen. Oppdater denne linjen hvis det endres.

## Kommandoer

| Kommando | Gjør |
| --- | --- |
| `pnpm dev` | Start utvikling på http://localhost:3000 |
| `pnpm check` | Lint, typer, formatering, enhetstester. **Kjør alltid før PR.** |
| `pnpm test:e2e` | Playwright mot bygget side |
| `pnpm generate:schema` | Regenererer `generated/` fra Zod-skjemaene. Kjør etter skjemaendring. |
| `pnpm seed` | Skriver eksempelinnhold til mock-adapteren |
| `docker compose --profile wordpress up` | WordPress lokalt på :8080 |
| `scripts/wp-seed.sh "<wp-cli>"` | Importerer mock-innhold til WordPress med site-core |
| `pnpm dev` + `curl -X POST localhost:3000/api/seed -H "x-payload-secret: $PAYLOAD_SECRET"` | Seeder Payload (SQLite lokalt). Admin på /admin |

## Arkitektur – de tre lagene

1. **Frontend** (`src/app`, `src/components`) – vet ingenting om CMS.
2. **Innholdslaget / kontrakten** (`src/content`) – `types.ts` er utledet fra Zod-skjemaene i `schema/`; `index.ts` eksponerer `getPage`, `getArticles`, `getArticle`, `getPeople`, `getMenu`, `getSiteSettings`, `getBrandGuide`, `getPreviewContext`.
3. **Adaptere** (`src/content/adapters/<cms>`) – én per CMS, implementerer `ContentAdapter`.
   - `wordpress/`: `queries.ts` (WPGraphQL), `normalize.ts` (rene funksjoner, testes med fixtures), `index.ts`. Pluginen i `wordpress/plugins/site-core` er den andre halvdelen; endrer du et felt, endre begge.
   - `payload/`: `normalize.ts` (Lexical → RichText m.m.), `index.ts` (lokalt API). Collections/globals i `src/payload/` speiler Zod-skjemaene; endrer du et felt, endre begge. Admin-UI i `src/app/(payload)`. Rettigheter i `src/payload/access.ts` leser `permissions.ts`.

Regler:

- **Importer aldri fra `src/content/adapters/*` i frontend.** ESLint stopper det. Bruk `@/content`.
- Ny innholdstype: `schema/` → `pnpm generate:schema` → adapter → komponent → test. I den rekkefølgen.
- Hver innholdsblokk har **ett** Zod-skjema i `schema/blocks.ts`, **én** komponent i `components/blocks/<Navn>.tsx` med samme navn, og **én** registrering i `puck/config.tsx`.
- Rik tekst er alltid normalisert `RichTextNode[]`; render med `<RichText>`.
- Bilder er alltid `ImageRef` (`url, alt, width, height`) og rendres med `next/image`.
- Innhold revalideres on-demand: `revalidateContent(kind, slug)` i `src/lib/revalidate.ts` eier reglene. Payload kaller den fra hooks; WordPress-pluginen kaller `POST /api/revalidate` (REVALIDATE_SECRET). Sider har `revalidate = 3600` som sikkerhetsnett. Ny rute som viser innhold → legg den til i `revalidateContent`.
- Payload er primær-CMS for nye kunder (ADR 0002). WordPress er migrasjonsspor: hold adapteren og pluginen i takt med kontrakten, men nye funksjoner lander i Payload først.
- Databaseskjema: Payload pusher bare selv i utvikling. Produksjon og Docker-bygg bruker `ensureSchema` (`onInit`, `PAYLOAD_DB_PUSH=true`). Destruktive endringer = migrasjon, ikke push.

## Design

- Tokens i `src/design/tokens.css`. **Ingen hardkodede farger, fonter eller avstander i komponenter** – bruk Tailwind-klasser som leser tokens (`bg-surface`, `text-fg`, `text-brand`).
- Animasjon: bruk oppskriftene i `src/design/motion.ts` (`reveal`, `stagger`, `heroParallax` …). Ikke skriv ad hoc-animasjon. Mangler en oppskrift, legg den til der med navn og beskrivelse i `DESIGN.md`.
- Les `src/design/DESIGN.md` før du lager eller endrer blokker.
- Alltid `prefers-reduced-motion`-fallback. Oppskriftene håndterer dette; bruk dem.

## Kode

- TypeScript strict. Ingen `any` uten `// why:`-kommentar.
- Server Components som standard. `"use client"` kun der interaksjon eller Motion krever det, og da i minst mulig komponent.
- Komponenter: PascalCase, én per fil, `Props`-type øverst, named export.
- Feltnavn engelsk i kode, norske labels i CMS og Puck (`label:`).
- Commit-meldinger på norsk, imperativ: `Legg til FAQ-blokk`.
- Tester: enhetstest for skjema og rene funksjoner; e2e for sidetyper. Ny blokk = minst én rendertest.
- Første bilde over folden får `priority` og `eager`-reveal (se DESIGN.md, LCP-regel). Ikoner velges fra `src/design/icons.ts`, aldri `import * as` fra lucide.

## Ny blokk – oppskriften

En blokk rører nøyaktig disse stedene; paritetstesten feiler hvis ett mangler:

1. `src/content/schema/blocks.ts`: `export const <navn>Block = blockBase.extend({ _type: z.literal("<navn>"), … })`, legg den i `block`-unionen og i `blockSchemas`.
2. `src/components/blocks/<Navn>.tsx`: server-komponent, named export, `block: BlockOf<"<navn>">` som prop, `<Section tone={block.tone} id={block.anchor}>` ytterst, bruk `SectionHeading` og tokens (ingen hardkodede farger). `data-reveal`/`Stagger` for bevegelse.
3. `src/components/blocks/BlockRenderer.tsx`: `case "<navn>"`.
4. `src/puck/config.tsx`: import, `components.<Navn>` med `fields` (norske `label`), `defaultProps`, `render`; legg navnet i riktig `categories`-gruppe.
5. `src/content/permissions.ts`: `lockedBlockFields.<navn>` (minst `["tone"]`).
6. `site.config.ts`: navnet i `enabledBlocks`.
7. `src/content/adapters/mock/data/pages.json`: bruk blokken på minst én side (slik at e2e ser den).
8. `tests/unit/schema.test.ts`: legg navnet i blokklisten; legg til en test som parser et gyldig og et ugyldig eksempel.
9. `pnpm generate:schema` (oppdaterer `generated/json-schema/`), så `pnpm check`.
10. Én rad i `src/design/DESIGN.md` hvis blokken innfører et nytt visuelt mønster.

Blokken skal fungere i Puck uten JS-feil og rendre riktig med `tone: "dark"`.

## SEO, AEO, GEO

- Hver side har `generateMetadata` fra `src/seo/metadata.ts` og JSON-LD via `<JsonLd>` med builders fra `src/seo/schema/`.
- Aldri håndskrevet JSON-LD i komponenter.
- Innhold skal følge «siterbart innhold»-reglene: svar først, faktatetthet, kilder inline, datert.
- `robots.txt` slipper AI-crawlere inn som standard. Endres kun i `site.config.ts` etter beslutning fra kunden.
- Testdomener: `src/proxy.ts` setter noindex på alle host som ikke er `NEXT_PUBLIC_SITE_URL`. Canonical, sitemap og llms.txt bruker alltid `siteUrl()`; aldri `request.url`/host for absolutte lenker.

## MCP for kundens agenter

- `src/mcp/server.ts` eksponerer verktøy (lese, utkast, `check_against_guide`) og oppgavemaler (`prompts.ts`) på `/api/mcp`. Nøkler i `AGENT_API_KEYS`.
- Agenter publiserer aldri; alt lagres med `status: "draft"` og `agentMeta` (hvem, hvilken mal, versjon).
- Ny oppgavemal: legg til i `prompts.ts` med versjon, test i `tests/unit/mcp-server.test.ts`. Endrer du en mal, øk versjonen.
- `guard.ts` er regelbasert og deterministisk. Nye regler der, med test.

## Rettigheter

- `src/content/permissions.ts` er kilden for roller og redigeringsnivåer. Puck og CMS leser derfra.
- Globale ting (header, footer, tokens, juridiske sider) er `locked`.
- Låste felt håndheves på serversiden av `applyLockedFields()` i `src/content/permissions.ts`, brukt av `/api/puck`, MCP og Payload-hooken. Puck-UI skjuler dem bare. Identitet for `/edit` og `/api/puck` kommer fra `src/lib/editor-auth.ts` (Payload-bruker, ellers `EDITOR_PASSWORD`).

## Grensen mot n8n

- Nettsiden eier: innhold, visning, skjemainnsending (lagring + webhook).
- n8n eier: alt som skjer *etter* at data er sendt – CRM, e-post, varsler, rapporter, overvåking.
- Nettsiden kaller aldri eksterne tjenester direkte fra en handler; den poster til `FORMS_WEBHOOK_URL`.
- Nedetid: `getSiteSettings`/`getMenu` serverer sist kjente verdi via `withLastKnownGood`; uhåndterte serverfeil går via `instrumentation.ts` → `reportError` → Studio (`STUDIO_URL`, `STUDIO_API_KEY`, `SITE_SLUG`), som lager varsel. Lov aldri i UI noe koden ikke gjør.

## Gjør aldri

- Ikke endre `schema/` uten å kjøre `pnpm generate:schema` og oppdatere alle adaptere i repoet.
- Ikke skru av lint-regler eller tester for å få grønt.
- Ikke legg hemmeligheter i kode. `.env.local` og `.env.example`.
- Ikke slett migreringer som er kjørt i produksjon.
- Ikke legg til avhengigheter uten begrunnelse i PR-beskrivelsen. Foretrekk det vi har.

## Når du er usikker

Spør, eller skriv antakelsen din øverst i PR-beskrivelsen. Ikke gjett stille.
