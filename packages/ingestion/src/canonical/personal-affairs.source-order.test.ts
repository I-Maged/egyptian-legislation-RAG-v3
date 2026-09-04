import { readFile } from "fs/promises";
import { resolve } from "path";

import { describe, expect, it } from "vitest";

import type { PersonalAffairsParserArticle } from "./personal-affairs";

interface PersonalAffairsRawV23Output {
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

  articles: PersonalAffairsParserArticle[];
}

interface SourceRecord {
  index: number;
  page: number | null;
  articleNumber: string;
  chapter: string | null;
  text: string;
}

function extractRecordIndex(sourceRecordId: string): number | null {
  const match = sourceRecordId.match(/^qwen:(\d+):/);

  return match ? Number(match[1]) : null;
}

describe("Personal Affairs V2.3 source order", () => {
  it("reports the original 390 parser records in source order", async () => {
    const filePath = resolve(
      process.cwd(),
      "data/raw/personal_affair_law_v2_3.json",
    );

    const file = await readFile(filePath, "utf8");

    const output = JSON.parse(file) as PersonalAffairsRawV23Output;

    expect(output.articles.length).toBe(92);

    /*
     * Reconstruct the original Qwen records from the
     * sourceRecordIds preserved by V2.3.
     */
    const records: SourceRecord[] = [];

    for (const article of output.articles) {
      const sourceRecordIds = article.sourceRecordIds ?? [];

      for (const sourceRecordId of sourceRecordIds) {
        const index = extractRecordIndex(sourceRecordId);

        if (index === null) {
          continue;
        }

        /*
         * The sourceRecordId contains the page:
         *
         * qwen:<recordIndex>:<page>:<articleNumber>
         */
        const parts = sourceRecordId.split(":");

        const page =
          parts.length >= 3 && Number.isFinite(Number(parts[2]))
            ? Number(parts[2])
            : null;

        records.push({
          index,
          page,
          articleNumber: article.articleNumber,
          chapter: article.chapter,
          text: article.text,
        });
      }
    }

    records.sort((a, b) => a.index - b.index);

    expect(records).toHaveLength(output.metadata.recordCountOriginal);

    /*
     * The record indices should cover the complete original
     * Qwen sequence.
     */
    expect(records[0]?.index).toBe(0);
    expect(records.at(-1)?.index).toBe(output.metadata.recordCountOriginal - 1);

    for (let i = 0; i < records.length; i++) {
      expect(records[i]!.index).toBe(i);
    }

    console.log("\nPersonal Affairs V2.3 Source Order");
    console.log("──────────────────────────────────");
    console.log(`Original records: ${records.length}`);
    console.log(`Reconstructed articles: ${output.articles.length}`);

    /*
     * Print the complete source sequence.
     *
     * This is intentionally verbose. We need to understand
     * what the source actually looks like before changing
     * the reconstruction algorithm.
     */
    for (const record of records) {
      const preview = record.text.replace(/\s+/g, " ").slice(0, 100);

      console.log(
        `${String(record.index).padStart(3, " ")} | ` +
          `page=${String(record.page ?? "?").padStart(3, " ")} | ` +
          `article=${record.articleNumber.padEnd(8, " ")} | ` +
          `${preview}`,
      );
    }
  });

  it("reports contiguous source-order runs", async () => {
    const filePath = resolve(
      process.cwd(),
      "data/raw/personal_affair_law_v2_3.json",
    );

    const file = await readFile(filePath, "utf8");

    const output = JSON.parse(file) as PersonalAffairsRawV23Output;

    const records: SourceRecord[] = [];

    for (const article of output.articles) {
      for (const sourceRecordId of article.sourceRecordIds ?? []) {
        const index = extractRecordIndex(sourceRecordId);

        if (index === null) {
          continue;
        }

        const parts = sourceRecordId.split(":");

        const page =
          parts.length >= 3 && Number.isFinite(Number(parts[2]))
            ? Number(parts[2])
            : null;

        records.push({
          index,
          page,
          articleNumber: article.articleNumber,
          chapter: article.chapter,
          text: article.text,
        });
      }
    }

    records.sort((a, b) => a.index - b.index);

    expect(records).toHaveLength(output.metadata.recordCountOriginal);

    /*
     * A "run" is a contiguous sequence of source records
     * with the same article number.
     *
     * Example:
     *
     *   11: Article 2
     *   12: Article 3
     *   13: Article 4
     *
     * is three runs.
     *
     * Whereas:
     *
     *   14: Article 5
     *   15: Article 5
     *
     * is one run of length 2.
     */
    interface Run {
      startIndex: number;
      endIndex: number;
      articleNumber: string;
      pages: number[];
      length: number;
    }

    const runs: Run[] = [];

    for (const record of records) {
      const previous = runs.at(-1);

      if (
        previous &&
        previous.articleNumber === record.articleNumber &&
        previous.endIndex + 1 === record.index
      ) {
        previous.endIndex = record.index;
        previous.length++;

        if (record.page !== null && !previous.pages.includes(record.page)) {
          previous.pages.push(record.page);
        }
      } else {
        runs.push({
          startIndex: record.index,
          endIndex: record.index,
          articleNumber: record.articleNumber,
          pages: record.page === null ? [] : [record.page],
          length: 1,
        });
      }
    }

    console.log("\nContiguous Article Runs");
    console.log("───────────────────────");
    console.log(`Total records: ${records.length}`);
    console.log(`Total runs: ${runs.length}`);

    for (const run of runs) {
      console.log(
        `${String(run.startIndex).padStart(3, " ")}-${String(
          run.endIndex,
        ).padEnd(3, " ")} | ` +
          `article=${run.articleNumber.padEnd(8, " ")} | ` +
          `length=${String(run.length).padStart(2, " ")} | ` +
          `pages=[${run.pages.join(", ")}]`,
      );
    }

    /*
     * This should be substantially larger than 92 if the
     * current V2.3 implementation is collapsing separate
     * occurrences of the same article number.
     */
    expect(runs.length).toBeGreaterThan(output.articles.length);
  });

  it("reports article-number transitions in source order", async () => {
    const filePath = resolve(
      process.cwd(),
      "data/raw/personal_affair_law_v2_3.json",
    );

    const file = await readFile(filePath, "utf8");

    const output = JSON.parse(file) as PersonalAffairsRawV23Output;

    const records: SourceRecord[] = [];

    for (const article of output.articles) {
      for (const sourceRecordId of article.sourceRecordIds ?? []) {
        const index = extractRecordIndex(sourceRecordId);

        if (index === null) {
          continue;
        }

        const parts = sourceRecordId.split(":");

        const page =
          parts.length >= 3 && Number.isFinite(Number(parts[2]))
            ? Number(parts[2])
            : null;

        records.push({
          index,
          page,
          articleNumber: article.articleNumber,
          chapter: article.chapter,
          text: article.text,
        });
      }
    }

    records.sort((a, b) => a.index - b.index);

    console.log("\nArticle Number Transitions");
    console.log("──────────────────────────");

    for (let i = 1; i < records.length; i++) {
      const previous = records[i - 1]!;
      const current = records[i]!;

      if (previous.articleNumber !== current.articleNumber) {
        console.log(
          `${previous.index} → ${current.index} | ` +
            `${previous.articleNumber} → ${current.articleNumber} | ` +
            `pages ${previous.page ?? "?"} → ${current.page ?? "?"}`,
        );
      }
    }

    expect(records.length).toBe(output.metadata.recordCountOriginal);
  });
});
