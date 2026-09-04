# Phase 2 — Re-index

The canonical corpus under `data/canonical/` is the source of truth. The
re-index command recursively discovers all canonical JSON corpora, validates
them, embeds every `text_for_embedding` value with the existing Ollama
`bge-m3` / 1024-dimensional provider, validates the resulting artifacts, and
writes them under `data/embeddings/reindex-v3.3.0/` while preserving the
canonical directory structure.

## Commands

From the repository root:

```bash
npm --workspace @egyptian-law/ingestion run reindex
```

After the embedding artifacts have been generated and integrity-checked:

```bash
npm --workspace @egyptian-law/ingestion run reindex:db
```

`reindex:db` first upserts the canonical documents/chunks, then atomically
replaces the active pgvector embedding index. It does not delete conversations,
citations, users, feedback, suggestions, or historical law chunks. Chunks that
are no longer part of the canonical corpus remain for historical references,
but without embeddings they cannot participate in vector retrieval.
