# SEO-, AEO- og GEO-playbook

Versjon 1.0 · 2026-11-10 · Revideres kvartalsvis. Dette er rutinen; teknikken ligger i templaten.

## Mål
Kundens sider skal bli funnet (SEO), brukt som svar (AEO) og sitert av generative motorer (GEO).

## Innebygd i templaten
- Metadata via `buildMetadata`, JSON-LD via builders, sitemap, robots med AI-crawlere åpne, `llms.txt`
- Blokker bygget for svar: FAQ (FAQPage-skjema), «kort svar»-felt på artikler, definisjons- og sammenligningsformater
- Forfatter med `knowsAbout`/`credentials` (Person-skjema), Organization med `sameAs`
- `dateModified` på alt, kilder (`sources`) på artikler → `citation`

## Siterbart innhold – regler for alt som skrives
1. Svaret først (40–60 ord), selvstående.
2. Ett datapunkt per 150–200 ord.
3. Minst én side med originale data per prosjekt.
4. Kilder inline der påstanden står.
5. Selvstående avsnitt; underoverskrifter som spørsmål.
6. Definisjoner, tabeller, trinnlister, FAQ.
7. Samme navn på entiteter overalt, speilet i JSON-LD.
8. Datert og vedlikeholdt; eldre enn 12 mnd flagges.
9. Ingen publisering uten førstehåndsbidrag fra kunden.

## Månedlig (n8n, fase 5)
- Search Console: klikk, visninger, posisjoner, indekseringsfeil
- CrUX: Core Web Vitals i felt
- AI-synlighet: kundens kjernespørsmål mot ChatGPT, Perplexity, Gemini, AI Mode – nevnt? sitert? hvilken side?
- Crawler-logg: bekreft at AI-boter faktisk crawler
- Resultat: rapport + liste over spørsmål uten sitering → neste måneds innholdsoppgaver

## Kvartalsvis
- Gjennomgå denne playbooken mot nye funn (Google-dokumentasjon, studier, egne tall)
- Oppdater templaten med det som gjelder alle prosjekter (nye skjematyper, blokker, CI-sjekker)
- Logg endringer under.

## Endringslogg
| Dato | Endring | Grunnlag |
| --- | --- | --- |
| 2026-11-10 | Første versjon | Standard for nettsideutvikling, seksjon SEO/AEO/GEO |
