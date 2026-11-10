#!/usr/bin/env bash
# Bootstrap av en fersk Ubuntu-VPS (ServeTheWorld) for nettside + Studio.
# Gjør steg 2–5 i docs/hosting-servetheworld.md: bruker, SSH-herding, brannmur, Docker, kode, .env.prod.
#
# Kjør som root på serveren:
#   curl -fsSL https://raw.githubusercontent.com/Garpcity/web-standard-template/main/deploy/bootstrap.sh -o bootstrap.sh
#   SITE_DOMAIN=admoment.preikestol.no SITE_SLUG=admoment STUDIO_DOMAIN=studio.trygo.no bash bootstrap.sh
#   (SITE_DOMAIN = testdomenet først; PREVIEW_DOMAIN settes automatisk til <slug>.preikestol.no)
#
# Private repoer: GITHUB_TOKEN (fine-grained, Contents: read på begge repoene) trengs for kloning.
# Skriptet kan kjøres på nytt; det hopper over det som alt er gjort.
set -euo pipefail

: "${SITE_DOMAIN:?Sett SITE_DOMAIN (f.eks. admoment.no)}"
: "${STUDIO_DOMAIN:?Sett STUDIO_DOMAIN (f.eks. studio.trygo.no)}"
SITE_SLUG="${SITE_SLUG:-${SITE_DOMAIN%%.*}}"
PREVIEW_DOMAIN="${PREVIEW_DOMAIN:-$SITE_SLUG.preikestol.no}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
GITHUB_ORG="${GITHUB_ORG:-Garpcity}"
SITE_REPO="${SITE_REPO:-web-standard-template}"
STUDIO_REPO="${STUDIO_REPO:-web-studio}"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"
APPS="/home/$DEPLOY_USER/apps"

log() { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }

[ "$(id -u)" = 0 ] || { echo "Kjør som root"; exit 1; }

log "Systemoppdatering"
export DEBIAN_FRONTEND=noninteractive
apt-get update -q && apt-get upgrade -yq
apt-get install -yq ca-certificates curl gnupg git ufw unattended-upgrades openssl

log "Bruker $DEPLOY_USER"
if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" "$DEPLOY_USER"
  usermod -aG sudo "$DEPLOY_USER"
  echo "$DEPLOY_USER ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/90-$DEPLOY_USER
  chmod 440 /etc/sudoers.d/90-$DEPLOY_USER
fi
install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
if [ -s /root/.ssh/authorized_keys ]; then
  cp /root/.ssh/authorized_keys "/home/$DEPLOY_USER/.ssh/authorized_keys"
  chown "$DEPLOY_USER:$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh/authorized_keys"
  chmod 600 "/home/$DEPLOY_USER/.ssh/authorized_keys"
  HAS_KEY=1
else
  HAS_KEY=0
  echo "ADVARSEL: ingen SSH-nøkkel på root. Passord-innlogging beholdes til du har lagt inn nøkkel for $DEPLOY_USER."
fi

log "SSH-herding"
mkdir -p /etc/ssh/sshd_config.d
{
  echo "PermitRootLogin no"
  [ "$HAS_KEY" = 1 ] && echo "PasswordAuthentication no"
  echo "KbdInteractiveAuthentication no"
} > /etc/ssh/sshd_config.d/90-hardening.conf
systemctl restart ssh 2>/dev/null || systemctl restart sshd

log "Brannmur (22, 80, 443)"
ufw allow OpenSSH >/dev/null
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
ufw --force enable >/dev/null

log "Automatiske sikkerhetsoppdateringer"
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF

log "Docker"
if ! command -v docker >/dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list
  apt-get update -q && apt-get install -yq docker-ce docker-ce-cli containerd.io docker-compose-plugin
fi
usermod -aG docker "$DEPLOY_USER"
systemctl enable --now docker >/dev/null

