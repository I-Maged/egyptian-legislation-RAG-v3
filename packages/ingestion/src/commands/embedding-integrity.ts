import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { resolve } from "path";

import type { CanonicalCorpus } from "@egyptian-law/core";

import {
  assertEmbeddingIntegrity,
  type EmbeddingArtifact,
} from "../embeddings/integrity";

const ROOT_DIR = resolve(
  fileURLToPath(new URL("../../../../", import.meta.url)),
);

export interface EmbeddingIntegrityOptions {
  corpusPath: string;
  embeddingPath: string;
}

export async function checkEmbeddingIntegrity(
  options: EmbeddingIntegrityOptions,
): Promise<void> {
  if (!options.corpusPath.trim()) {
    throw new Error("corpusPath is required.");
  }

  if (!options.embeddingPath.trim()) {
    throw new Error("embeddingPath is required.");
  }

  const corpusPath = resolve(ROOT_DIR, options.corpusPath);
  const embeddingPath = resolve(ROOT_DIR, options.embeddingPath);

  console.log(`Reading canonical corpus: ${corpusPath}`);
  console.log(`Reading embedding artifact: ${embeddingPath}`);

  const [corpusJson, embeddingJson] = await Promise.all([
    readFile(corpusPath, "utf8"),
    readFile(embeddingPath, "utf8"),
  ]);

  const corpus = JSON.parse(corpusJson) as CanonicalCorpus;
  const artifact = JSON.parse(embeddingJson) as EmbeddingArtifact;

  const report = assertEmbeddingIntegrity(corpus, artifact);

  console.log("");
  console.log("Embedding Integrity");
  console.log("───────────────────");
  console.log(`Law: ${corpus.document.law_name}`);
  console.log(`Chunks: ${report.corpusChunkCount}`);
  console.log(`Embeddings: ${report.embeddingRecordCount}`);
  console.log(`Model: ${artifact.model}`);
  console.log(`Dimensions: ${artifact.dimensions}`);
  console.log("");
  console.log("✓ Every canonical chunk has exactly one embedding.");
  console.log("✓ No orphan embeddings.");
  console.log("✓ No duplicate embedding IDs.");
  console.log("✓ All vectors have the expected dimensions.");
  console.log("✓ All vector values are finite.");
  console.log("");
  console.log("Embedding integrity validation passed.");
}
