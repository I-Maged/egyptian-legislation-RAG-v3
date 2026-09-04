import { describe, expect, it } from "vitest";
import {
  buildArticlesFromQwen,
  mergeRecoveryRecords,
  parseInputFile,
  parseRecoveryFile,
  reassignIdentities,
} from "./qwen";
import { PERSONAL_PROFILE } from "./profiles";
import { validateArticles } from "./validate";

const qwenPath = new URL(
  "../../../../data/input/personal_affair_law_qwen_output.json",
  import.meta.url,
).pathname;
const recoveryPath = new URL(
  "../../../../data/input/personal_affair_law_recovered_articles.json",
  import.meta.url,
).pathname;

function normalizePath(path: string): string {
  return decodeURIComponent(path).replace(/^\/(\w):/, "$1:");
}

describe("Personal Affairs targeted recovery", () => {
  it("recovers every article reported missing by the V3 baseline", () => {
    const parsed = parseInputFile(normalizePath(qwenPath), PERSONAL_PROFILE);
    expect(parsed.kind).toBe("qwen-record-array");
    expect(parsed.originalCount).toBe(390);

    const baseIdentities = reassignIdentities(parsed.records, PERSONAL_PROFILE);
    const baseArticles = buildArticlesFromQwen(
      parsed.records,
      PERSONAL_PROFILE,
      baseIdentities,
    );
    expect(baseArticles).toHaveLength(384);

    const recovery = parseRecoveryFile(
      normalizePath(recoveryPath),
      parsed.records.length,
    );
    expect(recovery).toHaveLength(50);

    const mergedRecords = mergeRecoveryRecords(parsed.records, recovery);
    const identities = reassignIdentities(mergedRecords, PERSONAL_PROFILE);
    const articles = buildArticlesFromQwen(
      mergedRecords,
      PERSONAL_PROFILE,
      identities,
    );

    expect(articles).toHaveLength(426);
    expect(
      articles.filter((a) => a.source === "vision_ocr_recovery"),
    ).toHaveLength(45);
    expect(
      articles.filter(
        (a) =>
          a.source === "vision_ocr_recovery" &&
          [
            "personal-law-25-1920|1",
            "personal-law-25-1920|7",
            "personal-law-25-1920|12",
            "guardianship-person-decree-118-1952|8",
            "guardianship-person-decree-118-1952|9",
            "guardianship-person-decree-118-1952|10",
            "guardianship-person-decree-118-1952|11",
            "guardianship-person-decree-118-1952|12",
            "guardianship-person-decree-118-1952|13",
            "guardianship-property-decree-119-1952|8",
            "guardianship-property-decree-119-1952|9",
            "guardianship-property-decree-119-1952|10",
            "guardianship-property-decree-119-1952|11",
            "guardianship-property-decree-119-1952|12",
            "guardianship-property-decree-119-1952|13",
            "guardianship-property-decree-119-1952|15",
            "guardianship-property-decree-119-1952|16",
            "guardianship-property-decree-119-1952|18",
            "guardianship-property-decree-119-1952|19",
            "guardianship-property-decree-119-1952|20",
            "guardianship-property-decree-119-1952|21",
            "guardianship-property-decree-119-1952|29",
            "guardianship-property-decree-119-1952|30",
            "guardianship-property-decree-119-1952|31",
            "guardianship-property-decree-119-1952|32",
            "guardianship-property-decree-119-1952|33",
            "guardianship-property-decree-119-1952|34",
            "guardianship-property-decree-119-1952|35",
            "guardianship-property-decree-119-1952|36",
            "guardianship-property-decree-119-1952|37",
            "guardianship-property-decree-119-1952|38",
            "guardianship-property-decree-119-1952|39",
            "litigation-law-1-2000|47",
            "ministerial-decision-1088-2000|9",
            "ministerial-decision-1089-2000|2",
            "ministerial-decision-1089-2000|3",
            "ministerial-decision-1089-2000|4",
            "ministerial-decision-1089-2000|5",
            "ministerial-decision-1089-2000|6",
            "ministerial-decision-1089-2000|7",
            "ministerial-decision-1089-2000|8",
            "ministerial-decision-1089-2000|9",
          ].includes(`${a.instrumentId}|${a.articleNumber}`),
      ),
    ).toHaveLength(42);
    expect(
      articles.every(
        (a) =>
          !a.sourceRecordIds.some(
            (id) =>
              id.includes("recovery") && a.source !== "vision_ocr_recovery",
          ),
      ),
    ).toBe(true);

    const recovered = new Map(
      articles
        .filter((a) => a.source === "vision_ocr_recovery")
        .map((a) => [`${a.instrumentId}|${a.articleNumber}`, a]),
    );

    expect(recovered.get("personal-law-25-1920|1")?.pages).toEqual([1, 2]);
    expect(recovered.get("personal-law-25-1920|7")?.text).toContain("ملغاة");
    expect(recovered.get("personal-law-25-1920|12")?.text).toContain("ملغاة");

    expect(
      recovered.get("guardianship-person-decree-118-1952|7")?.pages,
    ).toEqual([28, 29]);
    expect(
      recovered.get("guardianship-person-decree-118-1952|7")?.text,
    ).toContain("اذا وقعت الجريمة");

    for (const n of [8, 9, 10, 11, 12, 13]) {
      expect(recovered.has(`guardianship-person-decree-118-1952|${n}`)).toBe(
        true,
      );
      expect(recovered.has(`guardianship-property-decree-119-1952|${n}`)).toBe(
        true,
      );
    }

    for (const n of [
      15, 16, 18, 19, 20, 21, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
    ]) {
      expect(recovered.has(`guardianship-property-decree-119-1952|${n}`)).toBe(
        true,
      );
    }
    expect(
      recovered.get("guardianship-property-decree-119-1952|28")?.pages,
    ).toEqual([32, 33]);
    expect(
      recovered.get("guardianship-property-decree-119-1952|28")?.text,
    ).not.toContain("أولا . جميع التصرفات");
    expect(
      recovered.get("guardianship-property-decree-119-1952|39")?.pageStart,
    ).toBe(34);

    expect(recovered.get("litigation-law-1-2000|47")?.pageStart).toBe(51);
    expect(recovered.get("ministerial-decision-1088-2000|9")?.pageStart).toBe(
      61,
    );
    expect(recovered.get("ministerial-decision-1089-2000|1")?.pages).toEqual([
      62, 63,
    ]);
    expect(
      recovered.get("ministerial-decision-1089-2000|1")?.text,
    ).not.toContain("5- بحث الحالة");
    for (const n of [2, 3, 4, 5, 6, 7, 8, 9]) {
      expect(recovered.has(`ministerial-decision-1089-2000|${n}`)).toBe(true);
    }

    expect(recovered.get("ministerial-decision-1089-2000|9")?.pages).toEqual([
      63, 64,
    ]);
    expect(recovered.get("ministerial-decision-1089-2000|9")?.text).toContain(
      "5- بحث الحالة",
    );

    expect([...recovered.values()].every((a) => a.needsReview)).toBe(true);
    expect(
      [...recovered.values()].every((a) =>
        a.reviewReasons.some((r) => r.includes("recovery OCR")),
      ),
    ).toBe(true);

    const missing = validateArticles(
      articles,
      PERSONAL_PROFILE.identities,
      [],
    ).filter((issue) => issue.code === "MISSING_ARTICLES");
    expect(missing).toHaveLength(0);
  });

  it("does not duplicate a recovery record when the same page/article already exists", () => {
    const parsed = parseInputFile(normalizePath(qwenPath), PERSONAL_PROFILE);
    const recovery = parseRecoveryFile(
      normalizePath(recoveryPath),
      parsed.records.length,
    );
    const merged = mergeRecoveryRecords(parsed.records, recovery);
    const mergedAgain = mergeRecoveryRecords(merged, [recovery[0]!]);

    expect(merged.length).toBe(parsed.records.length + recovery.length - 3);
    expect(mergedAgain.length).toBe(merged.length);
  });
});
