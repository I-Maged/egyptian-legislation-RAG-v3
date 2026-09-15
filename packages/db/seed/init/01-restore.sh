#!/bin/sh
# Runs ONCE, on first Postgres init (empty data volume only).
# Restores the pre-seeded legal corpus if a dump was provided, otherwise
# starts empty — the web container applies Prisma migrations on boot.
set -eu

if [ -f /seed/corpus.dump ]; then
  echo "[seed] Restoring pre-seeded corpus from /seed/corpus.dump ..."
  pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner "/seed/corpus.dump"
  echo "[seed] Restore complete."
elif [ -f /seed/corpus.sql ]; then
  echo "[seed] Restoring pre-seeded corpus from /seed/corpus.sql ..."
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "/seed/corpus.sql"
  echo "[seed] Restore complete."
else
  echo "[seed] No dump in /seed — starting with an empty database."
  echo "[seed] The web service will apply Prisma migrations on boot."
fi
