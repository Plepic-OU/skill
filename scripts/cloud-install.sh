#!/bin/bash
# SessionStart hook for Claude Code cloud sessions.
# Installs project dependencies that aren't part of the base VM image.
# Skips execution in local (non-cloud) environments.

if [ "$SKILL_ENV" != "claude_web" ]; then
  exit 0
fi

set -e

echo "==> Installing project dependencies (cloud session)..."

# Install pnpm dependencies
pnpm install --frozen-lockfile

# Download Playwright's Chromium (system deps installed by setup script)
pnpm exec playwright install chromium

echo "==> Cloud install complete."
