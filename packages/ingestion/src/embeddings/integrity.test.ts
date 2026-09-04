import { describe, expect, it } from "vitest";

import {
  assertEmbeddingIntegrity,
  validateEmbeddingIntegrity,
  type EmbeddingArtifact,
} from "./integrity";

function createCorpus() {
  return {
    schema_version: "1.0" as const,

    document: {
      id: "lawdoc_test",
      law_name: "test_law",
      law_number: "1",
      year: "2020",
      jurisdiction: "EG" as const,
      language: "ar" as const,
      source_file: "test.pdf",

      metadata: {
        parser_version: "test",
        normalization_version: "test",
      },
    },

    chunks: [
      {
        id: "chunk_1",
        document_id: "lawdoc_test",
        law_name: "test_law",
        law_number: "1",
        year: "2020",
        article_number: "1",
        article_title: null,
        hierarchy: [],
        text: "النص الأول",
        text_for_embedding: "النص الأول",

        provenance: {
          source_file: "test.pdf",
          page_start: 1,
          page_end: 1,
        },

        metadata: {
          parser_version: "test",
          normalization_version: "test",
          ocr_confidence: null,
        },

        source_order: 1,
      },

      {
        id: "chunk_2",
        document_id: "lawdoc_test",
        law_name: "test_law",
        law_number: "1",
        year: "2020",
        article_number: "2",
        article_title: null,
        hierarchy: [],
        text: "النص الثاني",
        text_for_embedding: "النص الثاني",

        provenance: {
          source_file: "test.pdf",
          page_start: 2,
          page_end: 2,
        },

        metadata: {
          parser_version: "test",
          normalization_version: "test",
          ocr_confidence: null,
        },

        source_order: 2,
      },
    ],
  };
}

function vector(value: number): number[] {
  return Array.from({ length: 1024 }, () => value);
}

function createArtifact(): EmbeddingArtifact {
  return {
    schema_version: "1.0",
    model: "bge-m3",
    dimensions: 1024,

    records: [
      {
        chunk_id: "chunk_1",
        embedding: vector(0.1),
      },
      {
        chunk_id: "chunk_2",
        embedding: vector(0.2),
      },
    ],
  };
}

describe("embedding integrity", () => {
  it("accepts a valid one-to-one corpus/artifact mapping", () => {
    const report = validateEmbeddingIntegrity(createCorpus(), createArtifact());

    expect(report.corpusChunkCount).toBe(2);
    expect(report.embeddingRecordCount).toBe(2);
    expect(report.duplicateEmbeddingIds).toEqual([]);
    expect(report.missingEmbeddingIds).toEqual([]);
    expect(report.orphanEmbeddingIds).toEqual([]);
    expect(report.invalidDimensions).toEqual([]);
    expect(report.nonFiniteValues).toEqual([]);
  });

  it("accepts the artifact through the strict validator", () => {
    expect(() =>
      assertEmbeddingIntegrity(createCorpus(), createArtifact()),
    ).not.toThrow();
  });

  it("detects duplicate embedding IDs", () => {
    const artifact = createArtifact();

    artifact.records.push({
      chunk_id: "chunk_1",
      embedding: vector(0.3),
    });

    const report = validateEmbeddingIntegrity(createCorpus(), artifact);

    expect(report.duplicateEmbeddingIds).toEqual(["chunk_1"]);
  });

  it("rejects duplicate embedding IDs", () => {
    const artifact = createArtifact();

    artifact.records.push({
      chunk_id: "chunk_1",
      embedding: vector(0.3),
    });

    expect(() => assertEmbeddingIntegrity(createCorpus(), artifact)).toThrow(
      /Duplicate embedding chunk IDs/,
    );
  });

  it("detects missing embeddings", () => {
    const artifact = createArtifact();

    artifact.records = [artifact.records[0]!];

    const report = validateEmbeddingIntegrity(createCorpus(), artifact);

    expect(report.missingEmbeddingIds).toEqual(["chunk_2"]);
  });

  it("rejects missing embeddings", () => {
    const artifact = createArtifact();

    artifact.records = [artifact.records[0]!];

    expect(() => assertEmbeddingIntegrity(createCorpus(), artifact)).toThrow(
      /Missing embeddings/,
    );
  });

  it("detects orphan embeddings", () => {
    const artifact = createArtifact();

    artifact.records.push({
      chunk_id: "chunk_unknown",
      embedding: vector(0.3),
    });

    const report = validateEmbeddingIntegrity(createCorpus(), artifact);

    expect(report.orphanEmbeddingIds).toEqual(["chunk_unknown"]);
  });

  it("rejects orphan embeddings", () => {
    const artifact = createArtifact();

    artifact.records.push({
      chunk_id: "chunk_unknown",
      embedding: vector(0.3),
    });

    expect(() => assertEmbeddingIntegrity(createCorpus(), artifact)).toThrow(
      /Orphan embeddings/,
    );
  });

  it("detects incorrect vector dimensions", () => {
    const artifact = createArtifact();

    artifact.records[0]!.embedding = [0.1, 0.2];

    const report = validateEmbeddingIntegrity(createCorpus(), artifact);

    expect(report.invalidDimensions).toEqual([
      {
        chunk_id: "chunk_1",
        expected: 1024,
        actual: 2,
      },
    ]);
  });

  it("rejects incorrect vector dimensions", () => {
    const artifact = createArtifact();

    artifact.records[0]!.embedding = [0.1, 0.2];

    expect(() => assertEmbeddingIntegrity(createCorpus(), artifact)).toThrow(
      /Invalid embedding dimensions/,
    );
  });

  it("detects non-finite vector values", () => {
    const artifact = createArtifact();

    artifact.records[0]!.embedding[100] = Number.NaN;

    const report = validateEmbeddingIntegrity(createCorpus(), artifact);

    expect(report.nonFiniteValues).toEqual(["chunk_1"]);
  });

  it("rejects non-finite vector values", () => {
    const artifact = createArtifact();

    artifact.records[0]!.embedding[100] = Number.POSITIVE_INFINITY;

    expect(() => assertEmbeddingIntegrity(createCorpus(), artifact)).toThrow(
      /Non-finite embedding values/,
    );
  });

  it("rejects an unexpected model", () => {
    const artifact = createArtifact();

    artifact.model = "wrong-model";

    expect(() => validateEmbeddingIntegrity(createCorpus(), artifact)).toThrow(
      /Unexpected embedding model/,
    );
  });

  it("rejects unexpected dimensions", () => {
    const artifact = createArtifact();

    artifact.dimensions = 768;

    expect(() => validateEmbeddingIntegrity(createCorpus(), artifact)).toThrow(
      /Unexpected embedding dimensions/,
    );
  });

  it("rejects unsupported schema versions", () => {
    const artifact = createArtifact();

    artifact.schema_version = "2.0" as "1.0";

    expect(() => validateEmbeddingIntegrity(createCorpus(), artifact)).toThrow(
      /Unsupported embedding schema version/,
    );
  });
});
