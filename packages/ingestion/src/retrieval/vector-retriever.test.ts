import { describe, expect, it } from "vitest";

import type { CanonicalCorpus, LawChunk } from "@egyptian-law/core";

import {
  InMemoryVectorRetriever,
  type EmbeddingArtifact,
} from "./vector-retriever";

function createChunk(id: string, articleNumber: string): LawChunk {
  return {
    id,
    document_id: "lawdoc_test",
    law_name: "test_law",
    law_number: "1",
    year: "2026",
    article_number: articleNumber,
    article_title: null,
    hierarchy: [],
    text: `Article ${articleNumber}`,
    text_for_embedding: `Article ${articleNumber}`,
    source_order: Number(articleNumber),
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
  };
}

function createCorpus(): CanonicalCorpus {
  return {
    schema_version: "1.0",
    document: {
      id: "lawdoc_test",
      law_name: "test_law",
      law_number: "1",
      year: "2026",
      jurisdiction: "EG",
      language: "ar",
      source_file: "test.pdf",
      metadata: {
        parser_version: "test",
        normalization_version: "test",
      },
    },
    chunks: [
      createChunk("chunk_a", "1"),
      createChunk("chunk_b", "2"),
      createChunk("chunk_c", "3"),
    ],
  };
}

function createArtifact(): EmbeddingArtifact {
  return {
    schema_version: "1.0",
    model: "test-model",
    dimensions: 3,
    records: [
      {
        chunk_id: "chunk_a",
        embedding: [1, 0, 0],
      },
      {
        chunk_id: "chunk_b",
        embedding: [0, 1, 0],
      },
      {
        chunk_id: "chunk_c",
        embedding: [0, 0, 1],
      },
    ],
  };
}

describe("InMemoryVectorRetriever", () => {
  it("returns results ordered by cosine similarity", () => {
    const retriever = new InMemoryVectorRetriever(
      createCorpus(),
      createArtifact(),
    );

    const results = retriever.search([1, 0, 0]);

    expect(results.map((result) => result.chunk.id)).toEqual([
      "chunk_a",
      "chunk_b",
      "chunk_c",
    ]);

    expect(results[0]!.score).toBeCloseTo(1);
    expect(results[1]!.score).toBeCloseTo(0);
    expect(results[2]!.score).toBeCloseTo(0);
  });

  it("respects topK", () => {
    const retriever = new InMemoryVectorRetriever(
      createCorpus(),
      createArtifact(),
    );

    const results = retriever.search([1, 0, 0], {
      topK: 2,
    });

    expect(results).toHaveLength(2);
    expect(results.map((result) => result.chunk.id)).toEqual([
      "chunk_a",
      "chunk_b",
    ]);
  });

  it("respects minScore", () => {
    const retriever = new InMemoryVectorRetriever(
      createCorpus(),
      createArtifact(),
    );

    const results = retriever.search([1, 0, 0], {
      minScore: 0.5,
    });

    expect(results).toHaveLength(1);
    expect(results[0]!.chunk.id).toBe("chunk_a");
  });

  it("preserves the complete canonical chunk", () => {
    const retriever = new InMemoryVectorRetriever(
      createCorpus(),
      createArtifact(),
    );

    const results = retriever.search([0, 1, 0]);

    expect(results[0]!.chunk).toEqual(createCorpus().chunks[1]);
  });

  it("joins chunks and embeddings by chunk ID rather than array position", () => {
    const corpus = createCorpus();
    const artifact = createArtifact();

    artifact.records = [
      artifact.records[2]!,
      artifact.records[0]!,
      artifact.records[1]!,
    ];

    const retriever = new InMemoryVectorRetriever(corpus, artifact);

    const results = retriever.search([1, 0, 0]);

    expect(results[0]!.chunk.id).toBe("chunk_a");
  });

  it("rejects an empty corpus", () => {
    const corpus = createCorpus();
    corpus.chunks = [];

    expect(() => new InMemoryVectorRetriever(corpus, createArtifact())).toThrow(
      /empty corpus/i,
    );
  });

  it("rejects an empty embedding artifact", () => {
    const artifact = createArtifact();
    artifact.records = [];

    expect(() => new InMemoryVectorRetriever(createCorpus(), artifact)).toThrow(
      /empty embedding artifact/i,
    );
  });

  it("rejects a missing embedding", () => {
    const artifact = createArtifact();

    artifact.records = artifact.records.filter(
      (record) => record.chunk_id !== "chunk_b",
    );

    expect(() => new InMemoryVectorRetriever(createCorpus(), artifact)).toThrow(
      /missing embedding|count mismatch/i,
    );
  });

  it("rejects an orphan embedding", () => {
    const artifact = createArtifact();

    artifact.records.push({
      chunk_id: "chunk_unknown",
      embedding: [1, 0, 0],
    });

    expect(() => new InMemoryVectorRetriever(createCorpus(), artifact)).toThrow(
      /orphan embedding|count mismatch/i,
    );
  });

  it("rejects duplicate embedding IDs", () => {
    const artifact = createArtifact();

    artifact.records.push({
      ...artifact.records[0]!,
    });

    expect(() => new InMemoryVectorRetriever(createCorpus(), artifact)).toThrow(
      /duplicate embedding chunk ID/i,
    );
  });

  it("rejects incorrect embedding dimensions", () => {
    const artifact = createArtifact();

    artifact.records[0]!.embedding = [1, 0];

    expect(() => new InMemoryVectorRetriever(createCorpus(), artifact)).toThrow(
      /dimension mismatch/i,
    );
  });

  it("rejects non-finite embedding values", () => {
    const artifact = createArtifact();

    artifact.records[0]!.embedding = [1, Number.NaN, 0];

    expect(() => new InMemoryVectorRetriever(createCorpus(), artifact)).toThrow(
      /non-finite/i,
    );
  });

  it("rejects a query with the wrong dimensions", () => {
    const retriever = new InMemoryVectorRetriever(
      createCorpus(),
      createArtifact(),
    );

    expect(() => retriever.search([1, 0])).toThrow(/dimension mismatch/i);
  });

  it("rejects non-finite query values", () => {
    const retriever = new InMemoryVectorRetriever(
      createCorpus(),
      createArtifact(),
    );

    expect(() => retriever.search([1, Number.NaN, 0])).toThrow(/non-finite/i);
  });

  it("rejects invalid topK", () => {
    const retriever = new InMemoryVectorRetriever(
      createCorpus(),
      createArtifact(),
    );

    expect(() =>
      retriever.search([1, 0, 0], {
        topK: 0,
      }),
    ).toThrow(/topK/i);
  });

  it("produces deterministic ordering for tied scores", () => {
    const retriever = new InMemoryVectorRetriever(
      createCorpus(),
      createArtifact(),
    );

    const first = retriever.search([1, 1, 0]);
    const second = retriever.search([1, 1, 0]);

    expect(first.map((result) => result.chunk.id)).toEqual(
      second.map((result) => result.chunk.id),
    );
  });
});
