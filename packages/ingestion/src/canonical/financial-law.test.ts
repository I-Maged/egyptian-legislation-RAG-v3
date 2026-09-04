import { describe, expect, it } from "vitest";

import { LawChunkSchema, LawDocumentSchema } from "@egyptian-law/core";

import {
  canonicalizeFinancialLaw,
  type FinancialLawParserArticle,
} from "./financial-law";

describe("canonicalizeFinancialLaw", () => {
  const parserChunks: FinancialLawParserArticle[] = [
    {
      instrumentId: "financial_law-18-2019",

      lawName: "financial_law",
      lawNumber: "18",
      year: "2019",

      articleNumber: "2",
      articleNumberNormalized: 2,
      articleSuffix: null,

      chapter: null,

      text: "مادة (2):\nالنص القانوني للمادة الثانية.",
      textForEmbedding: "مادة (2):\nالنص القانوني للمادة الثانية.",

      pageStart: 2,
      pageEnd: 2,
      pages: [2],

      sourceOrder: 2,
      source: "vision_ocr",

      sourceRecordIds: ["qwen:0:2:2"],
      qwenRecordCount: 1,
      recoveryRecordCount: 0,

      needsReview: false,
      reviewReasons: [],
    },

    {
      instrumentId: "financial_law-18-2019",

      lawName: "financial_law",
      lawNumber: "18",
      year: "2019",

      articleNumber: "26",
      articleNumberNormalized: 26,
      articleSuffix: null,

      chapter: "الباب الخامس : الاقتراض.",

      text: "مادة (26):\nالنص القانوني للمادة السادسة والعشرين.",
      textForEmbedding: "مادة (26):\nالنص القانوني للمادة السادسة والعشرين.",

      pageStart: 5,
      pageEnd: 5,
      pages: [5],

      sourceOrder: 26,
      source: "vision_ocr",

      sourceRecordIds: ["qwen:23:5:26"],
      qwenRecordCount: 1,
      recoveryRecordCount: 0,

      needsReview: false,
      reviewReasons: [],
    },
  ];

  it("converts parser output into the canonical corpus format", () => {
    const result = canonicalizeFinancialLaw(parserChunks);

    expect(result.schema_version).toBe("1.0");

    expect(result.document.law_name).toBe("financial_law");
    expect(result.document.law_number).toBe("18");
    expect(result.document.year).toBe("2019");
    expect(result.document.jurisdiction).toBe("EG");
    expect(result.document.language).toBe("ar");

    expect(result.chunks).toHaveLength(2);
  });

  it("produces a document satisfying the canonical document schema", () => {
    const result = canonicalizeFinancialLaw(parserChunks);

    expect(LawDocumentSchema.safeParse(result.document).success).toBe(true);
  });

  it("produces chunks satisfying the canonical chunk schema", () => {
    const result = canonicalizeFinancialLaw(parserChunks);

    for (const chunk of result.chunks) {
      expect(LawChunkSchema.safeParse(chunk).success).toBe(true);
    }
  });

  it("preserves article content and metadata", () => {
    const result = canonicalizeFinancialLaw(parserChunks);

    expect(result.chunks).toMatchObject([
      {
        law_name: "financial_law",
        law_number: "18",
        year: "2019",
        article_number: "2",
        text: "مادة (2):\nالنص القانوني للمادة الثانية.",
        text_for_embedding: "مادة (2):\nالنص القانوني للمادة الثانية.",
        source_order: 2,
        hierarchy: [],
        provenance: {
          page_start: 2,
          page_end: 2,
        },
      },
      {
        law_name: "financial_law",
        law_number: "18",
        year: "2019",
        article_number: "26",
        text: "مادة (26):\nالنص القانوني للمادة السادسة والعشرين.",
        text_for_embedding:
          "مادة (26):\nالنص القانوني للمادة السادسة والعشرين.",
        source_order: 26,
        hierarchy: [
          {
            type: "chapter",
            label: "الباب الخامس : الاقتراض.",
            title: null,
          },
        ],
        provenance: {
          page_start: 5,
          page_end: 5,
        },
      },
    ]);
  });

  it("preserves the parser source order", () => {
    const result = canonicalizeFinancialLaw(parserChunks);

    expect(result.chunks[0]!.source_order).toBe(2);
    expect(result.chunks[1]!.source_order).toBe(26);
  });

  it("uses an empty hierarchy when chapter is null", () => {
    const result = canonicalizeFinancialLaw([parserChunks[0]!]);

    expect(result.chunks[0]!.hierarchy).toEqual([]);
  });

  it("maps chapter into the canonical hierarchy", () => {
    const result = canonicalizeFinancialLaw([parserChunks[1]!]);

    expect(result.chunks[0]!.hierarchy).toEqual([
      {
        type: "chapter",
        label: "الباب الخامس : الاقتراض.",
        title: null,
      },
    ]);
  });

  it("preserves provenance", () => {
    const result = canonicalizeFinancialLaw(parserChunks);

    expect(result.chunks[0]!.provenance).toEqual({
      source_file: "financial_law.pdf",
      page_start: 2,
      page_end: 2,
    });
  });

  it("creates unique chunk IDs", () => {
    const result = canonicalizeFinancialLaw(parserChunks);

    const ids = result.chunks.map((chunk) => chunk.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("assigns every chunk to the canonical document", () => {
    const result = canonicalizeFinancialLaw(parserChunks);

    for (const chunk of result.chunks) {
      expect(chunk.document_id).toBe(result.document.id);
    }
  });

  it("rejects empty parser output", () => {
    expect(() => canonicalizeFinancialLaw([])).toThrow(
      "Cannot canonicalize an empty parser output.",
    );
  });
});
