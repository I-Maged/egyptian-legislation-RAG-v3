import { describe, expect, it } from "vitest";
import {
  buildArticlesFromQwen,
  parseInputFile,
  parseRecoveryFile,
  reassignIdentities,
} from "./qwen";
import { FINANCIAL_PROFILE } from "./profiles";

const legacyPath = new URL(
  "../../../../data/input/financial_law_v2_3.json",
  import.meta.url,
).pathname;
const recoveryPath = new URL(
  "../../../../data/input/financial_law_recovered_articles.json",
  import.meta.url,
).pathname;

function normalizePath(path: string): string {
  return decodeURIComponent(path).replace(/^\/(\w):/, "$1:");
}

describe("Financial Law targeted recovery", () => {
  it("supplements the safely adapted V2.3 corpus without duplicating existing articles", () => {
    const legacy = parseInputFile(normalizePath(legacyPath), FINANCIAL_PROFILE);
    expect(legacy.kind).toBe("legacy-adapted");
    expect(legacy.articles).toHaveLength(75);

    const recovery = parseRecoveryFile(
      normalizePath(recoveryPath),
      legacy.originalCount,
    );
    expect(recovery).toHaveLength(4);

    const identities = reassignIdentities(recovery, FINANCIAL_PROFILE);
    const recovered = buildArticlesFromQwen(
      recovery,
      FINANCIAL_PROFILE,
      identities,
    );

    expect(recovered.map((a) => a.articleNumber)).toEqual(["1", "36", "47"]);
    expect(recovered[0]!.pages).toEqual([1, 2]);
    expect(recovered[0]!.recoveryRecordCount).toBe(2);
    expect(recovered.every((a) => a.source === "vision_ocr_recovery")).toBe(
      true,
    );
    expect(recovered.every((a) => a.needsReview)).toBe(true);
    expect(
      recovered.every((a) =>
        a.reviewReasons.some((r) => r.includes("recovery OCR")),
      ),
    ).toBe(true);

    const existingKeys = new Set(
      legacy.articles!.map((a) => `${a.instrumentId}|${a.articleNumber}`),
    );
    const newArticles = recovered.filter(
      (a) => !existingKeys.has(`${a.instrumentId}|${a.articleNumber}`),
    );
    expect(newArticles).toHaveLength(3);
    expect([...legacy.articles!, ...newArticles]).toHaveLength(78);
  });

  it("does not use the unreliable Financial PDF text layer as an automatic recovery source", () => {
    expect(FINANCIAL_PROFILE.pdfRecovery?.enabled).toBe(false);
  });
});
