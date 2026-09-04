import { describe, expect, it } from "vitest";

import { validateCanonicalCorpus } from "@egyptian-law/core";

import { canonicalizePersonalAffairsLaw } from "./personal-affairs";

describe("canonicalizePersonalAffairsLaw", () => {
  const baseArticle: import("./personal-affairs").PersonalAffairsParserArticle = {
    instrumentId: "personal_affair_law-25-1929",
    lawName: "personal_affair_law",
    lawNumber: "25",
    year: "1929",
    articleNumber: "30",
    articleNumberNormalized: 30,
    articleSuffix: null,
    chapter: "الباب الرابع في الرد",
    text: [
      "مادة 30",
      "إذا لم تستغرق الفروض التركة ولم توجد عصبة من النسب.",
    ].join("\n"),
    textForEmbedding: [
      "مادة 30",
      "اذا لم تستغرق الفروض التركة ولم توجد عصبة من النسب.",
    ].join("\n"),
    pageStart: 12,
    pageEnd: 48,
    pages: [12, 20, 48],
    sourceOrder: 12,
    source: "vision_ocr",
    sourceRecordIds: ["qwen:72:12:29", "qwen:125:20:29", "qwen:286:48:29"],
    qwenRecordCount: 3,
    recoveryRecordCount: 0,
    needsReview: false,
    reviewReasons: [],
  };

  const baseInput = {
    metadata: {
      parserVersion: "2.3.0",
      inputFile: "personal_affair_law.pdf",
      generatedAt: "2026-08-16T13:23:52.506Z",
      recordCountOriginal: 390,
      recordCountRecovery: 0,
      recordCountMerged: 390,
      instrumentId: "personal_affair_law-25-1929",
    },
    metadataResolved: {
      lawName: "personal_affair_law",
      lawNumber: "25",
      year: "1929",
    },
    articles: [baseArticle],
  };

  it("converts a real V2.3 article record into one canonical chunk", () => {
    const result = canonicalizePersonalAffairsLaw(baseInput);

    expect(result.chunks).toHaveLength(1);
    expect(result.chunks[0]!).toMatchObject({
      law_name: "personal_affair_law",
      law_number: "25",
      year: "1929",
      article_number: "30",
      article_title: null,
      text: baseArticle.text,
      text_for_embedding: baseArticle.textForEmbedding,
    });
  });

  it("uses the parser chapter as canonical hierarchy", () => {
    const result = canonicalizePersonalAffairsLaw({
      ...baseInput,
      articles: [
        {
          ...baseArticle,
          chapter: "الباب الرابع في الرد",
        },
      ],
    });

    expect(result.chunks).toHaveLength(1);

    expect(result.chunks[0]!.source_order).toBe(
      baseInput.articles[0]!.sourceOrder ?? null,
    );

    expect(result.chunks[0]!.hierarchy).toEqual([
      {
        type: "chapter",
        label: "الباب الرابع في الرد",
        title: null,
      },
    ]);
  });

  it("produces empty hierarchy when the parser chapter is null", () => {
    const result = canonicalizePersonalAffairsLaw({
      ...baseInput,
      articles: [{ ...baseArticle, chapter: null }],
    });

    expect(result.chunks).toHaveLength(1);
    expect(result.chunks[0]!.hierarchy).toEqual([]);
  });

  it("preserves repeated article markers instead of blindly splitting on every مادة marker", () => {
    const text = [
      "مادة 2",
      "المطلقة التي تستحق النفقة تعتبر نفقتها دينا.",
      "",
      "مادة 2",
      "لا يقع الطلاق المقترن بعدد لفظا أو إشارة لا يقع إلا واحدة.",
      "",
      "مادة 2",
      "على وزير العدل تنفيذ هذا القانون.",
    ].join("\n");

    const result = canonicalizePersonalAffairsLaw({
      ...baseInput,
      articles: [
        {
          ...baseArticle,
          articleNumber: "2",
          articleNumberNormalized: 2,
          text,
          textForEmbedding: text,
        },
      ],
    });

    expect(result.chunks).toHaveLength(1);

    const chunk = result.chunks[0]!;
    expect(chunk.article_number).toBe("2");

    expect(chunk.text).toContain("المطلقة التي تستحق النفقة");
    expect(chunk.text).toContain("لا يقع الطلاق المقترن");
    expect(chunk.text).toContain("على وزير العدل تنفيذ هذا القانون");
  });

  it("preserves article suffixes such as مكررا", () => {
    const result = canonicalizePersonalAffairsLaw({
      ...baseInput,
      articles: [
        {
          ...baseArticle,
          articleNumber: "5",
          articleNumberNormalized: 5,
          articleSuffix: "مكررا",
          text: [
            "مادة 5",
            "مكررا",
            "على المطلق أن يوثق شهادة طلاقه لدى الموثق المختص.",
          ].join("\n"),
          textForEmbedding: [
            "مادة 5",
            "مكررا",
            "علي المطلق ان يوثق شهادة طلاقه لدي الموثق المختص.",
          ].join("\n"),
        },
      ],
    });

    expect(result.chunks).toHaveLength(1);
    expect(result.chunks[0]!.article_number).toBe("5");
  });

  it("preserves non-normalizable article numbers as strings", () => {
    const result = canonicalizePersonalAffairsLaw({
      ...baseInput,
      articles: [
        {
          ...baseArticle,
          articleNumber: "الثالثة",
          articleNumberNormalized: null,
          articleSuffix: null,
          text: "مادة الثالثة\nنص المادة.",
          textForEmbedding: "مادة الثالثة\nنص المادة.",
        },
      ],
    });

    expect(result.chunks).toHaveLength(1);
    expect(result.chunks[0]!.article_number).toBe("الثالثة");
  });

  it("preserves multi-page provenance", () => {
    const result = canonicalizePersonalAffairsLaw({
      ...baseInput,
      articles: [{ ...baseArticle, pageStart: 12, pageEnd: 48 }],
    });

    expect(result.chunks[0]!.provenance).toEqual({
      source_file: "personal_affair_law.pdf",
      page_start: 12,
      page_end: 48,
    });
  });

  it("preserves source text separately from embedding text", () => {
    const result = canonicalizePersonalAffairsLaw({
      ...baseInput,
      articles: [
        {
          ...baseArticle,
          text: "النص الأصلي كما ورد في المصدر.",
          textForEmbedding: "النص المنظف المستخدم للتضمين.",
        },
      ],
    });

    const chunk = result.chunks[0]!;
    expect(chunk.text).toBe("النص الأصلي كما ورد في المصدر.");
    expect(chunk.text_for_embedding).toBe("النص المنظف المستخدم للتضمين.");
  });

  it("preserves the parser's article number rather than using articleNumberNormalized", () => {
    const result = canonicalizePersonalAffairsLaw({
      ...baseInput,
      articles: [
        {
          ...baseArticle,
          articleNumber: "30",
          articleNumberNormalized: 30,
        },
      ],
    });

    expect(result.chunks[0]!.article_number).toBe("30");
  });

  it("generates unique and deterministic chunk IDs", () => {
    const input = {
      ...baseInput,
      articles: [
        { ...baseArticle, articleNumber: "30" },
        {
          ...baseArticle,
          articleNumber: "31",
          articleNumberNormalized: 31,
          text: "مادة 31\nنص المادة الحادية والثلاثين.",
          textForEmbedding: "مادة 31\nنص المادة الحادية والثلاثين.",
        },
      ],
    };

    const first = canonicalizePersonalAffairsLaw(input);
    const second = canonicalizePersonalAffairsLaw(input);

    const firstIds = first.chunks.map((chunk) => chunk.id);
    const secondIds = second.chunks.map((chunk) => chunk.id);

    expect(new Set(firstIds).size).toBe(firstIds.length);
    expect(firstIds).toEqual(secondIds);
  });

  it("produces a corpus satisfying the canonical corpus contract", () => {
    const result = canonicalizePersonalAffairsLaw(baseInput);

    expect(result.chunks.length).toBeGreaterThan(0);
    expect(
      result.chunks.every((chunk) => chunk.document_id === result.document.id),
    ).toBe(true);
    expect(result.chunks.every((chunk) => chunk.text.length > 0)).toBe(true);
    expect(
      result.chunks.every((chunk) => chunk.text_for_embedding.length > 0),
    ).toBe(true);
    expect(() => validateCanonicalCorpus(result)).not.toThrow();
  });
});
