import { describe, expect, it } from "vitest";

import type { CanonicalCorpus, LawChunk } from "@egyptian-law/core";

import { InMemoryBm25Retriever } from "./bm25-retriever";

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
      createChunk("chunk_a", "1", "ينظم القانون علاقات العمل وحقوق العمال"),
      createChunk("chunk_b", "2", "يستحق العامل الاجر عن العمل الذي يؤديه"),
      createChunk("chunk_c", "3", "تنظر المحكمة الدعاوى والمنازعات"),
    ],
  };
}

describe("InMemoryBm25Retriever", () => {
  it("returns results ordered by BM25 score", () => {
    const retriever = new InMemoryBm25Retriever(createCorpus());

    const results = retriever.search("القانون العمل");

    expect(results.length).toBeGreaterThan(0);
    expect(results[0]!.chunk.id).toBe("chunk_a");
    expect(results[0]!.score).toBeGreaterThan(0);
  });

  it("preserves the complete canonical chunk", () => {
    const corpus = createCorpus();

    const retriever = new InMemoryBm25Retriever(corpus);

    const results = retriever.search("العامل الاجر");

    expect(results[0]!.chunk).toEqual(corpus.chunks[1]);
  });

  it("respects topK", () => {
    const retriever = new InMemoryBm25Retriever(createCorpus());

    const results = retriever.search("العمل العامل القانون", {
      topK: 2,
    });

    expect(results).toHaveLength(2);
  });

  it("respects minScore", () => {
    const retriever = new InMemoryBm25Retriever(createCorpus());

    const all = retriever.search("القانون");

    expect(all.length).toBeGreaterThan(0);

    const threshold = all[0]!.score + 1;

    const filtered = retriever.search("القانون", {
      minScore: threshold,
    });

    expect(filtered).toHaveLength(0);
  });

  it("returns an empty result for an unknown query", () => {
    const retriever = new InMemoryBm25Retriever(createCorpus());

    expect(retriever.search("كلمةغيرموجودة")).toEqual([]);
  });

  it("returns an empty result for an empty query", () => {
    const retriever = new InMemoryBm25Retriever(createCorpus());

    expect(retriever.search("")).toEqual([]);
    expect(retriever.search("   ")).toEqual([]);
  });

  it("handles Arabic normalization during retrieval", () => {
    const retriever = new InMemoryBm25Retriever(createCorpus());

    const results = retriever.search("أَلْعَمَل");

    expect(results[0]!.chunk.id).toBe("chunk_a");
  });

  it("rejects an empty corpus", () => {
    const corpus = createCorpus();
    corpus.chunks = [];

    expect(() => new InMemoryBm25Retriever(corpus)).toThrow(/empty corpus/i);
  });

  it("rejects duplicate chunk IDs", () => {
    const corpus = createCorpus();

    corpus.chunks.push({
      ...corpus.chunks[0]!,
    });

    expect(() => new InMemoryBm25Retriever(corpus)).toThrow(
      /duplicate chunk ID/i,
    );
  });

  it("rejects invalid topK", () => {
    const retriever = new InMemoryBm25Retriever(createCorpus());

    expect(() =>
      retriever.search("القانون", {
        topK: 0,
      }),
    ).toThrow(/topK/i);
  });

  it("rejects negative minScore", () => {
    const retriever = new InMemoryBm25Retriever(createCorpus());

    expect(() =>
      retriever.search("القانون", {
        minScore: -1,
      }),
    ).toThrow(/minScore/i);
  });

  it("does not mutate the canonical corpus", () => {
    const corpus = createCorpus();

    const before = structuredClone(corpus);

    const retriever = new InMemoryBm25Retriever(corpus);

    retriever.search("القانون العمل");

    expect(corpus).toEqual(before);
  });

  it("uses text_for_embedding for lexical retrieval", () => {
    const corpus = createCorpus();

    corpus.chunks[0]!.text = "هذا النص لا يحتوي على المصطلح المطلوب";
    corpus.chunks[0]!.text_for_embedding = "القانون العمل";

    const retriever = new InMemoryBm25Retriever(corpus);

    const results = retriever.search("القانون العمل");

    expect(results[0]!.chunk.id).toBe("chunk_a");
  });

  it("produces deterministic ordering for repeated searches", () => {
    const retriever = new InMemoryBm25Retriever(createCorpus());

    const first = retriever.search("القانون");
    const second = retriever.search("القانون");

    expect(first.map((result) => result.chunk.id)).toEqual(
      second.map((result) => result.chunk.id),
    );
  });
});
