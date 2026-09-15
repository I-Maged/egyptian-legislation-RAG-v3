# syntax=docker/dockerfile:1
#
# Production image for the Next.js frontend, which also serves the /api/*
# RAG routes (chat, conversations, auth). Build context is the REPO ROOT:
#
#   docker build -f apps/web/Dockerfile -t egyptian-law-rag-web .
#
# deliberately EXCLUDED to keep the image small:
#   - evaluation/ragas (Python) -> run locally, see evaluation/ragas/README.md
#   - data/ (PDFs, corpora, eval outputs)
#   - devDependencies, TypeScript sources, tests
#
# Runtime dependencies (NOT bundled, wired via env):
#   - Postgres + pgvector  -> `postgres` service in docker-compose.yml
#   - Ollama (LLM + embeddings) -> external, via OLLAMA_HOST

ARG NODE_VERSION=22

# ---------------------------------------------------------------- base ---
FROM node:${NODE_VERSION}-alpine AS base
# libc6-compat: prebuilt native modules (@napi-rs/canvas).
# openssl: Prisma engines.
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# ---------------------------------------------------------------- deps ---
FROM base AS deps
# Copy only manifests first for a cacheable `npm ci` layer.
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/core/package.json ./packages/core/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/evaluation/package.json ./packages/evaluation/package.json
COPY packages/generation/package.json ./packages/generation/package.json
COPY packages/ingestion/package.json ./packages/ingestion/package.json
COPY packages/rag/package.json ./packages/rag/package.json
RUN npm ci --no-audit --no-fund

# -------------------------------------------------------------- builder ---
FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build-time dummy only: Prisma and Next need *some* value to generate/build.
# The real DATABASE_URL is injected at container runtime (compose env).
ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5432/egyptian_law_rag_v3?schema=public
RUN npx prisma generate --schema packages/db/prisma/schema.prisma
RUN npm run build --workspace web

# --------------------------------------------------------------- runner ---
FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs \
    # Prisma CLI for `migrate deploy` at container boot (+ dotenv, which
    # packages/db/prisma.config.ts imports). Pinned to the version in
    # package-lock.json — keep in sync when Dependabot bumps Prisma.
    && npm install --prefix /opt/prisma --no-audit --no-fund prisma@7.10.0 dotenv \
    && npm cache clean --force \
    && rm -rf /root/.npm \
    # Strip `prisma studio` UI / type packages: dead weight for
    # `migrate deploy`. NOTE: @prisma/studio-core must stay — Prisma 7's CLI
    # requires it at startup; fast-check must stay — it is a runtime dep of
    # `effect` (loaded by @prisma/config). If a Prisma upgrade breaks the
    # boot migration, the compose smoke test catches it — revisit this list.
    && rm -rf /opt/prisma/node_modules/@types \
      /opt/prisma/node_modules/react-dom \
      /opt/prisma/node_modules/@visx \
      /opt/prisma/node_modules/elkjs
ENV PATH=/opt/prisma/node_modules/.bin:$PATH

WORKDIR /app

# Next standalone output (monorepo layout: server lives at apps/web/server.js).
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
# Prisma needs these at boot for `migrate deploy` (sql files are not traced).
COPY --from=builder --chown=nextjs:nodejs /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder --chown=nextjs:nodejs /app/packages/db/prisma.config.ts ./packages/db/prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/packages/db/package.json ./packages/db/package.json
COPY --chown=nextjs:nodejs apps/web/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs
EXPOSE 3000

# `sh` wrapper (not direct exec) so Windows CRLF checkouts can't break the
# shebang; entrypoint `exec`s node so signals still reach PID 1.
ENTRYPOINT ["sh", "./entrypoint.sh"]
