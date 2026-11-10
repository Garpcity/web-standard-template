# Sjekkliste før lansering

Kopier til en issue i prosjektet. Alt skal være krysset av før DNS pekes om.

## Teknisk
- [ ] Domene og DNS satt opp, HTTPS aktivt, www-redirect på plass
- [ ] `NEXT_PUBLIC_SITE_URL` satt til produksjons-URL
- [ ] Redirects fra gammel side importert (`redirects`) og testet
- [ ] 404- og feilside testet
- [ ] `pnpm check`, `pnpm test:e2e` og `pnpm lighthouse` grønne mot produksjonsbygg
- [ ] Lighthouse mobil på produksjons-URL: ytelse ≥ 90, tilgjengelighet ≥ 95, SEO ≥ 95

## Innhold og SEO
- [ ] Alle sider har metatittel, metabeskrivelse og delingsbilde
- [ ] `noindex` fjernet fra alt som skal indekseres; `/profil` og `/edit` er `noindex`
- [ ] Sitemap sendt til Google Search Console og Bing Webmaster
- [ ] JSON-LD validert (Organization, WebSite, Article, Person, FAQPage, BreadcrumbList)
- [ ] `robots.txt`: AI-crawler-beslutning tatt av kunden og dokumentert i README
- [ ] `llms.txt` lest gjennom; profilmanualens fakta er korrekte

## AEO / GEO
- [ ] Hver artikkel har kort svar (40–60 ord) øverst
- [ ] Forfattere har navn, rolle, `knowsAbout` og `credentials`
- [ ] Organization har `sameAs` til alle offisielle profiler
- [ ] Minst én side med originale data (egne tall, priser, målinger)
- [ ] Kundens 20–50 kjernespørsmål listet opp for månedlig AI-synlighetsmåling

## Personvern og samtykke
- [ ] Personvernerklæring på plass og lenket i footer
- [ ] Analytics uten cookies (Plausible/Umami) eller samtykkebanner aktivt
- [ ] Skjemainnsendinger går til riktig n8n-webhook; e-postvarsel kommer frem

## Drift
- [ ] Backup av database verifisert (se standardens Drift-seksjon)
- [ ] Oppetidsovervåking og feilrapportering aktiv
- [ ] Redaktører opprettet med riktig rolle, opplæring gjennomført
- [ ] Rettighetsprofil (`permissions.ts`) gjennomgått med kunden

## Overlevering
- [ ] README oppdatert: CMS-valg, avvik fra standard, kontaktpersoner
- [ ] Kunden eier repo, domene, database og hostingkonto
- [ ] Overleveringsmøte gjennomført
