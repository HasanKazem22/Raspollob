#!/usr/bin/env bash
# One-time setup of a fresh Ubuntu 22.04 / 24.04 VPS for Raspollob.
#
#   Usage (as root, from the folder that holds this script and the other deploy files):
#     bash setup-vps.sh --domain example.com --email you@example.com --owner your-github-username [--staging]
#
#   It installs Docker, Nginx and free HTTPS, turns on the firewall, brute-force protection,
#   automatic security updates and swap, creates the "deploy" user GitHub Actions logs in as,
#   prepares /opt/raspollob/<env> with strong random passwords, and schedules nightly backups.
#   Safe to run again: existing passwords and data are never overwritten.
set -euo pipefail

DOMAIN=""; EMAIL=""; OWNER=""; WITH_STAGING=false
while [ $# -gt 0 ]; do
  case "$1" in
    --domain) DOMAIN="$2"; shift 2 ;;
    --email) EMAIL="$2"; shift 2 ;;
    --owner) OWNER="$(echo "$2" | tr '[:upper:]' '[:lower:]')"; shift 2 ;;
    --staging) WITH_STAGING=true; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done
if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ] || [ -z "$OWNER" ]; then
  echo "Usage: bash setup-vps.sh --domain example.com --email you@example.com --owner your-github-username [--staging]"
  exit 1
fi
[ "$(id -u)" -eq 0 ] || { echo "Run as root (sudo -i)."; exit 1; }

HERE="$(cd "$(dirname "$0")" && pwd)"
APP_ROOT=/opt/raspollob
step() { echo; echo "==> $*"; }

step "System updates and base packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get upgrade -yq
apt-get install -yq ca-certificates curl openssl ufw fail2ban unattended-upgrades nginx certbot python3-certbot-nginx
dpkg-reconfigure -f noninteractive unattended-upgrades

step "Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker

step "Swap (keeps Java and the database stable on small servers)"
if ! swapon --show | grep -q .; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

step "Firewall: only SSH, HTTP and HTTPS are open"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
systemctl enable --now fail2ban

step "Deploy user (GitHub Actions signs in as this user)"
if ! id deploy >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" deploy
fi
usermod -aG docker deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
touch /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys && chmod 600 /home/deploy/.ssh/authorized_keys

step "App folders and scripts"
ENVIRONMENTS=(production)
if $WITH_STAGING; then ENVIRONMENTS+=(staging); fi
install -d -o deploy -g deploy "$APP_ROOT" "$APP_ROOT/backups"
install -m 755 -o deploy -g deploy "$HERE/backup.sh" "$APP_ROOT/backup.sh"
install -m 755 -o deploy -g deploy "$HERE/restore.sh" "$APP_ROOT/restore.sh"

for ENV in "${ENVIRONMENTS[@]}"; do
  DIR="$APP_ROOT/$ENV"
  install -d -o deploy -g deploy "$DIR" "$APP_ROOT/backups/$ENV"
  install -m 644 -o deploy -g deploy "$HERE/docker-compose.yml" "$DIR/docker-compose.yml"
  if [ ! -f "$DIR/.env" ]; then
    if [ "$ENV" = production ]; then
      TAG=main; GUI=3000; API=8085; URL="https://$DOMAIN"
    else
      TAG=develop; GUI=3001; API=8086; URL="https://staging.$DOMAIN"
    fi
    cat > "$DIR/.env" <<EOF
APP_ENV=$ENV
IMAGE_OWNER=$OWNER
IMAGE_TAG=$TAG
GUI_PORT=$GUI
SERVER_PORT=$API
POSTGRES_DB=raspollob
POSTGRES_USER=raspollob
POSTGRES_PASSWORD=$(openssl rand -hex 24)
JWT_SECRET=$(openssl rand -base64 48 | tr -d '\n')
FRONTEND_URL=$URL
JPA_SHOW_SQL=false
EOF
    chown deploy:deploy "$DIR/.env" && chmod 600 "$DIR/.env"
    echo "Created $DIR/.env with new random passwords"
  else
    echo "Kept existing $DIR/.env"
  fi
done

step "Nginx (one site per environment)"
install -m 644 "$HERE/nginx/raspollob-proxy.conf" /etc/nginx/snippets/raspollob-proxy.conf
site() { # $1 = server names, $2 = frontend port, $3 = API port
  cat <<EOF
server {
    listen 80;
    server_name $1;
    client_max_body_size 30M;

    location /api/     { proxy_pass http://127.0.0.1:$3; include /etc/nginx/snippets/raspollob-proxy.conf; }
    location /uploads/ { proxy_pass http://127.0.0.1:$3; include /etc/nginx/snippets/raspollob-proxy.conf; expires 30d; }
    location /         { proxy_pass http://127.0.0.1:$2; include /etc/nginx/snippets/raspollob-proxy.conf; }
}
EOF
}
{
  site "$DOMAIN www.$DOMAIN" 3000 8085
  if $WITH_STAGING; then site "staging.$DOMAIN" 3001 8086; fi
} > /etc/nginx/sites-available/raspollob.conf
ln -sf /etc/nginx/sites-available/raspollob.conf /etc/nginx/sites-enabled/raspollob.conf
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

step "Free HTTPS certificate (needs the domain's DNS to point at this server)"
CERT_DOMAINS=(-d "$DOMAIN" -d "www.$DOMAIN")
if $WITH_STAGING; then CERT_DOMAINS+=(-d "staging.$DOMAIN"); fi
if certbot --nginx "${CERT_DOMAINS[@]}" --non-interactive --agree-tos -m "$EMAIL" --redirect; then
  echo "HTTPS is on (renews automatically)"
else
  echo "HTTPS not set up yet: point the DNS records at this server, then run:"
  echo "  certbot --nginx ${CERT_DOMAINS[*]} -m $EMAIL --agree-tos --redirect"
fi

step "Nightly backups at 03:30 (database + photos, kept 14 days)"
touch /var/log/raspollob-backup.log && chown deploy:deploy /var/log/raspollob-backup.log
{
  echo "# Raspollob nightly backups"
  for ENV in "${ENVIRONMENTS[@]}"; do
    echo "30 3 * * * deploy $APP_ROOT/backup.sh $ENV >> /var/log/raspollob-backup.log 2>&1"
  done
} > /etc/cron.d/raspollob-backup
chmod 644 /etc/cron.d/raspollob-backup

echo
echo "────────────────────────────────────────────────────────────────"
echo " VPS ready. Next (see README → Deployment):"
echo "  1. Add the GitHub deploy key to /home/deploy/.ssh/authorized_keys"
echo "  2. Add the GitHub secrets VPS_HOST, VPS_USER=deploy, VPS_SSH_KEY"
echo "  3. Set the repository variable DEPLOY_ENABLED=true and push to main"
echo "  4. Open https://$DOMAIN/admin, sign in as admin / admin123, change the password"
echo "────────────────────────────────────────────────────────────────"
