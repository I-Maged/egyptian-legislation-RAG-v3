import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { resolve } from "path";

import { assertEmbeddingIntegrity } from "../embeddings/integrity";
import type { CanonicalCorpus } from "@egyptian-law/core";

const ROOT_DIR = resolve(
  fileURLToPath(new URL("../../../../", import.meta.url)),
);

const CANONICAL_PATH = resolve(
  ROOT_DIR,
  "data/canonical/personal-affairs-law-25-1929.json",
);

const EMBEDDING_PATH = resolve(
  ROOT_DIR,
  "data/embeddings/personal-affairs-law-25-1929.json",
);

async function main(): Promise<void> {
  console.log(`Reading canonical corpus: ${CANONICAL_PATH}`);
  console.log(`Reading embedding artifact: ${EMBEDDING_PATH}`);
  console.log("");

  const canonicalJson = await readFile(CANONICAL_PATH, "utf8");
  const embeddingJson = await readFile(EMBEDDING_PATH, "utf8");

  const corpus = JSON.parse(canonicalJson) as CanonicalCorpus;
  const artifact = JSON.parse(embeddingJson);

  assertEmbeddingIntegrity(corpus, artifact);

  console.log("Embedding Integrity");
  console.log("───────────────────");
  console.log(`Law: ${corpus.document.law_name}`);
  console.log(`Chunks: ${corpus.chunks.length}`);
  console.log(`Embeddings: ${artifact.records.length}`);
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

main().catch((error: unknown) => {
  console.error("Embedding integrity validation failed.");
  console.error(error);
  process.exitCode = 1;
});
