import { describe, expect, it } from "vitest";

import { validateCanonicalCorpus } from "./corpus";

describe("validateCanonicalCorpus", () => {
  const validCorpus = {
    schema_version: "1.0" as const,

    document: {
      id: "lawdoc_test",

      law_name: "قانون العمل",
      law_number: "12",
      year: "2003",

      jurisdiction: "EG" as const,
      language: "ar" as const,

      source_file: "labour-law.pdf",

      metadata: {
        parser_version: "parser-v2.3",
        normalization_version: "normalization-v1",
      },
    },

    chunks: [
      {
        id: "lawchunk_1",

        document_id: "lawdoc_test",

        law_name: "قانون العمل",
        law_number: "12",
        year: "2003",

        article_number: "1",
        article_title: null,

        source_order: 123,

        hierarchy: [
          {
            type: "chapter",
            label: "الباب الثاني",
            title: null,
          },
        ],

        text: "نص المادة الأولى",
        text_for_embedding: "نص المادة الأولى",

        provenance: {
          source_file: "labour-v2.3.pdf",
          page_start: 1,
          page_end: 1,
        },

        metadata: {
          parser_version: "parser-v2.3",
          normalization_version: "normalization-v1",
          ocr_confidence: null,
        },
      },
    ],
  };

  it("accepts a valid canonical corpus", () => {
    const result = validateCanonicalCorpus(validCorpus);

    expect(result).toEqual(validCorpus);
  });

  it("rejects a chunk belonging to another document", () => {
    const invalidCorpus = {
      ...validCorpus,

      chunks: [
        {
          ...validCorpus.chunks[0],
          document_id: "lawdoc_other",
        },
      ],
    };

    expect(() => validateCanonicalCorpus(invalidCorpus)).toThrow(
      /references document/,
    );
  });

  it("rejects duplicate chunk IDs", () => {
    const invalidCorpus = {
      ...validCorpus,

      chunks: [
        validCorpus.chunks[0],
        {
          ...validCorpus.chunks[0],
          article_number: "2",
        },
      ],
    };

    expect(() => validateCanonicalCorpus(invalidCorpus)).toThrow(
      /Duplicate chunk ID/,
    );
  });

  it("rejects an unsupported schema version", () => {
    const invalidCorpus = {
      ...validCorpus,
      schema_version: "2.0",
    };

    expect(() => validateCanonicalCorpus(invalidCorpus)).toThrow();
  });
});
