import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildArticlesFromQwen,
  mergeRecoveryRecords,
  parseInputFile,
  parseQwenFile,
  parseRecoveryFile,
  reassignIdentities,
} from "./qwen";
import {
  FINANCIAL_PROFILE,
  LABOUR_PROFILE,
  PERSONAL_PROFILE,
} from "./profiles";

function record(
  index: number,
  page: number,
  article: string,
  text = `نص ${article}`,
) {
  return {
    article_number: article,
    page_number: page,
    text,
    originalIndex: index,
    internalId: `qwen:${index}:${page}:${article}`,
    sourceType: "vision_ocr" as const,
    sortKey: index,
  };
}

describe("Qwen article reconstruction", () => {
  it("merges only contiguous fragments of the same article", () => {
    const records = [
      record(0, 10, "5", "جزء أول"),
      record(1, 11, "5", "جزء ثان"),
      record(2, 11, "6"),
      record(3, 12, "5", "مادة 5 في سياق آخر"),
    ];
    const identities = new Map(
      records.map((r) => [r.originalIndex, PERSONAL_PROFILE.defaultIdentity]),
    );
    const result = buildArticlesFromQwen(records, PERSONAL_PROFILE, identities);
    expect(result).toHaveLength(3);
    expect(result[0]!.articleNumber).toBe("5");
    // normalizeArabicText intentionally normalizes أ -> ا.
    expect(result[0]!.text).toContain("جزء اول");
    expect(result[0]!.text).toContain("جزء ثان");
    expect(result[2]!.articleNumber).toBe("5");
    expect(result[2]!.text).toBe("مادة 5 في سياق اخر");
  });

  it("keeps repeated article numbers in separate personal-law instruments", () => {
    const records = [
      record(0, 3, "13"),
      record(1, 3, "1", "نص 1 من القانون 1929 - جزء أول"),
      record(2, 4, "1", "نص 1 من القانون 1929 - جزء ثان"),
      record(3, 8, "1", "نص 1 من قانون المواريث"),
      record(4, 9, "1", "تكملة مادة 1 من قانون المواريث"),
      record(5, 15, "1", "نص 1 من قانون 35 لسنة 1944"),
      record(6, 15, "1", "نص 1 من قانون الوصية"),
    ];
    const identities = new Map<number, any>();
    identities.set(0, PERSONAL_PROFILE.identities[0]);
    identities.set(1, PERSONAL_PROFILE.identities[1]);
    identities.set(2, PERSONAL_PROFILE.identities[1]);
    identities.set(3, PERSONAL_PROFILE.identities[2]);
    identities.set(4, PERSONAL_PROFILE.identities[2]);
    identities.set(5, PERSONAL_PROFILE.identities[3]);
    identities.set(6, PERSONAL_PROFILE.identities[4]);

    const result = buildArticlesFromQwen(records, PERSONAL_PROFILE, identities);

    // Records 1+2 and 3+4 are contiguous fragments of the same article in
    // their respective instruments, so each pair must merge. The repeated
    // article number "1" across instruments must never merge across identity
    // boundaries.
    expect(result).toHaveLength(5);
    expect(result.map((x) => x.instrumentId)).toEqual([
      "personal-law-25-1920",
      "personal-decree-25-1929",
      "inheritance-law-77-1943",
      "inheritance-application-law-35-1944",
      "wills-law-71-1946",
    ]);
    expect(result.map((x) => x.articleNumber)).toEqual([
      "13",
      "1",
      "1",
      "1",
      "1",
    ]);
    expect(result[1]!.text).toContain("جزء اول");
    expect(result[1]!.text).toContain("جزء ثان");
    expect(result[2]!.text).toContain("تكملة مادة 1 من قانون المواريث");
  });

  it("detects Parser V2/V2.3 output instead of silently producing zero records", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "law-parser-v3-"));
    const file = path.join(dir, "legacy.json");
    fs.writeFileSync(
      file,
      JSON.stringify({
        articles: [
          {
            articleNumber: "1",
            pageStart: 1,
            pageEnd: 1,
            sourceRecordIds: ["qwen:0"],
            text: "نص",
          },
        ],
      }),
    );
    expect(() => parseQwenFile(file, LABOUR_PROFILE)).toThrow(
      /Parser V2\/V2\.3 output/,
    );
  });

  it("safely adapts single-instrument legacy output when article boundaries are already one-to-one", () => {
    const dir = fs.mkdtempSync(
      path.join(os.tmpdir(), "law-parser-v3-legacy-safe-"),
    );
    const file = path.join(dir, "financial-v2.3.json");
    fs.writeFileSync(
      file,
      JSON.stringify({
        articles: [
          {
            instrumentId: "financial-law-18-2019",
            lawName: "financial_law",
            lawNumber: "18",
            year: "2019",
            articleNumber: "2",
            articleNumberNormalized: 2,
            text: "نص 2",
            textForEmbedding: "نص 2",
            pageStart: 2,
            pageEnd: 2,
            pages: [2],
            sourceOrder: 2,
            source: "vision_ocr",
            sourceRecordIds: ["qwen:0:2:2"],
            qwenRecordCount: 1,
            recoveryRecordCount: 0,
            needsReview: true,
            reviewReasons: [
              "Law number is unknown in the Qwen record.",
              "Law year is unknown in the Qwen record.",
            ],
          },
          {
            instrumentId: "financial-law-18-2019",
            lawName: "financial_law",
            lawNumber: "18",
            year: "2019",
            articleNumber: "3",
            articleNumberNormalized: 3,
            text: "نص 3",
            textForEmbedding: "نص 3",
            pageStart: 2,
            pageEnd: 2,
            pages: [2],
            sourceOrder: 2,
            source: "vision_ocr",
            sourceRecordIds: ["qwen:1:2:3"],
            qwenRecordCount: 1,
            recoveryRecordCount: 0,
            needsReview: false,
            reviewReasons: [],
          },
        ],
      }),
    );
    const parsed = parseInputFile(file, FINANCIAL_PROFILE);
    expect(parsed.kind).toBe("legacy-adapted");
    expect(parsed.originalCount).toBe(2);
    expect(parsed.articles?.map((a) => a.instrumentId)).toEqual([
      "financial-law-6-2022",
      "financial-law-6-2022",
    ]);
    expect(parsed.articles?.[0]?.lawNumber).toBe("6");
    expect(parsed.articles?.[0]?.year).toBe("2022");
    expect(parsed.articles?.[0]?.needsReview).toBe(false);
  });

  it("refuses to adapt legacy output with repeated article numbers", () => {
    const dir = fs.mkdtempSync(
      path.join(os.tmpdir(), "law-parser-v3-legacy-unsafe-"),
    );
    const file = path.join(dir, "personal-v2.3.json");
    fs.writeFileSync(
      file,
      JSON.stringify({
        articles: [
          {
            articleNumber: "1",
            pageStart: 2,
            pageEnd: 2,
            sourceRecordIds: ["qwen:0"],
            text: "أ",
          },
          {
            articleNumber: "1",
            pageStart: 41,
            pageEnd: 41,
            sourceRecordIds: ["qwen:1"],
            text: "ب",
          },
        ],
      }),
    );
    expect(() => parseInputFile(file, PERSONAL_PROFILE)).toThrow(
      /not safe to adapt automatically/,
    );
  });

  it("merges missing recovery records into the source stream without duplicating existing articles", () => {
    const qwen = [record(0, 75, "186"), record(1, 77, "190")];
    const recovery = [
      {
        article_number: "187",
        page_number: 76,
        text: "نص 187",
        record_id: "recovery:76:0:187",
      },
      {
        article_number: "188",
        page_number: 76,
        text: "نص 188",
        record_id: "recovery:76:1:188",
      },
    ];
    const dir = fs.mkdtempSync(
      path.join(os.tmpdir(), "law-parser-v3-recovery-"),
    );
    const file = path.join(dir, "recovery.json");
    fs.writeFileSync(file, JSON.stringify({ records: recovery }));
    const parsed = parseRecoveryFile(file, qwen.length);
    const merged = mergeRecoveryRecords(qwen, parsed);
    const identities = reassignIdentities(merged, LABOUR_PROFILE);
    const result = buildArticlesFromQwen(merged, LABOUR_PROFILE, identities);
    expect(result.map((x) => x.articleNumber)).toEqual([
      "186",
      "187",
      "188",
      "190",
    ]);
    expect(
      result
        .filter((x) => x.recoveryRecordCount > 0)
        .map((x) => x.articleNumber),
    ).toEqual(["187", "188"]);
  });
});
