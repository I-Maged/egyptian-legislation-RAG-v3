# Egyptian Legislation RAG

Chat with Egyptian legislation (labour, financial, personal-affairs laws):
retrieval-augmented generation over a Postgres + pgvector corpus, served by a
Next.js app, with Ollama providing embeddings and generation.

## 60-second demo (prebuilt image, no source build)

Prerequisites: [Docker](https://docs.docker.com/get-docker/) and
[Ollama](https://ollama.com/download). Disk: ~650MB app image + ~1.1GB
`bge-m3` + several GB for `gemma4`.

```bash
git clone <this-repo> && cd <this-repo>
bash scripts/setup-recruiter.sh   # creates .env with generated secrets

ollama pull bge-m3
ollama pull gemma4                # local model, no account needed

# Pre-seeded legal corpus: download corpus-public.dump from the latest
# GitHub Release and save it as packages/db/seed/data/corpus.dump
# (see packages/db/seed/data/README.md). Optional but recommended —
# without it the app boots with an empty database.

docker compose -f docker-compose.pull.yml up -d
```

Open **http://localhost:3000** (liveness probe: `/api/health`).
To stop: `docker compose -f docker-compose.pull.yml down`.

| What | Where |
|---|---|
| Demo compose (prebuilt `magedhanafy/egyptian-law-rag-web`) | `docker-compose.pull.yml` |
| Build-from-source compose (contributors) | `docker-compose.yml` |
| Seed dump instructions | `packages/db/seed/data/README.md` |
| Ragas evaluation (local Python, not containerized) | `evaluation/ragas/README.md` |

Notes:

* Ollama is **external**, not containerized. Inside Docker, `localhost`
  means the web container, so the app talks to Ollama via `OLLAMA_HOST`
  (default `http://host.docker.internal:11434`, mapped on Linux too).
* Cloud generation models (e.g. `GENERATION_MODEL=gemma4:cloud`) are an
  opt-in override: they need `ollama signin` (Ollama.com account) plus
  internet, and Ollama occasionally retires them. The default is the
  local `gemma4`.
* Images: Postgres (`pgvector/pgvector`) is multi-arch. The web image is
  currently `linux/amd64` (Apple Silicon runs it via Rosetta 2);
  `linux/arm64` is planned — see `docker-compose.yml` to build natively.
* To re-seed from scratch: `docker compose -f docker-compose.pull.yml down -v`
  (**deletes** the demo database volume), place the dump, then `up -d`.

## For contributors

```bash
cp .env.example .env   # then fill POSTGRES_PASSWORD + AUTH_SECRET
docker compose up --build -d
```

Local dev (without Docker) still uses `packages/db/docker-compose.yml` for
Postgres plus `apps/web/.env.local`. See `evaluation/ragas/README.md` for
the Python evaluator.
