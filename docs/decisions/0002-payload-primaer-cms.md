# 0002 – Payload er primær-CMS for nye kunder; WordPress er migrasjonsspor

Dato: 2026-11-10 · Status: vedtatt

## Beslutning

Nye nettsider bygges på Payload (i samme Next.js-app). WordPress-adapteren og `site-core`-pluginen
beholdes for kunder som allerede har WordPress-innhold eller -redaktører, og vedlikeholdes på samme
kontrakt, men nye funksjoner lander i Payload først.

## Grunnlag

Totaltesten 10.11.2026 og den eksterne gjennomgangen viste at tre av standardens løfter bare holder
fullt i Payload: rollebaserte rettigheter håndhevet på serversiden (Payload-bruker i `/edit`,
`/api/puck` og admin-hook), agentutkast som aldri rører publisert innhold (WordPress-REST kjenner
ikke status), og on-demand revalidering uten ekstern konfigurasjon (Payload-hooks i samme prosess).
To fulle CMS-er parallelt gir tre adaptere å endre ved hver kontraktendring, og pluginen har ingen
tester i CI. Med tre ansatte er det tempoet som avgjør.

## Hva som ville fått oss til å snu

- En kunde-portefølje der flertallet allerede står på WordPress og redaktørene ikke vil bytte.
- Payload endrer lisens eller bryter 3.x-API-et i et tempo vi ikke klarer å følge.
- WordPress-pluginen får egen utkastlagring, status i REST, revalidering og PHPUnit i CI –
  da er sporene likeverdige igjen og beslutningen kan revurderes.

## Konsekvenser

- `CMS_PROVIDER=payload` er standard i `.env.example`, `docker-compose.yml` og Studio (`cms`).
- Studio-provisjonering setter Payload som standard CMS.
- WordPress-dokumentasjonen merkes «migrasjon fra eksisterende WordPress».
