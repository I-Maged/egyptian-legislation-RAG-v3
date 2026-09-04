import { readFile, readdir } from "fs/promises";
import { fileURLToPath } from "url";
import { resolve, join } from "path";

import type { CanonicalCorpus, EmbeddingArtifact } from "@egyptian-law/core";

import { prisma, upsertCorpus, upsertEmbeddings } from "@egyptian-law/db";

const ROOT_DIR = resolve(
  fileURLToPath(new URL("../../../../", import.meta.url)),
);

const CANONICAL_DIR = resolve(ROOT_DIR, "data/canonical");
const EMBEDDINGS_DIR = resolve(ROOT_DIR, "data/embeddings");

async function readJson<T>(path: string): Promise<T> {
  const content = await readFile(path, "utf8");
  return JSON.parse(content) as T;
}

async function importLaw(fileName: string): Promise<void> {
  const corpusPath = join(CANONICAL_DIR, fileName);
  const embeddingPath = join(EMBEDDINGS_DIR, fileName);

  console.log("");
  console.log("============================================================");
  console.log(`IMPORTING ${fileName}`);
  console.log("============================================================");

  const corpus = await readJson<CanonicalCorpus>(corpusPath);
  const embeddings = await readJson<EmbeddingArtifact>(embeddingPath);

  console.log(`Law: ${corpus.document.law_name}`);
  console.log(`Document ID: ${corpus.document.id}`);
  console.log(`Chunks: ${corpus.chunks.length}`);
  console.log(`Embeddings: ${embeddings.records.length}`);
  console.log(`Embedding model: ${embeddings.model}`);
  console.log(`Dimensions: ${embeddings.dimensions}`);

  if (corpus.chunks.length !== embeddings.records.length) {
    throw new Error(
      `Corpus/embedding count mismatch for ${fileName}: ` +
        `${corpus.chunks.length} chunks vs ` +
        `${embeddings.records.length} embeddings.`,
    );
  }

  const corpusChunkIds = new Set(corpus.chunks.map((chunk) => chunk.id));

  for (const record of embeddings.records) {
    if (!corpusChunkIds.has(record.chunk_id)) {
      throw new Error(
        `Embedding ${record.chunk_id} does not belong to ` +
          `the canonical corpus ${fileName}.`,
      );
    }
  }

  const corpusResult = await upsertCorpus(corpus);

  console.log(`✓ Upserted document ${corpusResult.documentId}`);

  console.log(`✓ Upserted ${corpusResult.chunksInserted} chunks`);

  const embeddingCount = await upsertEmbeddings(embeddings);

  console.log(`✓ Upserted ${embeddingCount} embeddings`);

  console.log("✓ Import completed.");
}

async function main(): Promise<void> {
  try {
    const files = await readdir(CANONICAL_DIR);

    const corpusFiles = files.filter((file) => file.endsWith(".json"));

    if (corpusFiles.length === 0) {
      throw new Error(
        `No canonical corpus JSON files found in ${CANONICAL_DIR}`,
      );
    }

    console.log("");
    console.log("EGYPTIAN LAW RAG — DATABASE IMPORT");
    console.log("===================================");
    console.log(`Canonical directory: ${CANONICAL_DIR}`);
    console.log(`Embeddings directory: ${EMBEDDINGS_DIR}`);
    console.log(`Laws found: ${corpusFiles.length}`);

    for (const file of corpusFiles) {
      await importLaw(file);
    }

    console.log("");
    console.log("============================================================");
    console.log("IMPORT COMPLETE");
    console.log("============================================================");

    const documentCount = await prisma.lawDocument.count();
    const chunkCount = await prisma.lawChunk.count();
    const embeddingCount = await prisma.lawChunkEmbedding.count();

    console.log(`Documents:  ${documentCount}`);
    console.log(`Chunks:     ${chunkCount}`);
    console.log(`Embeddings: ${embeddingCount}`);
  } finally {
    await prisma.$disconnect();
  }
}

await main();
