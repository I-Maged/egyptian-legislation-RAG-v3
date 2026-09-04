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

## Database re-index safety

`reindex:db` performs these steps in order:

1. Validate every canonical corpus and its embedding artifact.
2. Upsert documents and article-level chunks using `(documentId, articleNumber)`
   as the stable legal identity.
3. Resolve the database chunk ID for every canonical chunk using that stable
   identity. This prevents old deterministic chunk IDs from causing foreign-key
   failures after re-canonicalization.
4. Verify every target chunk exists before touching the active embedding index.
5. Replace the active pgvector embedding index inside a transaction.

If target chunks cannot be resolved, the command fails before deleting the
existing embedding index. If insertion fails, the embedding transaction rolls
back, so a failed rebuild does not leave a partially populated vector index.

The command does not delete conversations, citations, users, feedback,
suggestions, or historical law chunks. Chunks that are no longer part of the
canonical corpus remain for historical references, but without embeddings they
cannot participate in vector retrieval.


### Required database migration

Before running the database re-index after installing this version, apply the new Prisma migration:

```bash
npm --workspace @egyptian-law/db run prisma:migrate
```

For a non-interactive deployment against an existing database, use `prisma migrate deploy` with the same schema.


`article_number` is intentionally **not unique** per document. Some Egyptian
legal corpora are compilations containing a wrapper instrument and an attached
instrument; both can legitimately contain, for example, Article 1. The canonical
chunk ID is the chunk identity, while `article_number` is metadata/searchable
legal numbering. The migration `20260904180000_allow_duplicate_article_numbers`
removes the old `(document_id, article_number)` unique index.
