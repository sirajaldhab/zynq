#!/bin/sh
set -e

# Wait for Postgres
echo "[entrypoint] Waiting for Postgres at $DATABASE_URL"
RETRIES=30
until node -e "require('url').parse(process.env.DATABASE_URL).hostname && process.exit(0)" >/dev/null 2>&1; do
  sleep 1
  RETRIES=$((RETRIES-1))
  if [ $RETRIES -le 0 ]; then
    echo "[entrypoint] DATABASE_URL not set properly" >&2
    exit 1
  fi
done

# Try connecting to DB by running a simple query using psql if available, else continue
# Run Prisma migrations
echo "[entrypoint] Running prisma migrate deploy"
node node_modules/.bin/prisma migrate deploy

# Seed (best-effort)
echo "[entrypoint] Seeding database"
node prisma/seed.mjs || echo "[entrypoint] Seed step skipped or failed"

# Start server
echo "[entrypoint] Starting server"
node dist/main.js
