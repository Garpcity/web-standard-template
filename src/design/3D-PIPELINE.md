# 3D-pipeline: Cinema 4D → web

Alt 3D på nettsider går gjennom denne rutinen. Målet er at AI kan lage en ferdig blokk av en `.glb` uten spørsmål.

## Når 3D, når video
| Bruk | Lever som |
| --- | --- |
| Interaktivt (dreie, konfigurere, hover) | `.glb` → `model3d`-blokk |
| Kinematisk hero uten interaksjon | Redshift-render → WebM/AV1 + MP4-fallback → `embed`/hero-video |
| Scroll-styrt sekvens | `.glb` med animasjonsklipp, eller WebP-sekvens |

## Budsjett per scene
- Total nedlasting < 2 MB (Draco-komprimert), < 100k polygoner
- Teksturer ≤ 2048 px, KTX2/Basis der det går, ellers WebP
- Maks 4 materialer; ingen sanntids-skygger med mindre interaksjon krever det

## Eksport fra Cinema 4D
1. Skaler scenen til meter; 1 enhet = 1 m. Modellen skal passe i en boks på ca. 2 × 2 × 2 m sentrert i origo, Y opp.
2. Bak lys og AO til teksturer (Bake Object). Fjern lys og kamera fra eksporten.
3. Navngi materialer og objekter på engelsk uten mellomrom (`body_metal`, `glass_front`).
4. Animasjon: ett klipp per handling, navngitt (`idle`, `open`). Bak PSR før eksport.
5. Eksporter glTF binary (`.glb`) med «Textures: embedded», «Draco: on».
6. Etterbehandle:
   ```bash
   npx @gltf-transform/cli optimize in.glb out.glb --compress draco --texture-compress webp
   npx @gltf-transform/cli inspect out.glb   # sjekk størrelse og polygoner mot budsjettet
   ```
7. Legg `out.glb` i `public/models/<navn>.glb` (eller last opp som Media i CMS) og lag et poster-bilde (1600×1200, samme vinkel som startposisjonen).

## I nettsiden
- `model3d`-blokk: `src` = URL til `.glb`, `alt` = beskrivelse, `poster` = fallback-bilde
- Komponentene i `src/components/three/` er eneste vei inn. Ikke lag egne `<Canvas>` i blokker.
- `Model3dViewer` laster lazy ved synlighet, faller tilbake til poster ved `prefers-reduced-motion`, manglende WebGL, `saveData` eller lite minne.
- Lighthouse-terskelen gjelder også sider med 3D. Overskrider en side budsjettet, bruk video.

## Sjekkliste før merge
- [ ] `gltf-transform inspect` innenfor budsjett
- [ ] Poster-bilde satt
- [ ] Alt-tekst beskriver hva modellen viser
- [ ] Testet med reduced motion (fallback vises)
- [ ] Lighthouse mobil ≥ 90 på siden
