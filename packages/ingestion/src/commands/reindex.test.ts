import { mkdir, mkdtemp, readFile, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

import { describe, expect, it } from "vitest";

import type { EmbeddingProvider } from "@egyptian-law/core";

import { reindexCanonicalCorpus } from "./reindex";

function createProvider(): EmbeddingProvider {
  return {
    model: "test-model",
    dimensions: 2,
    async embed(texts) {
      return texts.map((_, index) => [index + 1, 0]);
    },
  };
}

function createCorpus(documentId: string, chunkId: string) {
  return {
    schema_version: "1.0",
    document: {
      id: documentId,
      law_name: "test-law",
      law_number: "1",
      year: "2020",
      jurisdiction: "EG",
      language: "ar",
      source_file: "test.pdf",
      metadata: {
        parser_version: "parser-v3.3.0",
        normalization_version: "parser-v3.3.0",
      },
    },
    chunks: [
      {
        id: chunkId,
        document_id: documentId,
        law_name: "test-law",
        law_number: "1",
        year: "2020",
        article_number: "1",
        article_title: null,
        source_order: 1,
        hierarchy: [],
        text: "نص",
        text_for_embedding: "نص",
        provenance: {
          source_file: "test.pdf",
          page_start: 1,
          page_end: 1,
        },
        metadata: {
          parser_version: "parser-v3.3.0",
          normalization_version: "parser-v3.3.0",
          ocr_confidence: null,
        },
      },
    ],
  };
}

describe("reindexCanonicalCorpus", () => {
  it("recursively re-embeds every canonical corpus and writes a manifest", async () => {
    const root = await mkdtemp(join(tmpdir(), "egyptian-law-reindex-"));
    const canonicalDirectory = join(root, "canonical");
    const outputDirectory = join(root, "embeddings", "reindex-v3.3.0");

    await mkdir(join(canonicalDirectory, "personal-affairs"), {
      recursive: true,
    });

    await writeFile(
      join(canonicalDirectory, "personal-affairs", "law.json"),
      JSON.stringify(createCorpus("doc-1", "chunk-1")),
      "utf8",
    );

    await writeFile(
      join(canonicalDirectory, "labour.json"),
      JSON.stringify(createCorpus("doc-2", "chunk-2")),
      "utf8",
    );

    const manifest = await reindexCanonicalCorpus({
      canonicalDirectory,
      outputDirectory,
      provider: createProvider(),
      batch_size: 1,
    });

    expect(manifest.index_version).toBe("reindex-v3.3.0");
    expect(manifest.source.document_count).toBe(2);
    expect(manifest.source.chunk_count).toBe(2);
    expect(manifest.embedding).toEqual({
      model: "test-model",
      dimensions: 2,
    });

    const artifact = JSON.parse(
      await readFile(
        join(outputDirectory, "personal-affairs", "law.json"),
        "utf8",
      ),
    ) as { records: Array<{ chunk_id: string }> };

    expect(artifact.records).toHaveLength(1);
    expect(artifact.records[0]?.chunk_id).toBe("chunk-1");

    const storedManifest = JSON.parse(
      await readFile(join(outputDirectory, "manifest.json"), "utf8"),
    );
    expect(storedManifest).toEqual(manifest);
  });
});
