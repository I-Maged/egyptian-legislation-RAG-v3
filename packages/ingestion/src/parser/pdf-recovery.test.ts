import { describe, expect, it } from "vitest";
import { findArticleAnchors, recoverMissingArticlesFromPdf } from "./pdf";
import {
  FINANCIAL_PROFILE,
  LABOUR_PROFILE,
  PERSONAL_PROFILE,
} from "./profiles";
import type { ParsedArticle } from "./types";

function existingArticle(
  instrumentId: string,
  articleNumber: string,
  pageStart: number,
): ParsedArticle {
  return {
    instrumentId,
    lawName: "law",
    lawNumber: "1",
    year: "2000",
    articleNumber,
    articleNumberNormalized: Number(articleNumber),
    articleSuffix: null,
    chapter: null,
    text: `Qwen ${articleNumber}`,
    textForEmbedding: `Qwen ${articleNumber}`,
    pageStart,
    pageEnd: pageStart,
    pages: [pageStart],
    sourceOrder: pageStart,
    source: "vision_ocr",
    sourceRecordIds: [`qwen:${articleNumber}`],
    qwenRecordCount: 1,
    recoveryRecordCount: 0,
    needsReview: false,
    reviewReasons: [],
  };
}

describe("profile-aware PDF missing-article recovery", () => {
  it("recovers only Labour articles that are missing from Qwen and have unique PDF anchors", () => {
    const pages = [
      { pageNumber: 50, text: "", lines: ["مادة 120", "نص 120"] },
      {
        pageNumber: 51,
        text: "",
        lines: [
          "مادة 121",
          "نص 121",
          "تكملة 121",
          "مادة 122",
          "نص 122",
          "مادة 123",
          "نص 123",
        ],
      },
    ];
    const anchors = findArticleAnchors(pages);
    const existing = [
      existingArticle(LABOUR_PROFILE.id, "120", 50),
      existingArticle(LABOUR_PROFILE.id, "123", 51),
    ];

    const result = recoverMissingArticlesFromPdf(
      pages,
      LABOUR_PROFILE,
      anchors,
      existing,
    );

    expect(result.articles.map((a) => a.articleNumber)).toEqual(["121", "122"]);
    expect(
      result.articles.every((a) => a.instrumentId === LABOUR_PROFILE.id),
    ).toBe(true);
    expect(result.articles.every((a) => a.source === "pdf_text_recovery")).toBe(
      true,
    );
    expect(result.articles.every((a) => a.needsReview)).toBe(true);
    expect(result.articles[0]!.text).toContain("نص 121");
    expect(result.articles[0]!.text).toContain("تكملة 121");
    expect(result.articles[0]!.text).not.toContain("نص 122");
    expect(result.articles[1]!.text).toContain("نص 122");
    expect(result.articles[1]!.text).not.toContain("نص 123");
  });

  it("does not recover an article when the PDF anchor is ambiguous", () => {
    const pages = [
      {
        pageNumber: 20,
        text: "",
        lines: [
          "مادة 121",
          "نص أول 121",
          "مادة 121",
          "نص ثان 121",
          "مادة 122",
          "نص 122",
        ],
      },
    ];
    const anchors = findArticleAnchors(pages);
    const result = recoverMissingArticlesFromPdf(
      pages,
      LABOUR_PROFILE,
      anchors,
      [],
    );

    expect(result.articles.some((a) => a.articleNumber === "121")).toBe(false);
    expect(result.skipped).toContainEqual(
      expect.objectContaining({ articleNumber: "121" }),
    );
  });

  it("keeps PDF recovery disabled for Financial Law because its PDF text layer is not trusted", () => {
    const pages = [
      { pageNumber: 2, text: "", lines: ["مادة 1", "نص 1", "مادة 2", "نص 2"] },
    ];
    const anchors = findArticleAnchors(pages);
    const result = recoverMissingArticlesFromPdf(
      pages,
      FINANCIAL_PROFILE,
      anchors,
      [],
    );

    expect(result.articles).toEqual([]);
    expect(result.skipped).toEqual([]);
  });

  it("keeps PDF recovery disabled for the multi-instrument Personal Affairs compilation", () => {
    const pages = [{ pageNumber: 40, text: "", lines: ["مادة 47", "نص 47"] }];
    const anchors = findArticleAnchors(pages);
    const result = recoverMissingArticlesFromPdf(
      pages,
      PERSONAL_PROFILE,
      anchors,
      [],
    );

    expect(result.articles).toEqual([]);
    expect(result.skipped).toEqual([]);
  });

  it("caps recovery at the identity end page when there is no later anchor in the same instrument", () => {
    const profile = {
      ...LABOUR_PROFILE,
      identities: [
        { ...LABOUR_PROFILE.identities[0]!, startPage: 1, endPage: 50 },
      ],
      defaultIdentity: {
        ...LABOUR_PROFILE.defaultIdentity,
        startPage: 1,
        endPage: 50,
      },
    };
    const pages = [
      { pageNumber: 50, text: "", lines: ["مادة 121", "نص 121", "تكملة 121"] },
      { pageNumber: 51, text: "", lines: ["مادة 1", "نص من الأداة التالية"] },
    ];
    const anchors = findArticleAnchors(pages);
    const result = recoverMissingArticlesFromPdf(pages, profile, anchors, []);

    const recovered = result.articles.find((a) => a.articleNumber === "121");
    expect(recovered).toBeDefined();
    expect(recovered!.text).toContain("نص 121");
    expect(recovered!.text).not.toContain("نص من الأداة التالية");
    expect(recovered!.pageEnd).toBe(50);
  });
});
