import { readFile } from "fs/promises";
import { resolve } from "path";

import { describe, expect, it } from "vitest";

import type {
  PersonalAffairsParserArticle,
  PersonalAffairsParserOutput,
} from "./personal-affairs";

describe("Personal Affairs V2.3 reconstruction", () => {
  it("detects suspicious article merges", async () => {
    const filePath = resolve(
      process.cwd(),
      "data/raw/personal_affair_law_v2_3.json",
    );

    const file = await readFile(filePath, "utf8");

    const output = JSON.parse(file) as PersonalAffairsParserOutput;

    expect(output.articles.length).toBeGreaterThan(0);

    /*
     * An article may legitimately span multiple pages.
     *
     * What is suspicious is when the same reconstructed article
     * contains multiple parser records spread across non-contiguous
     * pages.
     */
    const suspicious = output.articles.filter((article) => {
      const pages = [...new Set(article.pages ?? [])].sort((a, b) => a - b);

      if (pages.length <= 1) {
        return false;
      }

      for (let i = 1; i < pages.length; i++) {
        if (pages[i]! > pages[i - 1]! + 1) {
          return true;
        }
      }

      return false;
    });

    console.log("\nPersonal Affairs V2.3 Reconstruction Diagnostic");
    console.log("──────────────────────────────────────────────");
    console.log(`Parser articles: ${output.articles.length}`);
    console.log(`Suspicious merges: ${suspicious.length}`);

    for (const article of suspicious) {
      const pages = [...new Set(article.pages ?? [])].sort((a, b) => a - b);

      console.log({
        articleNumber: article.articleNumber,
        chapter: article.chapter,
        pages,
        sourceRecordCount: article.sourceRecordIds?.length ?? 0,
        sourceRecordIds: article.sourceRecordIds ?? [],
        qwenRecordCount: article.qwenRecordCount ?? 0,
        recoveryRecordCount: article.recoveryRecordCount ?? 0,
      });
    }

    /*
     * Diagnostic only:
     *
     * We are intentionally NOT asserting that suspicious.length
     * must be zero yet. The purpose of this test is to establish
     * the actual V2.3 failure pattern before implementing V2.4.
     */
    expect(suspicious.length).toBeGreaterThan(0);
  });

  it("reports articles whose same article number appears across widely separated pages", async () => {
    const filePath = resolve(
      process.cwd(),
      "data/raw/personal_affair_law_v2_3.json",
    );

    const file = await readFile(filePath, "utf8");

    const output = JSON.parse(file) as PersonalAffairsParserOutput;

    const byArticleNumber = new Map<string, PersonalAffairsParserArticle[]>();

    for (const article of output.articles) {
      const existing = byArticleNumber.get(article.articleNumber);

      if (existing) {
        existing.push(article);
      } else {
        byArticleNumber.set(article.articleNumber, [article]);
      }
    }

    const repeatedArticleNumbers = [...byArticleNumber.entries()]
      .filter(([, articles]) => articles.length > 1)
      .map(([articleNumber, articles]) => ({
        articleNumber,
        occurrences: articles.length,
        occurrencesDetail: articles.map((article) => ({
          pages: [...new Set(article.pages ?? [])].sort((a, b) => a - b),
          chapter: article.chapter,
          sourceRecordCount: article.sourceRecordIds?.length ?? 0,
        })),
      }));

    console.log("\nRepeated article numbers");
    console.log("───────────────────────");

    for (const item of repeatedArticleNumbers) {
      console.log(item);
    }

    /*
     * This is informational rather than a correctness assertion.
     *
     * Article numbers can legitimately repeat across separate
     * legal instruments/sections, so repetition alone is not a bug.
     */
    expect(repeatedArticleNumbers).toBeDefined();
  });

  it("reports articles containing multiple source records", async () => {
    const filePath = resolve(
      process.cwd(),
      "data/raw/personal_affair_law_v2_3.json",
    );

    const file = await readFile(filePath, "utf8");

    const output = JSON.parse(file) as PersonalAffairsParserOutput;

    const multiRecordArticles = output.articles.filter(
      (article) => (article.sourceRecordIds?.length ?? 0) > 1,
    );

    console.log("\nArticles containing multiple source records");
    console.log("────────────────────────────────────────────");

    console.log(`Count: ${multiRecordArticles.length}`);

    for (const article of multiRecordArticles) {
      console.log({
        articleNumber: article.articleNumber,
        pages: [...new Set(article.pages ?? [])].sort((a, b) => a - b),
        sourceRecordCount: article.sourceRecordIds?.length ?? 0,
        qwenRecordCount: article.qwenRecordCount ?? 0,
        chapter: article.chapter,
      });
    }

    expect(multiRecordArticles).toBeDefined();
  });

  it("identifies non-contiguous source records merged into one article", async () => {
    const filePath = resolve(
      process.cwd(),
      "data/raw/personal_affair_law_v2_3.json",
    );

    const file = await readFile(filePath, "utf8");

    const output = JSON.parse(file) as PersonalAffairsParserOutput;

    const suspicious = output.articles
      .map((article) => {
        const indices = (article.sourceRecordIds ?? [])
          .map((id) => {
            const match = id.match(/^qwen:(\d+):/);
            return match ? Number(match[1]) : null;
          })
          .filter((value): value is number => value !== null)
          .sort((a, b) => a - b);

        if (indices.length < 2) {
          return null;
        }

        const hasGap = indices.some(
          (value, index) => index > 0 && value !== indices[index - 1]! + 1,
        );

        if (!hasGap) {
          return null;
        }

        return {
          articleNumber: article.articleNumber,
          sourceRecordIds: article.sourceRecordIds,
          recordIndices: indices,
          pages: [...new Set(article.pages ?? [])].sort((a, b) => a - b),
          chapter: article.chapter,
        };
      })
      .filter(
        (
          value,
        ): value is {
          articleNumber: string;
          sourceRecordIds: string[];
          recordIndices: number[];
          pages: number[];
          chapter: string | null;
        } => value !== null,
      );

    console.log("\nNon-contiguous source-record merges");
    console.log("────────────────────────────────────");

    console.log(`Count: ${suspicious.length}`);

    for (const item of suspicious) {
      console.log(item);
    }

    expect(suspicious.length).toBeGreaterThan(0);
  });
});
