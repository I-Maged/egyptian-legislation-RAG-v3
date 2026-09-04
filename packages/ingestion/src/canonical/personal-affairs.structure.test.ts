import { readFile } from "fs/promises";
import { resolve } from "path";

import { describe, expect, it } from "vitest";

import type { PersonalAffairsParserOutput } from "./personal-affairs";

describe("Personal Affairs V2.3 structure", () => {
  it("reports how the 390 parser records map to article objects", async () => {
    const inputPath = resolve(
      process.cwd(),
      "data/raw/personal_affair_law_v2_3.json",
    );

    const json = await readFile(inputPath, "utf8");

    const parserOutput = JSON.parse(json) as PersonalAffairsParserOutput & {
      metadata: {
        recordCountOriginal: number;
        recordCountRecovery: number;
        recordCountMerged: number;
      };
    };

    console.log({
      recordCountOriginal: parserOutput.metadata.recordCountOriginal,

      recordCountRecovery: parserOutput.metadata.recordCountRecovery,

      recordCountMerged: parserOutput.metadata.recordCountMerged,

      articlesLength: parserOutput.articles.length,
    });

    const totalSourceRecordReferences = parserOutput.articles.reduce(
      (sum, article) => sum + (article.sourceRecordIds?.length ?? 0),
      0,
    );

    const totalQwenRecordCount = parserOutput.articles.reduce(
      (sum, article) => sum + (article.qwenRecordCount ?? 0),
      0,
    );

    const totalRecoveryRecordCount = parserOutput.articles.reduce(
      (sum, article) => sum + (article.recoveryRecordCount ?? 0),
      0,
    );

    console.log({
      totalSourceRecordReferences,
      totalQwenRecordCount,
      totalRecoveryRecordCount,
    });

    const articleNumbers = parserOutput.articles.map(
      (article) => article.articleNumber,
    );

    console.log("First 30 article numbers:", articleNumbers.slice(0, 30));

    console.log("Last 30 article numbers:", articleNumbers.slice(-30));

    expect(parserOutput.metadata.recordCountMerged).toBe(390);

    expect(parserOutput.articles.length).toBe(92);
  });
});
