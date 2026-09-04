import { mkdir, rm, writeFile } from "fs/promises";
import { fileURLToPath } from "url";
import { join, resolve } from "path";

import type { EmbeddingProvider } from "@egyptian-law/core";

import { OllamaEmbeddingProvider } from "../embeddings/ollama-provider";
import { embedCorpus } from "../embeddings/embed-corpus";
import { writeEmbeddingArtifactJson } from "../embeddings/write-json";
import { assertEmbeddingIntegrity } from "../embeddings/integrity";
import { loadCanonicalCorpora } from "../corpus/load-canonical";

const ROOT_DIR = resolve(
  fileURLToPath(new URL("../../../../", import.meta.url)),
);

const CANONICAL_DIR = resolve(ROOT_DIR, "data/canonical");
const INDEX_VERSION = "reindex-v3.3.0";
const OUTPUT_DIR = resolve(ROOT_DIR, "data/embeddings", INDEX_VERSION);

export interface ReindexOptions {
  canonicalDirectory?: string;
  outputDirectory?: string;
  batch_size?: number;
  provider?: EmbeddingProvider;
}

export interface ReindexManifest {
  schema_version: "1.0";
  index_version: string;
  source: {
    canonical_directory: string;
    document_count: number;
    chunk_count: number;
  };
  embedding: {
    model: string;
    dimensions: number;
  };
  corpora: Array<{
    path: string;
    document_id: string;
    law_name: string;
    law_number: string | null;
    year: string | null;
    chunk_count: number;
    parser_version: string;
    normalization_version: string;
    embedding_path: string;
  }>;
}

export async function reindexCanonicalCorpus(
  options: ReindexOptions = {},
): Promise<ReindexManifest> {
  const canonicalDirectory = resolve(
    options.canonicalDirectory ?? CANONICAL_DIR,
  );
  const outputDirectory = resolve(options.outputDirectory ?? OUTPUT_DIR);
  const provider = options.provider ?? new OllamaEmbeddingProvider();

  const loaded = await loadCanonicalCorpora(canonicalDirectory);

  // This directory is a derived artifact. Re-running the same index version
  // must not leave stale embedding files from an older corpus layout.
  await rm(outputDirectory, { recursive: true, force: true });

  console.log("EGYPTIAN LAW RAG — PHASE 2 RE-INDEX");
  console.log("===================================");
  console.log(`Canonical directory: ${canonicalDirectory}`);
  console.log(`Output directory:    ${outputDirectory}`);
  console.log(`Index version:       ${INDEX_VERSION}`);
  console.log(`Documents:           ${loaded.documentCount}`);
  console.log(`Chunks:              ${loaded.chunkCount}`);
  console.log(`Embedding model:     ${provider.model}`);
  console.log(`Dimensions:          ${provider.dimensions}`);

  const corpora: ReindexManifest["corpora"] = [];

  for (const item of loaded.corpora) {
    const outputPath = join(outputDirectory, item.relativePath);

    console.log("");
    console.log(`Embedding ${item.relativePath}`);
    console.log(`  Law:    ${item.corpus.document.law_name}`);
    console.log(`  ID:     ${item.corpus.document.id}`);
    console.log(`  Chunks: ${item.corpus.chunks.length}`);

    const artifact = await embedCorpus(item.corpus, provider, {
      batch_size: options.batch_size ?? 32,
    });

    assertEmbeddingIntegrity(item.corpus, artifact, {
      expectedModel: provider.model,
      expectedDimensions: provider.dimensions,
    });
    await writeEmbeddingArtifactJson(outputPath, artifact);

    console.log(`  ✓ ${artifact.records.length} embeddings written`);

    corpora.push({
      path: item.relativePath,
      document_id: item.corpus.document.id,
      law_name: item.corpus.document.law_name,
      law_number: item.corpus.document.law_number,
      year: item.corpus.document.year,
      chunk_count: item.corpus.chunks.length,
      parser_version: item.corpus.document.metadata.parser_version,
      normalization_version: item.corpus.document.metadata.normalization_version,
      embedding_path: item.relativePath,
    });
  }

  const manifest: ReindexManifest = {
    schema_version: "1.0",
    index_version: INDEX_VERSION,
    source: {
      canonical_directory: "data/canonical",
      document_count: loaded.documentCount,
      chunk_count: loaded.chunkCount,
    },
    embedding: {
      model: provider.model,
      dimensions: provider.dimensions,
    },
    corpora,
  };

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(
    join(outputDirectory, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );

  console.log("");
  console.log("RE-INDEX COMPLETE");
  console.log("=================");
  console.log(`Documents: ${manifest.source.document_count}`);
  console.log(`Chunks:    ${manifest.source.chunk_count}`);
  console.log(`Manifest:  ${join(outputDirectory, "manifest.json")}`);

  return manifest;
}

