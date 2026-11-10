# Flytt hele flyten til ServeTheWorld – stegvis

Målet: nettsiden (Payload) og Studio kjører på én Linux-VPS hos ServeTheWorld, bak Caddy med
automatisk HTTPS, og n8n Cloud snakker med Studio. Alt kjører som Docker-containere fra
`docker-compose.prod.yml`. Tidsbruk første gang: 1–2 timer.

Det du trenger: en VPS med root-tilgang (Ubuntu 24.04 LTS, minst 2 vCPU / 4 GB RAM / 40 GB disk),
to domener/subdomener du kontrollerer DNS for, og GitHub-tilgang til de to repoene.

## 1. Bestill VPS og sett DNS

1. Bestill en Linux-VPS hos ServeTheWorld med Ubuntu 24.04 LTS. Velg SSH-nøkkel hvis det tilbys;
   ellers får du root-passord på e-post.
2. Noter den offentlige IPv4-adressen.
3. Opprett A-poster i DNS (ServeTheWorld DNS eller der domenet ligger):
   - `admoment.no` → IP (og `www` som CNAME til `admoment.no`)
   - `studio.trygo.no` → IP
4. Vent til `dig +short studio.trygo.no` viser IP-en før steg 5 (Caddy trenger det for sertifikat).

## Snarvei: steg 2–5 i ett skript

`deploy/bootstrap.sh` gjør alt i steg 2–5 (bruker, SSH-herding, brannmur, Docker, kloning, `.env.prod`
med genererte hemmeligheter, backup-cron). Kjør som root på den nye serveren:

```bash
curl -fsSL https://raw.githubusercontent.com/Garpcity/web-standard-template/main/deploy/bootstrap.sh -o bootstrap.sh
SITE_DOMAIN=admoment.no STUDIO_DOMAIN=studio.trygo.no GITHUB_TOKEN=github_pat_... bash bootstrap.sh
```

Er repoene private, må `GITHUB_TOKEN` ha *Contents: read* på begge (og rettighetene i steg 5 hvis
samme token skal brukes av Studio). Deretter fortsetter du på steg 6. Stegene under er det samme,
manuelt.

## 2. Grunnsikring av serveren (10 min)

```bash
ssh root@<IP>
apt update && apt upgrade -y
adduser deploy && usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh && cp ~/.ssh/authorized_keys /home/deploy/.ssh/ && chown -R deploy:deploy /home/deploy/.ssh
# Deaktiver root-innlogging og passord over SSH
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/; s/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh
# Brannmur: bare SSH, HTTP, HTTPS
apt install -y ufw && ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw --force enable
# Automatiske sikkerhetsoppdateringer
apt install -y unattended-upgrades && dpkg-reconfigure -plow unattended-upgrades
```

Logg ut og inn igjen som `deploy@<IP>` før du går videre.

## 3. Installer Docker

```bash
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update && sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker deploy && newgrp docker
docker run --rm hello-world
```

## 4. Hent koden

Begge repoene må ligge side om side, fordi `docker-compose.prod.yml` bygger Studio fra `../web-studio`.

```bash
sudo apt install -y git
mkdir -p ~/apps && cd ~/apps
git clone https://github.com/Garpcity/web-standard-template.git site-admoment
git clone https://github.com/Garpcity/web-studio.git web-studio
```

Private repoer: lag en fine-grained PAT med *Contents: read* og bruk
`https://<token>@github.com/Garpcity/....git`, eller legg til en deploy-nøkkel.

For en kundeside klones kundens repo (`site-<slug>`) i stedet for templaten; alt annet er likt.

## 5. Hemmeligheter og domener

```bash
cd ~/apps/site-admoment
cp .env.prod.example .env.prod
for v in POSTGRES_PASSWORD SITE_PAYLOAD_SECRET STUDIO_PAYLOAD_SECRET REVALIDATE_SECRET STUDIO_API_KEY STUDIO_MCP_KEY SEED_ADMIN_PASSWORD; do
  sed -i "s/^$v=.*/$v=$(openssl rand -hex 32)/" .env.prod
done
nano .env.prod   # sett SITE_DOMAIN, STUDIO_DOMAIN, AGENT_API_KEYS, FORMS_WEBHOOK_SECRET, GITHUB_TOKEN
chmod 600 .env.prod
```

`GITHUB_TOKEN` for Studio: fine-grained PAT på organisasjonen Garpcity med
*Administration: read/write* (opprette repo fra template), *Issues: read/write*, *Pull requests: read*,
*Contents: read*, *Actions: read/write*.

