import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

import { afterEach, describe, expect, it } from "vitest";

import { validateCanonicalCorpus } from "@egyptian-law/core";

import { readCanonicalCorpusJson } from "./read-json";
import { writeCanonicalCorpusJson } from "./write-json";

describe("canonical corpus JSON", () => {
  let tempDir: string | undefined;

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, {
        recursive: true,
        force: true,
      });

      tempDir = undefined;
    }
  });

  it("round-trips a canonical corpus through JSON", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "canonical-corpus-"));

    const filePath = join(tempDir, "labour-law-148-2019.json");

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
          id: "lawchunk_test_1",

          document_id: "lawdoc_test",

          law_name: "labour_law",
          law_number: "148",
          year: "2019",

          article_number: "2",
          article_title: null,

          source_order: 1,

          hierarchy: [
            {
              type: "chapter",
              label: "الباب الأول",
              title: null,
            },
          ],

          text: "مادة (٢): نص المادة للاختبار.",

          text_for_embedding: "مادة (٢): نص المادة للاختبار.",

          provenance: {
            source_file: "labour-v2.3.pdf",
            page_start: 11,
            page_end: 11,
          },

          metadata: {
            parser_version: "parser-v2.3",
            normalization_version: "parser-v2.3",
            ocr_confidence: null,
          },
        },

        {
          id: "lawchunk_test_2",

          document_id: "lawdoc_test",

          law_name: "labour_law",
          law_number: "148",
          year: "2019",

          article_number: "3",
          article_title: null,

          source_order: 2,

          hierarchy: [
            {
              type: "chapter",
              label: "الباب الثاني",
              title: null,
            },
          ],

          text: "مادة (٣): نص المادة الثانية للاختبار.",

          text_for_embedding: "مادة (٣): نص المادة الثانية للاختبار.",

          provenance: {
            source_file: "labour-v2.3.pdf",
            page_start: 11,
            page_end: 11,
          },

          metadata: {
            parser_version: "parser-v2.3",
            normalization_version: "parser-v2.3",
            ocr_confidence: null,
          },
        },
      ],
    });

    await writeCanonicalCorpusJson(filePath, corpus);

    const readBack = await readCanonicalCorpusJson(filePath);

    expect(readBack).toEqual(corpus);
  });
});
