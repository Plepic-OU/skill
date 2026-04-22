#!/usr/bin/env bash
set -euo pipefail

echo "Starting Firebase emulators..."
cd /app
firebase emulators:start --only auth,firestore --project skill-plepic-com &
EMULATOR_PID=$!

# Poll emulator health endpoints until ready (timeout 60s)
deadline=$((SECONDS + 60))
echo "Waiting for emulators to be ready..."

while true; do
  if curl -sf http://127.0.0.1:9099/ >/dev/null 2>&1 && \
     curl -sf http://127.0.0.1:9199/ >/dev/null 2>&1; then
    echo "Emulators ready."
    break
  fi

  if [ "$SECONDS" -ge "$deadline" ]; then
    echo "ERROR: Emulators failed to start within 60s" >&2
    exit 1
  fi

  sleep 1
done

# Seed demo data
echo "Seeding demo data..."
node /app/preview/seed.mjs

# Start nginx in background and wait — keeps the shell alive to handle signals
echo "Starting nginx..."
nginx -g 'daemon off;' &
NGINX_PID=$!
trap 'kill $EMULATOR_PID $NGINX_PID 2>/dev/null; exit' TERM INT
wait $NGINX_PID
