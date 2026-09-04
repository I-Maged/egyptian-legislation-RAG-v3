import { describe, expect, it } from "vitest";

import type { LawChunk } from "@egyptian-law/core";

import { buildRagContext } from "./context";

function chunk(): LawChunk {
  return {
    id: "chunk-1",

    document_id: "doc-1",

    law_name: "قانون العمل",

    law_number: "148",

    year: "2019",

    article_number: "88",

    article_title: "إبرام عقد العمل",

    source_order: 88,

    hierarchy: [
      {
        type: "book",
        label: "الكتاب الثالث",
        title: null,
      },
      {
        type: "chapter",
        label: "الباب الأول",
        title: null,
      },
      {
        type: "section",
        label: "الفصل الأول",
        title: "عقد العمل",
      },
    ],

    text: "يعتبر عقد العمل غير محدد المدة في الحالات الآتية.",

    text_for_embedding: "يعتبر عقد العمل غير محدد المدة في الحالات الآتية.",

    provenance: {
      source_file: "labour-law.pdf",

      page_start: 43,

      page_end: 43,
    },

    metadata: {
      parser_version: "parser-v2.3",

      normalization_version: "normalization-v1",

      ocr_confidence: 0.97,
    },
  };
}

describe("buildRagContext", () => {
  it("builds structured legal context", () => {
    const context = buildRagContext([
      {
        chunk: chunk(),

        vectorScore: 0.9,

        rerankScore: 0.95,

        retrievalScore: 0.9,

        matchedTerms: 2,

        termCoverage: 1,

        exactPhraseMatch: true,
      },
    ]);

    expect(context.documents).toHaveLength(1);

    expect(context.documents[0]).toMatchObject({
      citationId: "[1]",
      chunkId: "chunk-1",
      lawName: "قانون العمل",
      articleNumber: "88",
      sourceFile: "labour-law.pdf",
      pageStart: 43,
      pageEnd: 43,
    });

    expect(context.text).toContain("القانون: قانون العمل");

    expect(context.text).toContain("المادة: 88");

    expect(context.text).toContain(
      "الكتاب الثالث > الباب الأول > الفصل الأول: عقد العمل",
    );

    expect(context.text).toContain("النص القانوني:");
  });
});
