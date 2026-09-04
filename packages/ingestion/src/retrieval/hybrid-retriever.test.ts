import { describe, expect, it } from "vitest";

import type { CanonicalCorpus, LawChunk } from "@egyptian-law/core";

import { HybridRetriever } from "./hybrid-retriever";
import type { EmbeddingArtifact } from "./vector-retriever";

function createChunk(
  id: string,
  articleNumber: string,
  text: string,
): LawChunk {
  return {
    id,
    document_id: "lawdoc_test",
    law_name: "test_law",
    law_number: "1",
    year: "2026",
    article_number: articleNumber,
    article_title: null,
    hierarchy: [],
    text,
    text_for_embedding: text,
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
      createChunk("chunk_a", "1", "القانون ينظم علاقات العمل وحقوق العمال"),
      createChunk("chunk_b", "2", "يستحق العامل الاجر عن العمل الذي يؤديه"),
      createChunk("chunk_c", "3", "تنظر المحكمة الدعاوى والمنازعات"),
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
        embedding: [0.8, 0.6, 0],
      },
      {
        chunk_id: "chunk_c",
        embedding: [0, 0, 1],
      },
    ],
  };
}

function createRetriever(): HybridRetriever {
  return new HybridRetriever(createCorpus(), createArtifact());
}

describe("HybridRetriever", () => {
  it("returns results from hybrid retrieval", () => {
    const retriever = createRetriever();

    const results = retriever.search("القانون العمل", [1, 0, 0]);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0]!.chunk).toBeDefined();
    expect(results[0]!.score).toBeGreaterThan(0);
  });

  it("combines results appearing in both retrievers", () => {
    const retriever = createRetriever();

    const results = retriever.search("القانون", [1, 0, 0]);

    const chunkA = results.find((result) => result.chunk.id === "chunk_a");

    expect(chunkA).toBeDefined();

    expect(chunkA!.vectorRank).not.toBeNull();
    expect(chunkA!.bm25Rank).not.toBeNull();

    expect(chunkA!.vectorScore).not.toBeNull();
    expect(chunkA!.bm25Score).not.toBeNull();
  });

  it("records null rank when a result comes from only one retriever", () => {
    const retriever = createRetriever();

    const results = retriever.search("المحكمة", [1, 0, 0], {
      vectorTopK: 1,
      bm25TopK: 3,
    });

    const court = results.find((result) => result.chunk.id === "chunk_c");

    expect(court).toBeDefined();

    expect(court!.bm25Rank).toBe(1);
    expect(court!.bm25Score).toBeGreaterThan(0);

    expect(court!.vectorRank).toBeNull();
    expect(court!.vectorScore).toBeNull();
  });

  it("uses reciprocal rank fusion", () => {
    const retriever = createRetriever();

    const results = retriever.search("القانون", [1, 0, 0], {
      rrfK: 1,
    });

    const chunkA = results.find((result) => result.chunk.id === "chunk_a");

    expect(chunkA).toBeDefined();

    expect(chunkA!.vectorRank).toBe(1);
    expect(chunkA!.bm25Rank).toBe(1);

    expect(chunkA!.score).toBeCloseTo(1);
  });

  it("applies vector and BM25 weights", () => {
    const retriever = createRetriever();

    const equalWeights = retriever.search("القانون", [1, 0, 0], {
      rrfK: 1,
      vectorWeight: 1,
      bm25Weight: 1,
    });

    const vectorOnly = retriever.search("القانون", [1, 0, 0], {
      rrfK: 1,
      vectorWeight: 1,
      bm25Weight: 0,
    });

    const equalChunk = equalWeights.find(
      (result) => result.chunk.id === "chunk_a",
    );

    const vectorChunk = vectorOnly.find(
      (result) => result.chunk.id === "chunk_a",
    );

    expect(equalChunk!.score).toBeGreaterThan(vectorChunk!.score);
  });

  it("respects topK", () => {
    const retriever = createRetriever();

    const results = retriever.search(
      "القانون العمل العامل المحكمة",
      [1, 0, 0],
      {
        topK: 2,
      },
    );

    expect(results).toHaveLength(2);
  });

  it("supports separate candidate limits", () => {
    const retriever = createRetriever();

    const results = retriever.search("القانون العمل", [1, 0, 0], {
      vectorTopK: 1,
      bm25TopK: 1,
      topK: 3,
    });

    expect(results.length).toBeLessThanOrEqual(2);
  });

  it("preserves the canonical chunk", () => {
    const corpus = createCorpus();

    const retriever = new HybridRetriever(corpus, createArtifact());

    const results = retriever.search("القانون", [1, 0, 0]);

    const result = results.find((item) => item.chunk.id === "chunk_a");

    expect(result!.chunk).toEqual(corpus.chunks[0]);
  });

  it("deduplicates chunks appearing in both result sets", () => {
    const retriever = createRetriever();

    const results = retriever.search("القانون", [1, 0, 0]);

    const ids = results.map((result) => result.chunk.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("produces deterministic ordering", () => {
    const retriever = createRetriever();

    const first = retriever.search("القانون العمل", [1, 0, 0]);

    const second = retriever.search("القانون العمل", [1, 0, 0]);

    expect(first.map((result) => result.chunk.id)).toEqual(
      second.map((result) => result.chunk.id),
    );

    expect(first.map((result) => result.score)).toEqual(
      second.map((result) => result.score),
    );
  });

  it("rejects invalid topK", () => {
    const retriever = createRetriever();

    expect(() => retriever.search("القانون", [1, 0, 0], { topK: 0 })).toThrow(
      /topK/i,
    );
  });

  it("rejects invalid vectorTopK", () => {
    const retriever = createRetriever();

    expect(() =>
      retriever.search("القانون", [1, 0, 0], { vectorTopK: 0 }),
    ).toThrow(/vectorTopK/i);
  });

  it("rejects invalid bm25TopK", () => {
    const retriever = createRetriever();

    expect(() =>
      retriever.search("القانون", [1, 0, 0], { bm25TopK: 0 }),
    ).toThrow(/bm25TopK/i);
  });

  it("rejects negative vector weight", () => {
    const retriever = createRetriever();

    expect(() =>
      retriever.search("القانون", [1, 0, 0], { vectorWeight: -1 }),
    ).toThrow(/vectorWeight/i);
  });

  it("rejects negative BM25 weight", () => {
    const retriever = createRetriever();

    expect(() =>
      retriever.search("القانون", [1, 0, 0], { bm25Weight: -1 }),
    ).toThrow(/bm25Weight/i);
  });

  it("rejects zero vector and BM25 weights", () => {
    const retriever = createRetriever();

    expect(() =>
      retriever.search("القانون", [1, 0, 0], {
        vectorWeight: 0,
        bm25Weight: 0,
      }),
    ).toThrow(/at least one.*weight/i);
  });

  it("rejects invalid rrfK", () => {
    const retriever = createRetriever();

    expect(() => retriever.search("القانون", [1, 0, 0], { rrfK: 0 })).toThrow(
      /rrfK/i,
    );
  });

  it("rejects negative minScore", () => {
    const retriever = createRetriever();

    expect(() =>
      retriever.search("القانون", [1, 0, 0], { minScore: -1 }),
    ).toThrow(/minScore/i);
  });

  it("filters results using minScore", () => {
    const retriever = createRetriever();

    const all = retriever.search("القانون", [1, 0, 0]);

    expect(all.length).toBeGreaterThan(0);

    const threshold = all[0]!.score + 1;

    const filtered = retriever.search("القانون", [1, 0, 0], {
      minScore: threshold,
    });

    expect(filtered).toHaveLength(0);
  });

  it("supports vector-only fusion", () => {
    const retriever = createRetriever();

    const results = retriever.search("القانون", [1, 0, 0], {
      vectorWeight: 1,
      bm25Weight: 0,
    });

    expect(results.length).toBeGreaterThan(0);

    expect(results[0]!.vectorRank).toBe(1);
  });

  it("supports BM25-only fusion", () => {
    const retriever = createRetriever();

    const results = retriever.search("القانون", [1, 0, 0], {
      vectorWeight: 0,
      bm25Weight: 1,
    });

    expect(results.length).toBeGreaterThan(0);

    expect(results[0]!.bm25Rank).toBe(1);
  });
});
