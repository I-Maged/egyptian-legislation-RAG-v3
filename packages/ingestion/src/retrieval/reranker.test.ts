import { describe, expect, it } from "vitest";

import type { LawChunk } from "@egyptian-law/core";
import { RerankCandidate } from "./reranker";

import { BaselineReranker, type RerankOptions } from "./reranker";

function createChunk(id: string, text: string): LawChunk {
  return {
    id,
    document_id: "lawdoc_test",
    law_name: "test_law",
    law_number: "1",
    year: "2026",
    article_number: id,
    article_title: null,
    hierarchy: [],
    text,
    text_for_embedding: text,
    source_order: Number(id),
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

function createCandidate(
  id: string,
  text: string,
  score: number,
): RerankCandidate {
  return {
    chunk: createChunk(id, text),
    score,
    vectorScore: score,
  };
}

function createCandidates(): RerankCandidate[] {
  return [
    createCandidate("1", "ينظم القانون عقد العمل وحقوق العامل", 0.03),
    createCandidate("2", "ينظم القانون علاقات العمال", 0.02),
    createCandidate("3", "تنظر المحكمة الدعاوى والمنازعات", 0.01),
  ];
}

describe("BaselineReranker", () => {
  it("reranks candidates", () => {
    const reranker = new BaselineReranker();

    const results = reranker.rerank("عقد العمل", createCandidates());

    expect(results.length).toBe(3);
    expect(results[0]!.chunk).toBeDefined();
    expect(results[0]!.score).toBeGreaterThan(0);
  });

  it("strongly favors an exact phrase match", () => {
    const candidates = [
      createCandidate("exact", "تنطبق أحكام عقد العمل على العامل", 0.01),
      createCandidate("partial", "تنطبق أحكام العقد على العامل", 0.02),
    ];

    const reranker = new BaselineReranker();

    const results = reranker.rerank("عقد العمل", candidates);

    expect(results[0]!.chunk.id).toBe("exact");
    expect(results[0]!.exactPhraseMatch).toBe(true);
  });

  it("calculates query-term coverage", () => {
    const candidates = [
      createCandidate("all", "القانون ينظم عقد العمل", 0.01),
      createCandidate("partial", "القانون ينظم المحكمة", 0.02),
    ];

    const reranker = new BaselineReranker();

    const results = reranker.rerank("القانون عقد العمل", candidates);

    const all = results.find((result) => result.chunk.id === "all");

    expect(all!.matchedTerms).toBe(3);
    expect(all!.termCoverage).toBe(1);
  });

  it("returns zero coverage when no query terms match", () => {
    const candidates = [createCandidate("a", "المحكمة تنظر الدعوى", 0.01)];

    const reranker = new BaselineReranker();

    const results = reranker.rerank("القانون العمل", candidates);

    expect(results[0]!.matchedTerms).toBe(0);
    expect(results[0]!.termCoverage).toBe(0);
    expect(results[0]!.exactPhraseMatch).toBe(false);
  });

  it("preserves original retrieval metadata", () => {
    const candidates = createCandidates();

    const reranker = new BaselineReranker();

    const results = reranker.rerank("القانون", candidates);

    expect(results[0]!.retrievalScore).toBeGreaterThan(0);
    // expect(results[0]!.vectorScore).toBe(0.8);
  });

  it("respects topK", () => {
    const reranker = new BaselineReranker();

    const results = reranker.rerank("القانون", createCandidates(), {
      topK: 2,
    });

    expect(results).toHaveLength(2);
  });

  it("returns empty results for empty candidates", () => {
    const reranker = new BaselineReranker();

    expect(reranker.rerank("القانون", [])).toEqual([]);
  });

  it("returns empty results for an empty query", () => {
    const reranker = new BaselineReranker();

    expect(reranker.rerank("", createCandidates())).toEqual([]);

    expect(reranker.rerank("   ", createCandidates())).toEqual([]);
  });

  it("normalizes retrieval scores before using them", () => {
    const candidates = [
      createCandidate("high", "المحكمة", 100),
      createCandidate("low", "المحكمة", 50),
    ];

    const reranker = new BaselineReranker();

    const results = reranker.rerank("المحكمة", candidates, {
      phraseWeight: 0,
      coverageWeight: 0,
      retrievalWeight: 1,
    });

    expect(results[0]!.score).toBeCloseTo(1);
    expect(results[1]!.score).toBeCloseTo(0.5);
  });

  it("supports custom weights", () => {
    const candidates = [
      createCandidate("phrase", "عقد العمل", 0.01),
      createCandidate("retrieval", "المحكمة", 0.02),
    ];

    const reranker = new BaselineReranker();

    const results = reranker.rerank("عقد العمل", candidates, {
      phraseWeight: 1,
      coverageWeight: 0,
      retrievalWeight: 0,
    });

    expect(results[0]!.chunk.id).toBe("phrase");
  });

  it("supports Arabic normalization", () => {
    const candidates = [createCandidate("a", "أحكام عقد العمل", 0.01)];

    const reranker = new BaselineReranker();

    const results = reranker.rerank("عَقْد العمل", candidates);

    expect(results[0]!.exactPhraseMatch).toBe(true);
  });

  it("produces deterministic ordering for ties", () => {
    const candidates = [
      createCandidate("b", "المحكمة", 0.01),
      createCandidate("a", "المحكمة", 0.01),
    ];

    const reranker = new BaselineReranker();

    const first = reranker.rerank("المحكمة", candidates);

    const second = reranker.rerank("المحكمة", candidates);

    expect(first.map((result) => result.chunk.id)).toEqual(
      second.map((result) => result.chunk.id),
    );

    expect(first.map((result) => result.chunk.id)).toEqual(["a", "b"]);
  });

  it("rejects invalid topK", () => {
    const reranker = new BaselineReranker();

    expect(() =>
      reranker.rerank("القانون", createCandidates(), { topK: 0 }),
    ).toThrow(/topK/i);
  });

  it("rejects negative phrase weight", () => {
    const reranker = new BaselineReranker();

    expect(() =>
      reranker.rerank("القانون", createCandidates(), { phraseWeight: -1 }),
    ).toThrow(/phraseWeight/i);
  });

  it("rejects negative coverage weight", () => {
    const reranker = new BaselineReranker();

    expect(() =>
      reranker.rerank("القانون", createCandidates(), { coverageWeight: -1 }),
    ).toThrow(/coverageWeight/i);
  });

  it("rejects negative retrieval weight", () => {
    const reranker = new BaselineReranker();

    expect(() =>
      reranker.rerank("القانون", createCandidates(), { retrievalWeight: -1 }),
    ).toThrow(/retrievalWeight/i);
  });

  it("rejects zero total weight", () => {
    const reranker = new BaselineReranker();

    expect(() =>
      reranker.rerank("القانون", createCandidates(), {
        phraseWeight: 0,
        coverageWeight: 0,
        retrievalWeight: 0,
      }),
    ).toThrow(/at least one.*weight/i);
  });

  it("does not mutate candidates", () => {
    const candidates = createCandidates();

    const before = structuredClone(candidates);

    const reranker = new BaselineReranker();

    reranker.rerank("القانون العمل", candidates);

    expect(candidates).toEqual(before);
  });
});
