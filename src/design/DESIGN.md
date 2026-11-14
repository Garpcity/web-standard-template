# DESIGN.md – estetiske prinsipper og bevegelsesoppskrifter

AI leser denne filen før den lager eller endrer blokker. Mennesker oppdaterer den hver gang de ser noe de vil ha mer av. Filen vokser; den skal aldri bli generisk.

## Prinsipper

1. **Hierarki før dekorasjon.** Én ting dominerer hver seksjon. Hvis alt er stort, er ingenting viktig.
2. **Luft er et designelement.** Bruk `--space-*`-tokens generøst. Seksjoner skal puste; standard vertikal avstand mellom seksjoner er `--space-section`.
3. **Rytme.** Gjenta få størrelser (`--text-*`-skalaen), få avstander, få radier. Variasjon skapes med innhold og bilder, ikke med nye verdier.
4. **Bevegelse støtter innhold.** Animasjon viser rekkefølge, retning eller respons – aldri bare «fordi det er mulig». Hvis du ikke kan si hva en animasjon forklarer, fjern den.
5. **Rolig som standard, uttrykksfull der det teller.** Brødtekst og lister beveger seg lite. Hero, tall og overganger får lov til å ta plass.
6. **Alt skal fungere uten bevegelse.** `prefers-reduced-motion` gir samme innhold uten animasjon. Oppskriftene håndterer dette.
7. **Bilder er innhold.** Ekte bilder fra kunden slår alltid stock. Format og beskjæring er låst per blokk; innholdet er kundens.
8. **Typografi bærer merkevaren.** Skift `--font-display` og `--font-body` i tokens per kunde før du vurderer noe annet.

## Tokens (`tokens.css`)

Alle farger, fonter, avstander og radier er CSS-variabler. Per kunde byttes kun `tokens.css`. Komponenter leser tokens via Tailwind-klasser (`bg-surface`, `text-fg-muted`, `rounded-card`).

## Bevegelsesoppskrifter (`motion.ts`)

| Navn | Bruk når | Beskrivelse |
| --- | --- | --- |
| `reveal` | Enhver seksjon som kommer inn i viewport | Fade + 16px opp, 0,6 s, ease-out. CSS-basert: synlig uten JS. Standard for nesten alt. |
| `stagger` | Lister, kort, ansatte, logoer | Barn vises med 60 ms forskyvning. Kombineres med `reveal`-varianter. |
| `heroParallax` | Hero-bilde | Bildet beveger seg saktere enn scroll (0,85). Kun på desktop. |
| `scaleIn` | Tall, ikoner, badges | Fra 0,9 til 1 med lett overshoot. Kort og tydelig. |
| `heroIn` | Hero-tekst og -bilde ved innlasting | CSS-keyframe, 0,6 s, uavhengig av JS. Hero bruker aldri `reveal`. |
| `revealEager` | Første element i en liste over folden | `<RevealChild eager>`: samme look som `reveal`, men keyframe-basert så LCP ikke venter på JS. `BlockRenderer` sender `aboveFold` til første blokk; første bilde der får også `priority`. |
| `pageTransition` | Mellom ruter | Kort crossfade, 200 ms. Aldri lengre. |
| `hoverLift` | Kort og knapper | 2px opp + skyggeøkning på hover. 150 ms. |
| `countUp` | Nøkkeltall | Teller fra 0 til verdi når synlig. 1,2 s. |

**LCP-regel.** Det første bildet som kan vises over folden (hero, første kort i en liste) lastes med `priority` og animeres med `heroIn`/`revealEager`, aldri `loading="lazy"` + observer. Totaltesten 10.11.2026 viste at dette alene flyttet mobil-LCP fra 4,0 s til 0,9 s.

Ny oppskrift: legg den til i `motion.ts` med JSDoc, legg til en rad her, og bruk den i minst én blokk.

## 3D

Produseres i Cinema 4D, leveres som glTF/GLB, rendres med React Three Fiber via `<Model3dViewer>`. Regler og eksportrutine i `3D-PIPELINE.md`. Kort: under 2 MB per scene, bakt lys, alltid poster-fallback, aldri før første innholdsvisning.

## Logg over estetiske valg

| Dato | Hva | Hvorfor |
| --- | --- | --- |
| 2026-11-10 | Første versjon: rolig base, reveal + stagger som standard | Gir et profesjonelt uttrykk uten at kunden må ta stilling til animasjon |
| 2026-11-10 | Reveal flyttet fra Motion til CSS + IntersectionObserver | Server-HTML var usynlig (opacity 0) til JS kjørte. Dårlig for LCP, crawlere og no-JS. Nå alltid synlig. |
| 2026-11-10 | Aksentfarge mørknet fra #e36414 til #c2460a | Hvit tekst på knapper hadde kontrast 3,4:1; nå > 4,5:1 (WCAG AA). Lighthouse krevde det. |
| 2026-11-10 | 3D-blokk `model3d` med demo-geometri, lazy loading og poster-fallback | Lar oss vise 3D uten å koste noe på sider som ikke bruker det |
| 2026-11-14 | Tabellblokk `dataTable`: tabell på eget `bg-surface`-kort, `bg-surface-muted` header, horisontal scroll på mobil, tall høyrejustert, tabelltekst og kilde i kortets bunn | Kortet gir riktig kontrast i alle toner (også `dark`). Scroll i stedet for stabling bevarer sammenligningen. Datert kilde gjør tallene siterbare. |
