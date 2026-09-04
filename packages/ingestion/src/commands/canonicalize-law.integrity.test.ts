import { readFile, rm, mkdtemp } from "fs/promises";
import { tmpdir } from "os";
import { join, resolve } from "path";

import { afterEach, describe, expect, it } from "vitest";

import { validateCanonicalCorpus } from "@egyptian-law/core";

import { canonicalizeLaw } from "./canonicalize-law";

const ROOT_DIR = resolve(process.cwd());

describe("canonicalizeLaw - real corpus integrity", () => {
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

  const cases = [
    {
      law: "labour_law" as const,
      inputPath: resolve(ROOT_DIR, "data/raw/labour-v2.3.json"),
      outputName: "labour-law.json",
      expectedChunks: 293,
      expectedLawName: "labour_law",
      expectedLawNumber: "148",
      expectedYear: "2019",
      expectedSourceFile: "labour-v2.3.pdf",
    },

    {
      law: "personal_affair_law" as const,
      inputPath: resolve(ROOT_DIR, "data/raw/personal_affair_law_v2_3.json"),
      outputName: "personal-affairs-law.json",
      expectedChunks: 92,
      expectedLawName: "personal_affair_law",
      expectedLawNumber: "25",
      expectedYear: "1929",
      expectedSourceFile: "personal_affair_law.pdf",
    },
  ];

  for (const testCase of cases) {
    it(`preserves the canonical corpus contract for ${testCase.law}`, async () => {
      tempDir = await mkdtemp(join(tmpdir(), "canonical-integrity-"));

      const outputPath = join(tempDir, testCase.outputName);

      const corpus = await canonicalizeLaw({
        law: testCase.law,
        inputPath: testCase.inputPath,
        outputPath,
      });

      // --------------------------------------------------
      // 1. Basic corpus structure
      // --------------------------------------------------

      expect(corpus.schema_version).toBe("1.0");

      expect(corpus.document.id).toBeTruthy();

      expect(corpus.document.law_name).toBe(testCase.expectedLawName);

      expect(corpus.document.law_number).toBe(testCase.expectedLawNumber);

      expect(corpus.document.year).toBe(testCase.expectedYear);

      expect(corpus.document.source_file).toBe(testCase.expectedSourceFile);

      expect(corpus.chunks).toHaveLength(testCase.expectedChunks);

      // --------------------------------------------------
      // 2. Validate the complete corpus with Zod +
      //    semantic integrity checks
      // --------------------------------------------------

      const validated = validateCanonicalCorpus(corpus);

      expect(validated).toEqual(corpus);

      // --------------------------------------------------
      // 3. Chunk ID uniqueness
      // --------------------------------------------------

      const chunkIds = corpus.chunks.map((chunk) => chunk.id);

      expect(new Set(chunkIds).size).toBe(chunkIds.length);

      // --------------------------------------------------
      // 4. Every chunk belongs to the document
      // --------------------------------------------------

      for (const chunk of corpus.chunks) {
        expect(chunk.document_id).toBe(corpus.document.id);

        // ------------------------------------------------
        // 5. Required text fields
        // ------------------------------------------------

        expect(chunk.text.trim().length).toBeGreaterThan(0);

        expect(chunk.text_for_embedding.trim().length).toBeGreaterThan(0);

        expect(chunk.article_number.trim().length).toBeGreaterThan(0);

        // ------------------------------------------------
        // 6. Metadata consistency
        // ------------------------------------------------

        expect(chunk.law_name).toBe(corpus.document.law_name);

        expect(chunk.law_number).toBe(corpus.document.law_number);

        expect(chunk.year).toBe(corpus.document.year);

        expect(chunk.metadata.parser_version).toBe(
          corpus.document.metadata.parser_version,
        );

        expect(chunk.metadata.normalization_version).toBe(
          corpus.document.metadata.normalization_version,
        );

        // ------------------------------------------------
        // 7. Provenance
        // ------------------------------------------------

        expect(chunk.provenance.source_file).toBe(testCase.expectedSourceFile);

        const { page_start, page_end } = chunk.provenance;

        if (page_start !== null) {
          expect(page_start).toBeGreaterThan(0);
        }

        if (page_end !== null) {
          expect(page_end).toBeGreaterThan(0);
        }

        if (page_start !== null && page_end !== null) {
          expect(page_end).toBeGreaterThanOrEqual(page_start);
        }

        // ------------------------------------------------
        // 8. Hierarchy structure
        // ------------------------------------------------

        for (const hierarchyItem of chunk.hierarchy) {
          expect(hierarchyItem.type.trim().length).toBeGreaterThan(0);

          expect(hierarchyItem.label.trim().length).toBeGreaterThan(0);

          if (hierarchyItem.title !== null) {
            expect(hierarchyItem.title.trim().length).toBeGreaterThan(0);
          }
        }

        // ------------------------------------------------
        // 9. OCR confidence
        // ------------------------------------------------

        if (chunk.metadata.ocr_confidence !== null) {
          expect(chunk.metadata.ocr_confidence).toBeGreaterThanOrEqual(0);

          expect(chunk.metadata.ocr_confidence).toBeLessThanOrEqual(1);
        }
      }

      // --------------------------------------------------
      // 10. Write → read → validate
      // --------------------------------------------------

      const serialized = await readFile(outputPath, "utf8");

      const parsed = JSON.parse(serialized);

      const readBack = validateCanonicalCorpus(parsed);

      expect(readBack).toEqual(corpus);
    });
  }
});
