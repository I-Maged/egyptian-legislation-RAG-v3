import { describe, expect, it } from "vitest";

import { searchBm25 } from "./bm25.repository";

describe("BM25 repository", () => {
  it("retrieves lexical matches", async () => {
    const results = await searchBm25({
      query: "فترة الاختبار",
      topK: 5,
    });

    expect(results.length).toBeGreaterThan(0);

    for (const result of results) {
      expect(result.chunkId).toBeTruthy();
      expect(result.score).toBeGreaterThan(0);
    }
  });

  it("respects topK", async () => {
    const results = await searchBm25({
      query: "عقد العمل",
      topK: 3,
    });

    expect(results.length).toBeLessThanOrEqual(3);
  });

  it("filters by law document", async () => {
    const results = await searchBm25({
      query: "فترة الاختبار",
      topK: 10,
      lawDocumentId: "lawdoc_f1fd6f6338643087",
    });

    expect(results.length).toBeGreaterThan(0);
  });

  it("returns empty results for empty query", async () => {
    const results = await searchBm25({
      query: "   ",
      topK: 5,
    });

    expect(results).toEqual([]);
  });

  it("rejects invalid topK", async () => {
    await expect(
      searchBm25({
        query: "عقد العمل",
        topK: 0,
      }),
    ).rejects.toThrow(/topK/i);
  });
});
