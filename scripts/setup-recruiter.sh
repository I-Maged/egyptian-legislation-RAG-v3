#!/usr/bin/env bash
# One-time setup for the recruiter/demo Docker run (prebuilt image, no build).
# Works on macOS/Linux and on Windows via Git Bash. Requires: docker, python3.
#
#   bash scripts/setup-recruiter.sh
#
# Then follow the printed next steps (Ollama models + seed dump + compose up).
set -eu

cd "$(dirname "$0")/.."

command -v docker >/dev/null || { echo "ERROR: docker not found. Install Docker Desktop first." >&2; exit 1; }
command -v python3 >/dev/null || { echo "ERROR: python3 not found (needed to generate secrets)." >&2; exit 1; }

if [ ! -f .env ]; then
  cp .env.example .env
  echo "[setup] Created .env from .env.example"
else
  echo "[setup] .env already exists — leaving it untouched"
fi

# Fill secrets idempotently: only replace placeholder/empty values.
python3 - <<'EOF'
import re, secrets
from pathlib import Path

p = Path(".env")
text = p.read_text()

def ensure(key: str, value: str) -> None:
    global text
    m = re.search(rf"^{key}=(.*)$", text, re.M)
    current = m.group(1).strip().strip('"').strip("'") if m else ""
    if current in ("", "change-me"):
        text = re.sub(rf"^{key}=.*$", f"{key}={value}", text, count=1, flags=re.M)
        print(f"[setup] Generated {key}")
    else:
        print(f"[setup] {key} already set — leaving it untouched")

ensure("POSTGRES_PASSWORD", secrets.token_hex(16))  # URL-safe hex
ensure("AUTH_SECRET", secrets.token_hex(32))
p.write_text(text)
EOF

cat <<'EOF'

[setup] Done. Next steps:

  1. Install Ollama (https://ollama.com/download) and pull the models:
       ollama pull bge-m3
       ollama pull gemma4
     (No account needed. Cloud models like gemma4:cloud are optional and
      require `ollama signin`; set GENERATION_MODEL=gemma4:cloud in .env
      only if you want them.)

  2. Download the pre-seeded corpus from the GitHub Release and save it as:
       packages/db/seed/data/corpus.dump
     (See packages/db/seed/data/README.md. Without it the app still boots
      with an empty database, but RAG answers will have no sources.)

  3. Start the demo (prebuilt image, ~650MB + Postgres):
       docker compose -f docker-compose.pull.yml up -d

  4. Open http://localhost:3000  (liveness: http://localhost:3000/api/health)

  To stop:  docker compose -f docker-compose.pull.yml down
  To reseed from scratch (DELETES the demo database volume):
             docker compose -f docker-compose.pull.yml down -v
EOF