log "Kode til $APPS"
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$APPS"
clone() { # repo, mål
  local url="https://github.com/$GITHUB_ORG/$1.git"
  [ -n "$GITHUB_TOKEN" ] && url="https://x-access-token:$GITHUB_TOKEN@github.com/$GITHUB_ORG/$1.git"
  if [ -d "$APPS/$2/.git" ]; then
    sudo -u "$DEPLOY_USER" git -C "$APPS/$2" pull -q
  else
    sudo -u "$DEPLOY_USER" git clone -q "$url" "$APPS/$2"
  fi
  # Ikke la token ligge igjen i .git/config
  sudo -u "$DEPLOY_USER" git -C "$APPS/$2" remote set-url origin "https://github.com/$GITHUB_ORG/$1.git"
}
clone "$SITE_REPO" "site-$SITE_SLUG"
clone "$STUDIO_REPO" "web-studio"

log ".env.prod"
ENV="$APPS/site-$SITE_SLUG/.env.prod"
if [ ! -f "$ENV" ]; then
  cp "$APPS/site-$SITE_SLUG/.env.prod.example" "$ENV"
  sed -i "s/^SITE_DOMAIN=.*/SITE_DOMAIN=$SITE_DOMAIN/; s/^PREVIEW_DOMAIN=.*/PREVIEW_DOMAIN=$PREVIEW_DOMAIN/; s/^STUDIO_DOMAIN=.*/STUDIO_DOMAIN=$STUDIO_DOMAIN/; s/^SITE_SLUG=.*/SITE_SLUG=$SITE_SLUG/" "$ENV"
  for v in POSTGRES_PASSWORD SITE_PAYLOAD_SECRET STUDIO_PAYLOAD_SECRET REVALIDATE_SECRET STUDIO_API_KEY STUDIO_MCP_KEY SEED_ADMIN_PASSWORD FORMS_WEBHOOK_SECRET; do
    sed -i "s/^$v=.*/$v=$(openssl rand -hex 24)/" "$ENV"
  done
  sed -i "s/^AGENT_API_KEYS=.*/AGENT_API_KEYS=kunde-agent:$(openssl rand -hex 24)/" "$ENV"
  [ -n "$GITHUB_TOKEN" ] && sed -i "s/^GITHUB_TOKEN=.*/GITHUB_TOKEN=$GITHUB_TOKEN/" "$ENV"
  chown "$DEPLOY_USER:$DEPLOY_USER" "$ENV" && chmod 600 "$ENV"
  echo "Opprettet $ENV med genererte hemmeligheter."
else
  echo "$ENV finnes fra før – ikke rørt."
fi

# Daglig backup
log "Backup-cron (03:00)"
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" "/home/$DEPLOY_USER/backups"
cat > /etc/cron.d/site-backup <<EOF
0 3 * * * $DEPLOY_USER cd $APPS/site-$SITE_SLUG && docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T postgres pg_dumpall -U app | gzip > /home/$DEPLOY_USER/backups/pg-\$(date +\\%F).gz && docker run --rm -v site-${SITE_SLUG}_site-media:/m -v /home/$DEPLOY_USER/backups:/b alpine tar czf /b/media-\$(date +\\%F).tgz -C /m . ; find /home/$DEPLOY_USER/backups -mtime +14 -delete
EOF

cat <<EOF

Ferdig. Neste:
  1. Sjekk DNS:  dig +short $SITE_DOMAIN   og   dig +short $STUDIO_DOMAIN   (begge skal gi denne serverens IP)
  2. Logg inn som $DEPLOY_USER:  ssh $DEPLOY_USER@<IP>
  3. Start alt:
       cd $APPS/site-$SITE_SLUG
       docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
  4. Seed (steg 7 i docs/hosting-servetheworld.md). Hemmeligheter står i $ENV
     (SEED_ADMIN_PASSWORD er admin-passordet første gang; SEED_ADMIN_EMAIL kan du endre før seed).
EOF
