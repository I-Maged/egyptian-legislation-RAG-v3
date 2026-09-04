import { describe, expect, it } from "vitest";

import { validateCanonicalCorpus } from "@egyptian-law/core";

import { inspectCanonicalCorpus } from "../corpus/inspect";

describe("inspectCanonicalCorpus", () => {
  it("calculates canonical corpus statistics", () => {
    const corpus = validateCanonicalCorpus({
      schema_version: "1.0",

      document: {
        id: "lawdoc_test",
        law_name: "labour_law",
        law_number: "148",
        year: "2019",
        jurisdiction: "EG",
        language: "ar",
        source_file: "labour-v2.3.pdf",

        metadata: {
          parser_version: "parser-v2.3",
          normalization_version: "parser-v2.3",
        },
      },

      chunks: [
        {
          id: "chunk_1",
          document_id: "lawdoc_test",

          law_name: "labour_law",
          law_number: "148",
          year: "2019",

          article_number: "1",
          article_title: null,

          source_order: 1,

          hierarchy: [
            {
              type: "chapter",
              label: "الباب الأول",
              title: null,
            },
          ],

          text: "AAAA",
          text_for_embedding: "AAA",

          provenance: {
            source_file: "labour-v2.3.pdf",
            page_start: 1,
            page_end: 1,
          },

          metadata: {
            parser_version: "parser-v2.3",
            normalization_version: "parser-v2.3",
            ocr_confidence: null,
          },
        },

        {
          id: "chunk_2",
          document_id: "lawdoc_test",

          law_name: "labour_law",
          law_number: "148",
          year: "2019",

          article_number: "2",
          article_title: null,

          source_order: null,

          hierarchy: [],

          text: "BBBBBB",
          text_for_embedding: "BBBB",

          provenance: {
            source_file: "labour-v2.3.pdf",
            page_start: 2,
            page_end: null,
          },

          metadata: {
            parser_version: "parser-v2.3",
            normalization_version: "parser-v2.3",
            ocr_confidence: null,
          },
        },
      ],
    });

    const statistics = inspectCanonicalCorpus(corpus);

    expect(statistics.document.law_name).toBe("labour_law");

    expect(statistics.chunks.total).toBe(2);

    expect(statistics.chunks.article_numbers).toEqual({
      unique: 2,
      missing: 0,
      duplicates: 0,
    });

    expect(statistics.chunks.source_order).toEqual({
      present: 1,
      null: 1,
      min: 1,
      max: 1,
    });

    expect(statistics.chunks.provenance).toEqual({
      page_start_present: 2,
      page_end_present: 1,
      both_present: 1,
    });

    expect(statistics.chunks.text).toEqual({
      min_chars: 4,
      max_chars: 6,
      mean_chars: 5,
      median_chars: 5,
    });

    expect(statistics.chunks.text_for_embedding).toEqual({
      min_chars: 3,
      max_chars: 4,
      mean_chars: 3.5,
      median_chars: 3.5,
    });

    expect(statistics.chunks.duplicates).toEqual({
      text: 0,
      text_for_embedding: 0,
    });

    expect(statistics.chunks.hierarchy).toEqual({
      with_entries: 1,
      without_entries: 1,
    });
  });

  it("detects duplicate article numbers and text", () => {
    const corpus = validateCanonicalCorpus({
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
          id: "chunk_1",
          document_id: "lawdoc_test",
          law_name: "test_law",
          law_number: "1",
          year: "2026",
          article_number: "1",
          article_title: null,
          source_order: 1,
          hierarchy: [],
          text: "نص مكرر",
          text_for_embedding: "نص مكرر",
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
          id: "chunk_2",
          document_id: "lawdoc_test",
          law_name: "test_law",
          law_number: "1",
          year: "2026",
          article_number: "1",
          article_title: null,
          source_order: 2,
          hierarchy: [],
          text: "نص مكرر",
          text_for_embedding: "نص مكرر",
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
    });

    const statistics = inspectCanonicalCorpus(corpus);

    expect(statistics.chunks.article_numbers.duplicates).toBe(1);

    expect(statistics.chunks.duplicates).toEqual({
      text: 1,
      text_for_embedding: 1,
    });
  });
});
