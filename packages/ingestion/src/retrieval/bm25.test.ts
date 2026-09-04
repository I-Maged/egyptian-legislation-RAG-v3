import { describe, expect, it } from "vitest";

import { createBm25Index, scoreBm25, searchBm25, tokenizeArabic } from "./bm25";

describe("tokenizeArabic", () => {
  it("tokenizes Arabic text", () => {
    expect(tokenizeArabic("يعاقب كل من ارتكب الجريمة")).toEqual([
      "يعاقب",
      "كل",
      "من",
      "ارتكب",
      "الجريمة",
    ]);
  });

  it("removes punctuation", () => {
    expect(tokenizeArabic("مادة (٥): يعاقب كل من ارتكب الجريمة.")).toEqual([
      "مادة",
      "5",
      "يعاقب",
      "كل",
      "من",
      "ارتكب",
      "الجريمة",
    ]);
  });

  it("normalizes Arabic-Indic digits", () => {
    expect(tokenizeArabic("مادة (٥٩)")).toEqual(["مادة", "59"]);
  });

  it("removes Arabic diacritics", () => {
    expect(tokenizeArabic("مُحَكَّمَة")).toEqual(["محكمة"]);
  });

  it("removes tatweel", () => {
    expect(tokenizeArabic("القــــانون")).toEqual(["القانون"]);
  });

  it("normalizes common Alef variants", () => {
    expect(tokenizeArabic("أحكام إدارية وآثار")).toEqual([
      "احكام",
      "ادارية",
      "واثار",
    ]);
  });

  it("returns an empty array for punctuation-only input", () => {
    expect(tokenizeArabic("...،؛()")).toEqual([]);
  });

  it("does not mutate the input string", () => {
    const input = "مادة (٥): يعاقب كل من ارتكب الجريمة";
    const original = input;

    tokenizeArabic(input);

    expect(input).toBe(original);
  });
});

describe("createBm25Index", () => {
  it("creates an index for a non-empty corpus", () => {
    const index = createBm25Index([
      {
        id: "a",
        text: "القانون ينظم العمل",
      },
      {
        id: "b",
        text: "العامل يستحق الاجر",
      },
    ]);

    expect(index.documentCount).toBe(2);
    expect(index.documents).toHaveLength(2);
    expect(index.averageDocumentLength).toBeGreaterThan(0);
  });

  it("rejects an empty corpus", () => {
    expect(() => createBm25Index([])).toThrow(/empty corpus/i);
  });

  it("rejects an invalid k1", () => {
    expect(() =>
      createBm25Index([{ id: "a", text: "القانون" }], { k1: 0 }),
    ).toThrow(/invalid BM25 k1/i);
  });

  it("rejects an invalid b", () => {
    expect(() =>
      createBm25Index([{ id: "a", text: "القانون" }], { b: 1.5 }),
    ).toThrow(/invalid BM25 b/i);
  });

  it("calculates document frequency per document", () => {
    const index = createBm25Index([
      {
        id: "a",
        text: "القانون القانون القانون",
      },
      {
        id: "b",
        text: "القانون",
      },
    ]);

    expect(index.documentFrequency.get("القانون")).toBe(2);
  });
});

