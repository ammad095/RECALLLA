#!/usr/bin/env bash
#
# Start everything Recalla needs, in the right order.
#
#   ./start-recalla.sh              backend + frontend only
#   ./start-recalla.sh --tunnel     also start the public tunnel for WhatsApp
#
# The tunnel uses ngrok with a reserved static domain, so the callback URL in
# Meta never has to be re-pasted. Set NGROK_DOMAIN in recalla-backend/.env.

set -u
cd "$(dirname "$0")"
export PATH="$HOME/.local/bin:$PATH"

BACKEND=recalla-backend
FRONTEND=recalla
LOGS="$BACKEND/logs"
mkdir -p "$LOGS"

up() { (echo > /dev/tcp/127.0.0.1/"$1") >/dev/null 2>&1; }

wait_for() {   # port, label, seconds
  for _ in $(seq 1 "${3:-60}"); do up "$1" && { echo "  $2 ready"; return 0; }; sleep 1; done
  echo "  $2 DID NOT START — see $LOGS"; return 1
}

echo "Recalla"
echo "───────────────────────────────"

# ── Postgres ────────────────────────────────────────────────────────────────
if up 5432; then
  echo "  postgres ready"
else
  echo "  starting postgres…"
  docker start recalla-db >/dev/null 2>&1 || {
    echo "  could not start the recalla-db container. Is Docker running?"; exit 1; }
  wait_for 5432 postgres 30 || exit 1
fi

# ── Backend ─────────────────────────────────────────────────────────────────
if up 8001; then
  echo "  backend ready (already running)"
else
  ( cd "$BACKEND" && setsid nohup ./venv/bin/python -m uvicorn main:app \
      --host 0.0.0.0 --port 8001 > "logs/backend.log" 2>&1 < /dev/null & )
  wait_for 8001 backend 90 || exit 1
fi

# ── Frontend ────────────────────────────────────────────────────────────────
if up 5173; then
  echo "  frontend ready (already running)"
else
  ( cd "$FRONTEND" && setsid nohup npm run dev -- --host \
      > "../$LOGS/frontend.log" 2>&1 < /dev/null & )
  wait_for 5173 frontend 60 || exit 1
fi

# ── Tunnel (optional) ───────────────────────────────────────────────────────
if [ "${1:-}" = "--tunnel" ]; then
  DOMAIN=$(grep -E '^NGROK_DOMAIN=' "$BACKEND/.env" 2>/dev/null | cut -d= -f2- | tr -d ' \r')

  if ! ngrok config check >/dev/null 2>&1; then
    echo
    echo "  ngrok is not configured yet. One time only:"
    echo "    1. sign up free at https://dashboard.ngrok.com"
    echo "    2. ngrok config add-authtoken <your token>"
    echo "    3. reserve your free static domain in the dashboard"
    echo "    4. add NGROK_DOMAIN=<that domain> to $BACKEND/.env"
  elif [ -z "$DOMAIN" ]; then
    echo "  NGROK_DOMAIN is not set in $BACKEND/.env — using a random URL,"
    echo "  which means re-pasting the callback URL into Meta."
    setsid nohup ngrok http 8001 --log stdout > "$LOGS/tunnel.log" 2>&1 < /dev/null &
  else
    pkill -f "ngrok http" >/dev/null 2>&1
    sleep 1
    setsid nohup ngrok http 8001 --domain="$DOMAIN" --log stdout \
      > "$LOGS/tunnel.log" 2>&1 < /dev/null &
    sleep 4
    if grep -q "started tunnel\|url=https" "$LOGS/tunnel.log" 2>/dev/null; then
      echo "  tunnel  https://$DOMAIN"
    else
      echo "  tunnel FAILED — see $LOGS/tunnel.log"
      tail -3 "$LOGS/tunnel.log"
    fi
  fi
fi

echo "───────────────────────────────"
echo "  app        http://localhost:5173"
echo "  on phone   http://$(hostname -I | awk '{print $1}'):5173"
echo "  api        http://localhost:8001/docs"
[ "${1:-}" = "--tunnel" ] && [ -n "${DOMAIN:-}" ] && \
  echo "  webhook    https://$DOMAIN/api/whatsapp/webhook"
echo
