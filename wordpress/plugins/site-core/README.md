# site-core

WordPress-plugin for nettsider bygget på Standard for nettsideutvikling. WordPress er CMS; Next.js er frontend.

## Hva den gjør
- Post type `person`; `page` og `post` brukes som Page og Article
- Meta-felter som speiler Zod-skjemaene (`generated/json-schema`): `site_blocks` (Block[] JSON på sider), `summary`/`sources` på artikler, `role`/`knows_about`/`credentials`/`same_as` på personer, SEO-felt
- Globale JSON-innstillinger: `site_core_settings`, `site_core_brand_guide`, `site_core_redirects`
- GraphQL-felter for alt (krever WPGraphQL), inkl. rotfeltene `settings`, `brandGuide`, `redirects`
- REST: `site-core/v1/pages/{slug}/blocks` (GET/POST) for Puck-editoren, `preview-token`
- Roller: `site_admin`, `site_reviewer`, `site_agent` (speiler `permissions.ts`)
- Herding: redirect av offentlig WP-frontend til Next.js, XML-RPC av, brukerliste skjult

## Oppsett
1. Installer og aktiver **WPGraphQL** og denne pluginen.
2. I `wp-config.php`:
   ```php
   define('SITE_CORE_FRONTEND_URL', 'https://kunde.no');
   define('SITE_CORE_PREVIEW_SECRET', 'langt-tilfeldig-hemmelig');
   ```
3. Importer innstillinger:
   ```bash
   wp option update site_core_settings "$(cat src/content/adapters/mock/data/site.json)"
   wp option update site_core_brand_guide "$(cat src/content/adapters/mock/data/brand-guide.json)"
   ```
4. Opprett menyer og tilordne plasseringene `main`, `footer`, `legal`.
5. Lag et Application Password for brukeren frontend bruker til lagring fra Puck.

## Lokalt
WordPress Studio (anbefalt): opprett side → `wp plugin install wp-graphql --activate` → kopier denne mappen til `wp-content/plugins/site-core` → `wp plugin activate site-core` → `wp eval-file scripts/wp-seed.php <sti-til-data> <frontend-url>`.
Docker: `docker compose --profile wordpress up` monterer mappen som plugin; seed med `scripts/wp-seed.sh`.

Verifisert 2026-11-10 mot WordPress 6.x / WPGraphQL 2.26 i Studio: alle adapter-spørringer kjører feilfritt (`tests/fixtures/wpgraphql-probe.json`).

## Fremover
- Gutenberg-blokker (`block.json`) som alternativ til Puck for redaktører som foretrekker WP-editoren
- Generering av `fields.php` fra `generated/json-schema` (nå håndskrevet speil)

## Revalidering av frontend

Ved lagring av side/innlegg/person, meny, kategorier og JSON-options kaller pluginen `POST {frontend}/api/revalidate`. Sett i `wp-config.php`:

```php
define('SITE_CORE_FRONTEND_URL', 'https://kunde.no');
define('SITE_CORE_REVALIDATE_SECRET', 'samme som REVALIDATE_SECRET i frontend');
```

Uten konfig gjør hooken ingenting; frontend faller tilbake på ISR (60 s for GraphQL-cache, 1 t for sider).
