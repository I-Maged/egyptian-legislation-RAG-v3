# Pre-seeded database dumps (gitignored, machine-specific)

**Recruiters / demo users:** you do NOT create this file — download
`corpus-public.dump` from the latest **GitHub Release** and save it here as
`corpus.dump`. It contains the full public legal corpus (documents, chunks,
embeddings, migrations) with all private rows (users, conversations,
messages, feedback) stripped. Then start with
`docker compose -f docker-compose.pull.yml up -d`.

**Maintainers:** to regenerate the public dump from a migrated + ingested DB:

Place **one** of these files here to ship a pre-loaded legal corpus.
The directory is mounted read-only at `/seed` in the `postgres` service,
and `../init/01-restore.sh` restores it on **first** init only
(empty `postgres_data` volume).

| File          | Format                              | How to create (against a migrated + ingested DB) |
|---------------|-------------------------------------|--------------------------------------------------|
| `corpus.dump` | custom format (preferred)           | `pg_dump -Fc -f corpus.dump "postgresql://postgres:postgres@localhost:5432/egyptian_law_rag_v3"` |
| `corpus.sql`  | plain SQL (larger, human-readable)  | `pg_dump -f corpus.sql "postgresql://postgres:postgres@localhost:5432/egyptian_law_rag_v3"` |

Rules:

- Dump **after** `prisma migrate deploy` + ingestion, so the dump already
  contains the schema, the `vector` extension objects, and the
  `_prisma_migrations` rows. On boot, `migrate deploy` in the web
  container then becomes a harmless no-op.
- Never commit dumps (`data/` is gitignored) — copy them onto the target
  host out of band.
- To re-seed from scratch: `docker compose down -v` (deletes the volume!),
  place the dump, then `docker compose up --build`.
- Without a dump the stack still boots: Postgres starts empty and the web
  entrypoint creates the schema via `migrate deploy`. Ingest afterwards
  with the `packages/ingestion` scripts.
