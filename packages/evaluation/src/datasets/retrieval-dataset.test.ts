import { describe, expect, it } from "vitest";

import type { CanonicalCorpus } from "@egyptian-law/core";

import {
  validateRetrievalGoldDataset,
  type RetrievalGoldDataset,
} from "./retrieval-dataset";

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
      {
        id: "chunk_a",
        document_id: "lawdoc_test",
        law_name: "test_law",
        law_number: "1",
        year: "2026",
        article_number: "1",
        article_title: null,
        hierarchy: [],
        text: "Article 1",
        text_for_embedding: "Article 1",
        source_order: 1,
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
      },
      {
        id: "chunk_b",
        document_id: "lawdoc_test",
        law_name: "test_law",
        law_number: "1",
        year: "2026",
        article_number: "2",
        article_title: null,
        hierarchy: [],
        text: "Article 2",
        text_for_embedding: "Article 2",
        source_order: 2,
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
      },
    ],
  };
}

function createDataset(): RetrievalGoldDataset {
  return {
    schema_version: "1.0",
    name: "test-retrieval",
    description: "Test retrieval dataset",
    language: "ar",
    jurisdiction: "EG",
    items: [
      {
        id: "q1",
        query: "ما هو النص؟",
        relevantChunkIds: ["chunk_a"],
      },
    ],
  };
}

describe("validateRetrievalGoldDataset", () => {
  it("accepts a valid dataset", () => {
    expect(() =>
      validateRetrievalGoldDataset(createDataset(), createCorpus()),
    ).not.toThrow();
  });

  it("rejects duplicate query IDs", () => {
    const dataset = createDataset();

    dataset.items.push({
      ...dataset.items[0]!,
    });

    expect(() => validateRetrievalGoldDataset(dataset)).toThrow(
      /duplicate retrieval query id/i,
    );
  });

  it("rejects empty queries", () => {
    const dataset = createDataset();

    dataset.items[0]!.query = "   ";

    expect(() => validateRetrievalGoldDataset(dataset)).toThrow(/empty query/i);
  });

  it("rejects queries without relevant chunks", () => {
    const dataset = createDataset();

    dataset.items[0]!.relevantChunkIds = [];

    expect(() => validateRetrievalGoldDataset(dataset)).toThrow(
      /no relevant chunks/i,
    );
  });

  it("rejects duplicate relevant chunk IDs", () => {
    const dataset = createDataset();

    dataset.items[0]!.relevantChunkIds = ["chunk_a", "chunk_a"];

    expect(() => validateRetrievalGoldDataset(dataset)).toThrow(
      /duplicate relevant chunk id/i,
    );
  });

  it("rejects unknown corpus chunk IDs", () => {
    const dataset = createDataset();

    dataset.items[0]!.relevantChunkIds = ["chunk_unknown"];

    expect(() => validateRetrievalGoldDataset(dataset, createCorpus())).toThrow(
      /unknown chunk id/i,
    );
  });

  it("accepts graded relevance", () => {
    const dataset = createDataset();

    dataset.items[0]!.relevance = {
      chunk_a: 3,
    };

    expect(() => validateRetrievalGoldDataset(dataset)).not.toThrow();
  });

  it("rejects invalid relevance scores", () => {
    const dataset = createDataset();

    dataset.items[0]!.relevance = {
      chunk_a: 4,
    };

    expect(() => validateRetrievalGoldDataset(dataset)).toThrow(
      /invalid relevance score/i,
    );
  });

  it("rejects relevance for non-relevant chunks", () => {
    const dataset = createDataset();

    dataset.items[0]!.relevance = {
      chunk_b: 3,
    };

    expect(() => validateRetrievalGoldDataset(dataset)).toThrow(
      /is not in relevantChunkIds/i,
    );
  });
});
