import { describe, expect, it } from "vitest";

import { LawChunkSchema, LawDocumentSchema } from "@egyptian-law/core";

import { canonicalizeLabourLaw, type ParserV23LawChunk } from "./labour-law";

describe("canonicalizeLabourLaw", () => {
  it("converts parser v2.3 output into the canonical corpus format", () => {
    const parserChunks: ParserV23LawChunk[] = [
      {
        instrumentId: "test-instrument",

        lawName: "قانون العمل",
        lawNumber: "12",
        year: "2003",

        articleNumber: "1",
        articleNumberNormalized: 1,
        articleSuffix: null,

        chapter: "مواد الإصدار",

        text: "نص المادة الأولى...",
        textForEmbedding: "...",

        pageStart: 5,
        pageEnd: 5,
        pages: [5],

        sourceOrder: 1,

        source: "vision_ocr",

        sourceRecordIds: ["test-record-1"],
        qwenRecordCount: 0,
        recoveryRecordCount: 0,

        needsReview: false,
        reviewReasons: [],
      },

      {
        instrumentId: "test-instrument",

        lawName: "قانون العمل",
        lawNumber: "12",
        year: "2003",

        articleNumber: "2",
        articleNumberNormalized: 2,
        articleSuffix: null,

        chapter: "الباب الأول",

        text: "نص المادة الثانية...",
        textForEmbedding: "...",

        pageStart: 6,
        pageEnd: 6,
        pages: [6],

        sourceOrder: 2,

        source: "vision_ocr",

        sourceRecordIds: ["test-record-2"],
        qwenRecordCount: 0,
        recoveryRecordCount: 0,

        needsReview: false,
        reviewReasons: [],
      },
    ];

    const result = canonicalizeLabourLaw(parserChunks, {
      source_file: "labour-law.pdf",
      parser_version: "parser-v2.3",
      normalization_version: "parser-v2.3",
    });

    expect(LawDocumentSchema.safeParse(result.document).success).toBe(true);

    expect(result.chunks).toHaveLength(2);

    for (const chunk of result.chunks) {
      expect(LawChunkSchema.safeParse(chunk).success).toBe(true);
    }

    expect(result.document.id).toBeTruthy();

    const firstChunk = result.chunks[0];

    expect(firstChunk).toBeDefined();
    expect(firstChunk!.document_id).toBe(result.document.id);
    expect(firstChunk!.article_number).toBe("1");
    expect(firstChunk!.source_order).toBe(parserChunks[0]!.sourceOrder ?? null);
    expect(firstChunk!.hierarchy).toEqual([
      {
        type: "chapter",
        label: "مواد الإصدار",
        title: null,
      },
    ]);

    expect(firstChunk!.provenance).toEqual({
      source_file: "labour-law.pdf",
      page_start: 5,
      page_end: 5,
    });

    expect(firstChunk!.metadata.ocr_confidence).toBeNull();
    expect(result.schema_version).toBe("1.0");
  });
});
