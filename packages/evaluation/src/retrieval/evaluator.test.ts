import { describe, expect, it } from "vitest";

import { RetrievalEvaluator, type RetrievalFunction } from "./evaluator";

import type { RetrievalQuery } from "./types";

const dataset: RetrievalQuery[] = [
  {
    id: "q1",
    query: "query one",
    relevantChunkIds: ["a"],
  },
  {
    id: "q2",
    query: "query two",
    relevantChunkIds: ["b"],
  },
  {
    id: "q3",
    query: "query three",
    relevantChunkIds: ["c"],
  },
];

const retrieve: RetrievalFunction = (query) => {
  if (query === "query one") {
    return ["a", "x", "y"];
  }

  if (query === "query two") {
    return ["x", "b", "y"];
  }

  return ["x", "y", "c"];
};

describe("RetrievalEvaluator", () => {
  it("evaluates a retrieval function", async () => {
    const evaluator = new RetrievalEvaluator();

    const result = await evaluator.evaluate(dataset, retrieve);

    expect(result.queryCount).toBe(3);

    expect(result.recall["1"]).toBeCloseTo(1 / 3);

    expect(result.recall["3"]).toBeCloseTo(1);

    expect(result.mrr).toBeCloseTo((1 + 1 / 2 + 1 / 3) / 3);
  });

  it("supports custom metric K values", async () => {
    const evaluator = new RetrievalEvaluator();

    const result = await evaluator.evaluate(dataset, retrieve, {
      recallAt: [1, 2],
      precisionAt: [1, 2],
      ndcgAt: [1, 2],
    });

    expect(Object.keys(result.recall)).toEqual(["1", "2"]);

    expect(Object.keys(result.precision)).toEqual(["1", "2"]);

    expect(Object.keys(result.ndcg)).toEqual(["1", "2"]);
  });

  it("supports graded relevance", async () => {
    const gradedDataset: RetrievalQuery[] = [
      {
        id: "q1",
        query: "legal query",
        relevantChunkIds: ["a", "b", "c"],
        relevance: {
          a: 3,
          b: 2,
          c: 1,
        },
      },
    ];

    const evaluator = new RetrievalEvaluator();

    const result = await evaluator.evaluate(gradedDataset, () => [
      "a",
      "b",
      "c",
    ]);

    expect(result.ndcg["5"]).toBeCloseTo(1);
  });

  it("returns empty metrics for an empty dataset", async () => {
    const evaluator = new RetrievalEvaluator();

    const result = await evaluator.evaluate([], () => []);

    expect(result.queryCount).toBe(0);
    expect(result.recall).toEqual({});
    expect(result.precision).toEqual({});
    expect(result.ndcg).toEqual({});
    expect(result.mrr).toBe(0);
    expect(result.predictions).toEqual([]);
    expect(result.hitRate).toEqual({});
  });

  it("preserves predictions", async () => {
    const evaluator = new RetrievalEvaluator();

    const result = await evaluator.evaluate(dataset, retrieve);

    expect(result.predictions).toEqual([
      {
        queryId: "q1",
        retrievedChunkIds: ["a", "x", "y"],
      },
      {
        queryId: "q2",
        retrievedChunkIds: ["x", "b", "y"],
      },
      {
        queryId: "q3",
        retrievedChunkIds: ["x", "y", "c"],
      },
    ]);
  });

  it("can disable MRR", async () => {
    const evaluator = new RetrievalEvaluator();

    const result = await evaluator.evaluate(dataset, retrieve, {
      includeMrr: false,
    });

    expect(result.mrr).toBe(0);
  });

  it("uses binary relevance when graded relevance is absent", async () => {
    const evaluator = new RetrievalEvaluator();

    const result = await evaluator.evaluate(
      [
        {
          id: "q1",
          query: "query",
          relevantChunkIds: ["a"],
        },
      ],
      () => ["a"],
      {
        ndcgAt: [1],
      },
    );

    expect(result.ndcg["1"]).toBeCloseTo(1);
  });

  it("calculates Hit Rate / Success@K", async () => {
    const evaluator = new RetrievalEvaluator();

    const result = await evaluator.evaluate(dataset, retrieve, {
      hitRateAt: [1, 2, 3],
    });

    /*
     * q1: a is rank 1
     * q2: b is rank 2
     * q3: c is rank 3
     *
     * Therefore:
     *
     * Hit@1 = 1/3
     * Hit@2 = 2/3
     * Hit@3 = 3/3
     */

    expect(result.hitRate["1"]).toBeCloseTo(1 / 3);

    expect(result.hitRate["2"]).toBeCloseTo(2 / 3);

    expect(result.hitRate["3"]).toBeCloseTo(1);
  });

  it("supports an asynchronous retrieval function", async () => {
    const evaluator = new RetrievalEvaluator();

    const asyncRetrieve: RetrievalFunction = async (query) => {
      if (query === "query one") {
        return ["a"];
      }

      return ["x"];
    };

    const result = await evaluator.evaluate(dataset, asyncRetrieve);

    expect(result.queryCount).toBe(3);
    expect(result.recall["1"]).toBeCloseTo(1 / 3);
  });
});
