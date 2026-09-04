import { readFile } from "fs/promises";
import { resolve } from "path";

import { describe, expect, it } from "vitest";

import {
  canonicalizeFinancialLaw,
  type FinancialLawParserArticle,
} from "./financial-law";

interface FinancialLawV23Output {
  metadata: {
    parserVersion: string;
    inputFile: string;
    generatedAt: string;
    recordCountOriginal: number;
    recordCountRecovery: number;
    recordCountMerged: number;
    instrumentId: string;
  };

  metadataResolved: {
    lawName: string;
    lawNumber: string;
    year: string;
  };

  articles: FinancialLawParserArticle[];
}

describe("canonicalizeFinancialLaw - real V2.3 output", () => {
  it("canonicalizes the complete Financial Law V2.3 JSON corpus", async () => {
    const filePath = resolve(process.cwd(), "data/raw/financial_law_v2_3.json");

    const file = await readFile(filePath, "utf8");

    const parserOutput = JSON.parse(file) as FinancialLawV23Output;

    /*
     * Parser-level integrity.
     */
    expect(parserOutput.metadata.parserVersion).toBe("2.3.0");
    expect(parserOutput.metadata.recordCountOriginal).toBe(75);
    expect(parserOutput.metadata.recordCountRecovery).toBe(0);
    expect(parserOutput.metadata.recordCountMerged).toBe(75);

    expect(parserOutput.metadataResolved.lawName).toBe("financial_law");
    expect(parserOutput.metadataResolved.lawNumber).toBe("18");
    expect(parserOutput.metadataResolved.year).toBe("2019");

    expect(parserOutput.articles).toHaveLength(75);

    /*
     * Canonicalization.
     */
    const result = canonicalizeFinancialLaw(parserOutput.articles);

    expect(result.schema_version).toBe("1.0");

    expect(result.document.law_name).toBe("financial_law");
    expect(result.document.law_number).toBe("18");
    expect(result.document.year).toBe("2019");
    expect(result.document.jurisdiction).toBe("EG");
    expect(result.document.language).toBe("ar");

    /*
     * One canonical chunk per parser article.
     */
    expect(result.chunks).toHaveLength(parserOutput.articles.length);

    /*
     * IDs must be unique.
     */
    const ids = result.chunks.map((chunk) => chunk.id);

    expect(new Set(ids).size).toBe(ids.length);

    /*
     * Every chunk belongs to the canonical document.
     */
    for (const chunk of result.chunks) {
      expect(chunk.document_id).toBe(result.document.id);
    }

    /*
     * Parser -> canonical content preservation.
     */
    expect(result.chunks).toMatchObject(
      parserOutput.articles.map((source) => ({
        law_name: source.lawName,
        law_number: source.lawNumber,
        year: source.year,
        article_number: source.articleNumber,

        source_order: source.sourceOrder ?? null,

        text: source.text,
        text_for_embedding: source.textForEmbedding,

        provenance: {
          page_start:
            source.pageStart && source.pageStart > 0 ? source.pageStart : null,

          page_end:
            source.pageEnd && source.pageEnd > 0 ? source.pageEnd : null,
        },
      })),
    );

    /*
     * Every chunk must contain meaningful content.
     */
    for (const chunk of result.chunks) {
      expect(chunk.text.trim().length).toBeGreaterThan(0);
      expect(chunk.text_for_embedding.trim().length).toBeGreaterThan(0);
      expect(chunk.article_number.trim().length).toBeGreaterThan(0);

      expect(chunk.provenance.source_file.trim().length).toBeGreaterThan(0);

      if (chunk.provenance.page_start !== null) {
        expect(chunk.provenance.page_start).toBeGreaterThan(0);
      }

      if (chunk.provenance.page_end !== null) {
        expect(chunk.provenance.page_end).toBeGreaterThan(0);
      }

      if (
        chunk.provenance.page_start !== null &&
        chunk.provenance.page_end !== null
      ) {
        expect(chunk.provenance.page_end).toBeGreaterThanOrEqual(
          chunk.provenance.page_start,
        );
      }

      expect(chunk.source_order).not.toBeNull();
    }
  });
});