describe("scoreBm25", () => {
  it("gives a positive score to a matching document", () => {
    const index = createBm25Index([
      {
        id: "a",
        text: "القانون ينظم العمل",
      },
      {
        id: "b",
        text: "العامل يستحق الاجر",
      },
    ]);

    const score = scoreBm25(
      tokenizeArabic("القانون"),
      index.documents[0]!,
      index,
    );

    expect(score).toBeGreaterThan(0);
  });

  it("returns zero for a non-matching document", () => {
    const index = createBm25Index([
      {
        id: "a",
        text: "القانون ينظم العمل",
      },
    ]);

    const score = scoreBm25(
      tokenizeArabic("المحكمة"),
      index.documents[0]!,
      index,
    );

    expect(score).toBe(0);
  });

  it("returns zero for an empty query", () => {
    const index = createBm25Index([
      {
        id: "a",
        text: "القانون ينظم العمل",
      },
    ]);

    expect(scoreBm25([], index.documents[0]!, index)).toBe(0);
  });

  it("does not double-count duplicate query terms", () => {
    const index = createBm25Index([
      {
        id: "a",
        text: "القانون ينظم العمل",
      },
      {
        id: "b",
        text: "العامل يستحق الاجر",
      },
    ]);

    const once = scoreBm25(
      tokenizeArabic("القانون"),
      index.documents[0]!,
      index,
    );

    const repeated = scoreBm25(
      tokenizeArabic("القانون القانون القانون"),
      index.documents[0]!,
      index,
    );

    expect(repeated).toBeCloseTo(once);
  });

  it("supports configurable k1", () => {
    const defaultIndex = createBm25Index([
      {
        id: "a",
        text: "القانون القانون العمل",
      },
      {
        id: "b",
        text: "القانون",
      },
    ]);

    const highK1Index = createBm25Index(
      [
        {
          id: "a",
          text: "القانون القانون العمل",
        },
        {
          id: "b",
          text: "القانون",
        },
      ],
      { k1: 2 },
    );

    const query = tokenizeArabic("القانون");

    const defaultScore = scoreBm25(
      query,
      defaultIndex.documents[0]!,
      defaultIndex,
    );

    const highK1Score = scoreBm25(
      query,
      highK1Index.documents[0]!,
      highK1Index,
    );

    expect(highK1Score).toBeGreaterThan(defaultScore);
  });

  it("supports configurable b", () => {
    const lowBIndex = createBm25Index(
      [
        {
          id: "a",
          text: "القانون القانون القانون العمل",
        },
        {
          id: "b",
          text: "القانون",
        },
      ],
      { b: 0 },
    );

    const highBIndex = createBm25Index(
      [
        {
          id: "a",
          text: "القانون القانون القانون العمل",
        },
        {
          id: "b",
          text: "القانون",
        },
      ],
      { b: 1 },
    );

    const query = tokenizeArabic("القانون");

    const lowBScore = scoreBm25(query, lowBIndex.documents[0]!, lowBIndex);

    const highBScore = scoreBm25(query, highBIndex.documents[0]!, highBIndex);

    expect(lowBScore).not.toBe(highBScore);
  });
});

describe("searchBm25", () => {
  it("ranks matching documents above non-matching documents", () => {
    const index = createBm25Index([
      {
        id: "law",
        text: "القانون ينظم العمل",
      },
      {
        id: "court",
        text: "المحكمة تنظر الدعوى",
      },
      {
        id: "worker",
        text: "العامل يستحق الاجر",
      },
    ]);

    const results = searchBm25(index, "القانون");

    expect(results[0]!.id).toBe("law");
    expect(results[0]!.score).toBeGreaterThan(0);
  });

  it("ranks documents matching multiple query terms highly", () => {
    const index = createBm25Index([
      {
        id: "both",
        text: "القانون ينظم العمل",
      },
      {
        id: "one",
        text: "القانون ينظم المحاكم",
      },
      {
        id: "none",
        text: "العامل يستحق الاجر",
      },
    ]);

    const results = searchBm25(index, "القانون العمل");

    expect(results[0]!.id).toBe("both");
    expect(results[0]!.score).toBeGreaterThan(results[1]!.score);
  });

  it("returns an empty result for an unknown term", () => {
    const index = createBm25Index([
      {
        id: "a",
        text: "القانون ينظم العمل",
      },
    ]);

    expect(searchBm25(index, "المحكمة")).toEqual([]);
  });

  it("returns an empty result for an empty query", () => {
    const index = createBm25Index([
      {
        id: "a",
        text: "القانون ينظم العمل",
      },
    ]);

    expect(searchBm25(index, "")).toEqual([]);
  });

  it("produces deterministic ordering for tied scores", () => {
    const index = createBm25Index([
      {
        id: "b",
        text: "القانون",
      },
      {
        id: "a",
        text: "القانون",
      },
    ]);

    const first = searchBm25(index, "القانون");
    const second = searchBm25(index, "القانون");

    expect(first.map((result) => result.id)).toEqual(
      second.map((result) => result.id),
    );

    expect(first.map((result) => result.id)).toEqual(["a", "b"]);
  });
});
