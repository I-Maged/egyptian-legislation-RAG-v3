import { readFile } from "fs/promises";
import { resolve } from "path";

import { describe, expect, it } from "vitest";

import type { PersonalAffairsParserArticle } from "./personal-affairs";

import { reconstructPersonalAffairsArticles } from "./personal-affairs-reconstruction";

describe("Personal Affairs article reconstruction", () => {
  it("preserves every parser record and separates non-contiguous article numbers", async () => {
    const filePath = resolve(
      process.cwd(),
      "data/raw/personal_affair_law_v2_3.json",
    );

    const file = await readFile(filePath, "utf8");

    const input = JSON.parse(file) as {
      metadata: {
        recordCountOriginal: number;
        recordCountRecovery: number;
        recordCountMerged: number;
      };
      articles: PersonalAffairsParserArticle[];
    };

    // expect(input.articles).toHaveLength(390);
    expect(input.metadata.recordCountOriginal).toBe(390);
    expect(input.metadata.recordCountRecovery).toBe(0);
    expect(input.metadata.recordCountMerged).toBe(390);

    expect(input.articles).toHaveLength(92);

    const reconstructed = reconstructPersonalAffairsArticles(input.articles);

    /*
     * Every parser record must belong to exactly one reconstructed article.
     */
    const totalSourceRecords = reconstructed.reduce(
      (sum: number, article: PersonalAffairsParserArticle) =>
        sum + (article.sourceRecordIds?.length ?? 0),
      0,
    );

    expect(totalSourceRecords).toBe(390);

    /*
     * Every source record ID must occur exactly once.
     */
    const sourceRecordIds = reconstructed.flatMap(
      (article: PersonalAffairsParserArticle) => article.sourceRecordIds ?? [],
    );

    expect(new Set(sourceRecordIds).size).toBe(390);
    expect(sourceRecordIds).toHaveLength(390);

    expect(
      input.articles.every(
        (article) =>
          article.sourceRecordIds && article.sourceRecordIds.length > 0,
      ),
    ).toBe(true);

    expect(
      input.articles.every((article) => article.qwenRecordCount !== undefined),
    ).toBe(true);

    const qwenRecordCount = input.articles.reduce(
      (sum, article) => sum + (article.qwenRecordCount ?? 0),
      0,
    );

    expect(qwenRecordCount).toBe(390);

    /*
     * The reconstruction must not silently lose records.
     */
    const originalSourceRecordIds = input.articles.flatMap(
      (article) => article.sourceRecordIds,
    );

    expect(new Set(originalSourceRecordIds).size).toBe(390);

    expect(new Set(sourceRecordIds)).toEqual(new Set(originalSourceRecordIds));
  });

  it("merges only consecutive records belonging to the same article", () => {
    const input = [
      makeArticle({
        articleNumber: "5",
        sourceOrder: 0,
        sourceRecordIds: ["qwen:0:3:5"],
        text: "نص المادة 5 - الجزء الأول",
      }),

      makeArticle({
        articleNumber: "5",
        sourceOrder: 1,
        sourceRecordIds: ["qwen:1:3:5"],
        text: "نص المادة 5 - الجزء الثاني",
      }),

      makeArticle({
        articleNumber: "6",
        sourceOrder: 2,
        sourceRecordIds: ["qwen:2:3:6"],
        text: "نص المادة 6",
      }),
    ];

    const result = reconstructPersonalAffairsArticles(input);

    expect(result).toHaveLength(2);

    expect(result[0]!.articleNumber).toBe("5");
    expect(result[0]!.sourceRecordIds).toEqual(["qwen:0:3:5", "qwen:1:3:5"]);

    expect(result[1]!.articleNumber).toBe("6");
    expect(result[1]!.sourceRecordIds).toEqual(["qwen:2:3:6"]);
  });

  it("does not merge the same article number when it appears non-contiguously", () => {
    const input = [
      makeArticle({
        articleNumber: "1",
        sourceOrder: 0,
        sourceRecordIds: ["qwen:0:2:1"],
      }),

      makeArticle({
        articleNumber: "2",
        sourceOrder: 1,
        sourceRecordIds: ["qwen:1:2:2"],
      }),

      makeArticle({
        articleNumber: "1",
        sourceOrder: 2,
        sourceRecordIds: ["qwen:2:2:1"],
      }),
    ];

    const result = reconstructPersonalAffairsArticles(input);

    expect(result).toHaveLength(3);

    expect(
      result.map(
        (article: PersonalAffairsParserArticle) => article.articleNumber,
      ),
    ).toEqual(["1", "2", "1"]);

    expect(result[0]!.sourceRecordIds).toEqual(["qwen:0:2:1"]);
    expect(result[2]!.sourceRecordIds).toEqual(["qwen:2:2:1"]);
  });

  it("preserves source order from the first record of each reconstructed article", () => {
    const input = [
      makeArticle({
        articleNumber: "11",
        sourceOrder: 21,
        sourceRecordIds: ["qwen:21:4:11"],
      }),

      makeArticle({
        articleNumber: "11",
        sourceOrder: 22,
        sourceRecordIds: ["qwen:22:5:11"],
      }),
    ];

    const result = reconstructPersonalAffairsArticles(input);

    expect(result).toHaveLength(1);
    expect(result[0]!.sourceOrder).toBe(21);
  });

  it("preserves all source records when one article spans multiple pages", () => {
    const input = [
      makeArticle({
        articleNumber: "45",
        sourceOrder: 87,
        sourceRecordIds: ["qwen:87:14:45"],
        pageStart: 14,
        pageEnd: 14,
        pages: [14],
      }),

      makeArticle({
        articleNumber: "45",
        sourceOrder: 88,
        sourceRecordIds: ["qwen:88:14:45"],
        pageStart: 14,
        pageEnd: 14,
        pages: [14],
      }),

      makeArticle({
        articleNumber: "45",
        sourceOrder: 141,
        sourceRecordIds: ["qwen:141:22:45"],
        pageStart: 22,
        pageEnd: 22,
        pages: [22],
      }),
    ];

    const result = reconstructPersonalAffairsArticles(input);

    expect(result).toHaveLength(1);

    expect(result[0]!.articleNumber).toBe("45");

    expect(result[0]!.sourceRecordIds).toEqual([
      "qwen:87:14:45",
      "qwen:88:14:45",
      "qwen:141:22:45",
    ]);

    expect(result[0]!.pages).toEqual([14, 22]);
  });

  it("preserves non-normalizable article numbers", () => {
    const input = [
      makeArticle({
        articleNumber: "الثالثة",
        articleNumberNormalized: null,
        sourceOrder: 254,
        sourceRecordIds: ["qwen:254:40:الثالثة"],
      }),

      makeArticle({
        articleNumber: "الرابعة",
        articleNumberNormalized: null,
        sourceOrder: 255,
        sourceRecordIds: ["qwen:255:41:الرابعة"],
      }),

      makeArticle({
        articleNumber: "الخامسة",
        articleNumberNormalized: null,
        sourceOrder: 256,
        sourceRecordIds: ["qwen:256:41:الخامسة"],
      }),

      makeArticle({
        articleNumber: "السادسة",
        articleNumberNormalized: null,
        sourceOrder: 257,
        sourceRecordIds: ["qwen:257:41:السادسة"],
      }),
    ];

    const result = reconstructPersonalAffairsArticles(input);

    expect(result).toHaveLength(4);

    expect(
      result.map(
        (article: PersonalAffairsParserArticle) => article.articleNumber,
      ),
    ).toEqual(["الثالثة", "الرابعة", "الخامسة", "السادسة"]);
  });

  it("does not use article number alone as the reconstruction key", () => {
    const input = [
      makeArticle({
        articleNumber: "2",
        chapter: "الباب الأول",
        sourceOrder: 0,
        sourceRecordIds: ["qwen:0:2:2"],
      }),

      makeArticle({
        articleNumber: "3",
        chapter: "الباب الأول",
        sourceOrder: 1,
        sourceRecordIds: ["qwen:1:2:3"],
      }),

      makeArticle({
        articleNumber: "2",
        chapter: "الباب الثاني",
        sourceOrder: 2,
        sourceRecordIds: ["qwen:2:8:2"],
      }),
    ];

    const result = reconstructPersonalAffairsArticles(input);

    expect(result).toHaveLength(3);

    expect(
      result.map(
        (article: PersonalAffairsParserArticle) => article.articleNumber,
      ),
    ).toEqual(["2", "3", "2"]);

    expect(
      result.map((article: PersonalAffairsParserArticle) => article.chapter),
    ).toEqual(["الباب الأول", "الباب الأول", "الباب الثاني"]);
  });
});

function makeArticle(
  overrides: Partial<PersonalAffairsParserArticle>,
): PersonalAffairsParserArticle {
  return {
    instrumentId: "personal_affair_law-25-1929",

    lawName: "personal_affair_law",
    lawNumber: "25",
    year: "1929",

    articleNumber: "1",
    articleNumberNormalized: 1,
    articleSuffix: null,

    chapter: "الباب الأول",

    text: "نص اختباري",
    textForEmbedding: "نص اختباري",

    pageStart: 1,
    pageEnd: 1,

    pages: [1],
    sourceOrder: 0,

    source: "vision_ocr",

    sourceRecordIds: ["qwen:0:1:1"],

    qwenRecordCount: 1,
    recoveryRecordCount: 0,

    needsReview: false,
    reviewReasons: [],

    ...overrides,
  };
}
