#!/usr/bin/env bash
# Start Firebase emulators and auto-seed demo users (alice, bob),
# mirroring the preview environment. Keeps the seeder (preview/seed.mjs)
# as a single source of truth so local dev and preview stay in sync.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [ ! -e preview/node_modules/firebase-admin ]; then
  echo "Installing preview/ dependencies for seeder..."
  (cd preview && pnpm install)
fi

firebase emulators:start --project skill-plepic-com &
EMULATOR_PID=$!
trap 'kill "$EMULATOR_PID" 2>/dev/null || true' TERM INT EXIT

deadline=$((SECONDS + 60))
until curl -sf http://127.0.0.1:9099/ >/dev/null 2>&1 \
   && curl -sf http://127.0.0.1:8080/ >/dev/null 2>&1; do
  if [ "$SECONDS" -ge "$deadline" ]; then
    echo "ERROR: Emulators failed to start within 60s" >&2
    exit 1
  fi
  sleep 1
done

FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
  node preview/seed.mjs

wait "$EMULATOR_PID"
