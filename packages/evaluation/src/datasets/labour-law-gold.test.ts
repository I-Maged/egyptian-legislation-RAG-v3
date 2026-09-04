import { describe, expect, it } from "vitest";

import type { CanonicalCorpus, LawChunk } from "@egyptian-law/core";

import {
  buildLabourLawGoldDataset,
  labourLawGoldDraft,
} from "./labour-law-gold";

function createChunk(id: string, articleNumber: string): LawChunk {
  return {
    id,
    document_id: "labour-law",
    law_name: "labour_law",
    law_number: "148",
    year: "2019",
    article_number: articleNumber,
    article_title: null,
    hierarchy: [],
    text: `Article ${articleNumber}`,
    text_for_embedding: `Article ${articleNumber}`,
    source_order: Number(articleNumber),
    provenance: {
      source_file: "labour-law.pdf",
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
  const articleNumbers = [
    ...new Set(
      labourLawGoldDraft.flatMap((draft) => draft.relevantArticleNumbers),
    ),
  ];

  return {
    schema_version: "1.0",
    document: {
      id: "labour-law",
      law_name: "labour_law",
      law_number: "148",
      year: "2019",
      jurisdiction: "EG",
      language: "ar",
      source_file: "labour-law.pdf",
      metadata: {
        parser_version: "test",
        normalization_version: "test",
      },
    },
    chunks: articleNumbers.map((articleNumber) =>
      createChunk(`chunk-${articleNumber}`, articleNumber),
    ),
  };
}

describe("Labour Law gold dataset", () => {
  it("contains the initial benchmark questions", () => {
    expect(labourLawGoldDraft.length).toBeGreaterThanOrEqual(15);
  });

  it("has unique question IDs", () => {
    const ids = labourLawGoldDraft.map((item) => item.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has non-empty queries", () => {
    for (const item of labourLawGoldDraft) {
      expect(item.query.trim()).not.toBe("");
    }
  });

  it("has at least one relevant article per question", () => {
    for (const item of labourLawGoldDraft) {
      expect(item.relevantArticleNumbers.length).toBeGreaterThan(0);
    }
  });

  it("resolves article numbers to canonical chunk IDs", () => {
    const dataset = buildLabourLawGoldDataset(createCorpus());

    expect(dataset.items).toHaveLength(labourLawGoldDraft.length);

    for (const item of dataset.items) {
      expect(item.relevantChunkIds.length).toBeGreaterThan(0);

      for (const chunkId of item.relevantChunkIds) {
        expect(chunkId).toMatch(/^chunk-/);
      }
    }
  });

  it("does not duplicate relevant chunk IDs", () => {
    const dataset = buildLabourLawGoldDataset(createCorpus());

    for (const item of dataset.items) {
      expect(new Set(item.relevantChunkIds).size).toBe(
        item.relevantChunkIds.length,
      );
    }
  });

  it("fails when a referenced article is missing", () => {
    const corpus = createCorpus();

    corpus.chunks = corpus.chunks.filter(
      (chunk) => chunk.article_number !== "90",
    );

    expect(() => buildLabourLawGoldDataset(corpus)).toThrow(
      /article 90.*not found/i,
    );
  });
});
