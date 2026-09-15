#!/bin/sh
# Production entrypoint for the web container:
#   1. fail fast when AUTH_SECRET is missing (production)
#   2. wait for Postgres + apply Prisma migrations (`migrate deploy`)
#   3. exec the Next.js standalone server
set -eu

if [ "${NODE_ENV:-production}" = "production" ] && [ -z "${AUTH_SECRET:-}" ]; then
  echo "[entrypoint] ERROR: AUTH_SECRET is not set. Refusing to start." >&2
  echo "[entrypoint] Set it in .env (see .env.example) and restart." >&2
  exit 1
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[entrypoint] ERROR: DATABASE_URL is not set. Refusing to start." >&2
  exit 1
fi

echo "[entrypoint] Applying database migrations..."
# Prisma CLI lives in /opt/prisma, while prisma.config.ts lives in
# /app/packages/db and the Next standalone output only contains a dotenv
# stub (no `dotenv/config` subpath). NODE_PATH lets the config's optional
# dotenv load resolve to the full copy in /opt/prisma.
export NODE_PATH="/opt/prisma/node_modules${NODE_PATH:+:$NODE_PATH}"
cd /app/packages/db
attempt=0
until prisma migrate deploy; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 30 ]; then
    echo "[entrypoint] ERROR: migrations failed after 30 attempts." >&2
    exit 1
  fi
  echo "[entrypoint] Postgres not ready or migrate failed (attempt $attempt/30), retrying in 2s..."
  sleep 2
done
cd /app

if [ -f apps/web/server.js ]; then
  echo "[entrypoint] Starting Next.js standalone server..."
  exec node apps/web/server.js
elif [ -f server.js ]; then
  echo "[entrypoint] Starting Next.js standalone server..."
  exec node server.js
else
  echo "[entrypoint] ERROR: standalone server.js not found." >&2
  exit 1
fi