## 6. Bygg og start

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f --tail=50
```

Første bygg tar 5–10 minutter. Når loggene viser `Ready` for `site` og `studio`, sjekk:

```bash
curl -I https://admoment.no/robots.txt          # 200, gyldig sertifikat
curl -I https://studio.trygo.no/admin/login   # 200
```

Feilsøking: `docker compose ... ps` viser helsestatus; `docker compose ... logs caddy` viser
sertifikatfeil (nesten alltid DNS som ikke peker riktig ennå).

## 7. Seed og første bruker

```bash
set -a; source .env.prod; set +a
# Nettsiden: owner-bruker, globals og eksempelinnhold
curl -X POST https://$SITE_DOMAIN/api/seed -H "x-payload-secret: $SITE_PAYLOAD_SECRET"
# Studio: owner-bruker, AD.Moment og pilotsiden
curl -X POST https://$STUDIO_DOMAIN/api/seed -H "x-payload-secret: $STUDIO_PAYLOAD_SECRET"
```

Seed bruker `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` fra miljøet (standard `admin@example.com` /
`change-me-now`). Logg inn på `/admin` i begge og **bytt passord med én gang**. I Studio: åpne
nettsiden «AD.Moment – pilot», sett produksjons-URL til `https://admoment.no` og legg inn et
miljø (production) med samme URL – da måler helse-sjekken riktig adresse.

## 8. Koble n8n Cloud til Studio

1. I n8n: *Credentials → New → Custom Auth*. Navn «Studio x-studio-key». JSON:
   `{ "headers": { "x-studio-key": "<STUDIO_API_KEY fra .env.prod>" } }`.
2. Åpne flyten «AD.Moment – nettside: månedlig AI-synlighet (via Studio)». I noden «Studio»:
   sett `studioUrl` til `https://studio.trygo.no`. Velg credentialen på «Hent kjernespørsmål fra
   Studio» og «Lever til Studio». Kjør flyten manuelt én gang og se at Studio får metrikker og
   innholdsoppgaver.
3. Lag en enkel «hvert 5. minutt»-flyt (Schedule → HTTP POST `https://studio.trygo.no/api/health/run`
   med samme credential). Det er helse-sjekken.
4. Skjema-flyten (01): sett `webhookSecret` i n8n lik `FORMS_WEBHOOK_SECRET`.
5. Arkiver den gamle AI-synlighet-flyten.

## 9. Kundens agenter (MCP)

Gi kunden `https://admoment.no/api/mcp` og nøkkelen fra `AGENT_API_KEYS` (format `navn:nøkkel`).
Instruksjonene ligger i `docs/mcp-for-kunder.md`. Studios egen MCP: `https://studio.trygo.no/api/mcp`
med `STUDIO_MCP_KEY` – for deg, ikke kunden.

## 10. Oppdateringer og drift

Oppdatere til siste kode:

```bash
cd ~/apps/site-admoment && git pull && cd ../web-studio && git pull && cd ../site-admoment
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
docker image prune -f
```

Daglig backup av Postgres og opplastede filer (legg i `crontab -e` som `deploy`):

```bash
0 3 * * * cd ~/apps/site-admoment && docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T postgres pg_dumpall -U app | gzip > ~/backups/pg-$(date +\%F).gz && docker run --rm -v site-admoment_site-media:/m -v ~/backups:/b alpine tar czf /b/media-$(date +\%F).tgz -C /m . && find ~/backups -mtime +14 -delete
```

Kopier `~/backups` ut av serveren (ServeTheWorld backup-tjeneste, eller `rclone` til en bøtte).

Når innholdet har reell verdi: generer Payload-migrasjoner og sett `PAYLOAD_DB_PUSH=false` i
`.env.prod`, slik at skjemaendringer blir eksplisitte (se kommentar i `src/payload.config.ts`).

## Flere kunder på samme server

Hver kundeside er én ekstra `site-<slug>`-tjeneste: klon kundens repo til `~/apps/site-<slug>`,
legg til en tjeneste i compose (kopi av `site` med egen `DATABASE_URL=…/site_<slug>`, egne
hemmeligheter og eget volum), én `CREATE DATABASE` i Postgres, og et domene-blokk i
`deploy/Caddyfile`. Studio er felles. Ved mer enn ~5 sider: vurder Coolify eller én VPS per kunde.
