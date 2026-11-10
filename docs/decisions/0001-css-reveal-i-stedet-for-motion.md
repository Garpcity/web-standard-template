# 0001 – Scroll-inntreden med CSS + IntersectionObserver, ikke Motion

Dato: 2026-11-10 · Status: vedtatt

## Kontekst
Første versjon brukte Motion (`whileInView`, `initial="hidden"`) for reveal/stagger. Server-HTML fikk da `opacity: 0` inline, og alt innhold var usynlig til JavaScript hadde hydrert. Skjermbilde av bygget side bekreftet det: tom side under hero.

## Beslutning
Reveal, stagger, scaleIn og heroIn er CSS-oppskrifter i `globals.css`. Skjult tilstand gjelder kun når `<html>` har klassen `js` (satt av inline-script) og elementet ikke har `is-visible` (satt av `RevealObserver`). Uten JS, for crawlere og ved `prefers-reduced-motion` er alt synlig. `<Reveal>`/`<Stagger>` er Server Components uten klientbundle. Motion brukes fortsatt der JS trengs uansett: `CountUp`, `HeroParallax`, `pageTransition`.

## Konsekvenser
- LCP og SEO upåvirket av animasjon (Lighthouse 100 på ytelse og SEO)
- Mindre JS per side
- Overgangene er CSS-transitions med samme varighet og easing som før
- Hva ville fått oss til å snu: behov for komplekse koreografier som CSS ikke dekker – da vurderes Motion med `initial={false}` + egen synlighetslogikk
