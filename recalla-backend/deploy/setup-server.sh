#!/usr/bin/env bash
#
# Provision a fresh Oracle Cloud Ubuntu 24.04 ARM instance for Recalla.
#
# Run ON THE SERVER, once:
#   bash setup-server.sh
#
# Everything here is idempotent — safe to re-run if a step fails partway.

set -euo pipefail

APP_DIR=/opt/recalla
PY=python3.12

echo "── System packages ─────────────────────────────────────────"
sudo apt-get update -qq
sudo apt-get install -y -qq \
  python3.12 python3.12-venv python3.12-dev build-essential \
  ffmpeg libsndfile1 git curl ca-certificates \
  postgresql postgresql-contrib libpq-dev

echo "── Firewall ────────────────────────────────────────────────"
# Oracle's Ubuntu images ship iptables rules that REJECT everything except
# SSH, independently of the cloud Security List. Opening the port in the OCI
# console alone is not enough and this is where most deployments stall.
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80  -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save >/dev/null 2>&1 || {
  sudo apt-get install -y -qq iptables-persistent
  sudo netfilter-persistent save
}

echo "── Database ────────────────────────────────────────────────"
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='recalla'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER recalla WITH PASSWORD '${DB_PASSWORD:?set DB_PASSWORD first}';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='recalla'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE recalla OWNER recalla;"

echo "── Python environment ──────────────────────────────────────"
sudo mkdir -p "$APP_DIR"
sudo chown -R "$USER:$USER" "$APP_DIR"
cd "$APP_DIR"
[ -d venv ] || $PY -m venv venv

# Torch has no +cpu ARM wheels; the plain aarch64 wheel from PyPI is correct
# and already CPU-only, so install it before anything that would pull the
# x86 variant in as a dependency.
./venv/bin/pip install --quiet --upgrade pip wheel
./venv/bin/pip install --quiet torch torchaudio
./venv/bin/pip install --quiet -r requirements-server.txt
./venv/bin/python -m spacy download en_core_web_sm

echo "── Caddy (HTTPS, automatic certificates) ───────────────────"
# Meta refuses a webhook without a valid certificate, and a bare IP cannot
# have one. Caddy obtains and renews a real certificate for the hostname.
if ! command -v caddy >/dev/null; then
  sudo apt-get install -y -qq debian-keyring debian-archive-keyring apt-transport-https
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    | sudo tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
  sudo apt-get update -qq && sudo apt-get install -y -qq caddy
fi

echo
echo "Done. Next:"
echo "  1. copy your .env to $APP_DIR/.env (update DATABASE_URL)"
echo "  2. sudo cp deploy/recalla.service /etc/systemd/system/"
echo "  3. sudo cp deploy/Caddyfile /etc/caddy/Caddyfile  (set your hostname)"
echo "  4. sudo systemctl daemon-reload && sudo systemctl enable --now recalla caddy"
