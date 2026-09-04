import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { join, resolve } from "path";

import type { EmbeddingArtifact } from "@egyptian-law/core";
import {
  prisma,
  replaceEmbeddingIndex,
  upsertCorpus,
} from "@egyptian-law/db";

import { assertEmbeddingIntegrity } from "../embeddings/integrity";
import { loadCanonicalCorpora } from "../corpus/load-canonical";

const ROOT_DIR = resolve(
  fileURLToPath(new URL("../../../../", import.meta.url)),
);

const CANONICAL_DIR = resolve(ROOT_DIR, "data/canonical");
const EMBEDDINGS_DIR = resolve(
  ROOT_DIR,
  "data/embeddings/reindex-v3.3.0",
);

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

async function main(): Promise<void> {
  try {
    const loaded = await loadCanonicalCorpora(CANONICAL_DIR);
    const artifacts: EmbeddingArtifact[] = [];

    console.log("EGYPTIAN LAW RAG — PHASE 2 DATABASE RE-INDEX");
    console.log("==============================================");
    console.log(`Canonical corpora: ${loaded.documentCount}`);
    console.log(`Canonical chunks:  ${loaded.chunkCount}`);
    console.log(`Embedding index:   ${EMBEDDINGS_DIR}`);
    console.log("");

    for (const item of loaded.corpora) {
      const embeddingPath = join(EMBEDDINGS_DIR, item.relativePath);
      const artifact = await readJson<EmbeddingArtifact>(embeddingPath);

      assertEmbeddingIntegrity(item.corpus, artifact);
      artifacts.push(artifact);

      console.log(
        `✓ ${item.relativePath}: ${item.corpus.chunks.length} chunks / ${artifact.records.length} embeddings`,
      );
    }

    for (const item of loaded.corpora) {
      await upsertCorpus(item.corpus);
    }

    const activeEmbeddingCount = await replaceEmbeddingIndex(artifacts);

    const [documentCount, chunkCount, embeddingCount] = await Promise.all([
      prisma.lawDocument.count(),
      prisma.lawChunk.count(),
      prisma.lawChunkEmbedding.count(),
    ]);

    console.log("");
    console.log("DATABASE RE-INDEX COMPLETE");
    console.log("==========================");
    console.log(`Active indexed embeddings: ${activeEmbeddingCount}`);
    console.log(`DB documents:              ${documentCount}`);
    console.log(`DB chunks:                 ${chunkCount}`);
    console.log(`DB embeddings:             ${embeddingCount}`);
    console.log("");
    console.log("✓ Existing application records were preserved.");
    console.log("✓ Stale vector embeddings were removed from the active index.");
    console.log("✓ Canonical corpora and fresh embeddings are now indexed.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Phase 2 database re-index failed.");
  console.error(error);
  process.exitCode = 1;
});
