import { describe, expect, it } from "vitest";

import type { RetrievalGoldDataset } from "../datasets/retrieval-dataset";

import { RetrievalEvaluator, type RetrievedChunk } from "./retrieval-evaluator";

function createDataset(): RetrievalGoldDataset {
  return {
    schema_version: "1.0",
    name: "test-retrieval",
    description: "Test retrieval dataset",
    language: "ar",
    jurisdiction: "EG",
    items: [
      {
        id: "q1",
        query: "question one",
        relevantChunkIds: ["a", "b"],
      },
      {
        id: "q2",
        query: "question two",
        relevantChunkIds: ["c"],
      },
    ],
  };
}

function ids(...chunkIds: string[]): RetrievedChunk[] {
  return chunkIds.map((chunkId) => ({ chunkId }));
}

describe("RetrievalEvaluator", () => {
  it("calculates retrieval metrics correctly", async () => {
    const evaluator = new RetrievalEvaluator({
      ks: [1, 3, 5],
    });

    const result = await evaluator.evaluate(createDataset(), async (query) => {
      if (query === "question one") {
        return ids("a", "b");
      }

      return ids("c");
    });

    expect(result.queryCount).toBe(2);

    expect(result.metrics.recall[1]).toBe(0.75);
    expect(result.metrics.recall[3]).toBe(1);

    expect(result.metrics.hitRate[1]).toBe(1);
    expect(result.metrics.hitRate[3]).toBe(1);

    expect(result.metrics.mrr[1]).toBe(1);
    expect(result.metrics.mrr[3]).toBe(1);

    expect(result.metrics.ndcg[1]).toBe(1);
    expect(result.metrics.ndcg[3]).toBe(1);
  });

  it("calculates zero metrics when nothing relevant is retrieved", async () => {
    const evaluator = new RetrievalEvaluator({
      ks: [1, 3],
    });

    const result = await evaluator.evaluate(createDataset(), async () =>
      ids("x", "y", "z"),
    );

    expect(result.metrics.recall[1]).toBe(0);
    expect(result.metrics.recall[3]).toBe(0);

    expect(result.metrics.precision[1]).toBe(0);
    expect(result.metrics.precision[3]).toBe(0);

    expect(result.metrics.hitRate[1]).toBe(0);
    expect(result.metrics.hitRate[3]).toBe(0);

    expect(result.metrics.mrr[1]).toBe(0);
    expect(result.metrics.mrr[3]).toBe(0);

    expect(result.metrics.ndcg[1]).toBe(0);
    expect(result.metrics.ndcg[3]).toBe(0);
  });

  it("calculates MRR based on the first relevant result", async () => {
    const dataset: RetrievalGoldDataset = {
      schema_version: "1.0",
      name: "mrr-test",
      description: "MRR test",
      language: "ar",
      jurisdiction: "EG",
      items: [
        {
          id: "q1",
          query: "question",
          relevantChunkIds: ["correct"],
        },
      ],
    };

    const evaluator = new RetrievalEvaluator({
      ks: [1, 3, 5],
    });

    const result = await evaluator.evaluate(dataset, async () =>
      ids("wrong-1", "wrong-2", "correct"),
    );

    expect(result.metrics.mrr[1]).toBe(0);
    expect(result.metrics.mrr[3]).toBeCloseTo(1 / 3);
    expect(result.metrics.mrr[5]).toBeCloseTo(1 / 3);
  });

  it("supports graded relevance for nDCG", async () => {
    const dataset: RetrievalGoldDataset = {
      schema_version: "1.0",
      name: "graded-test",
      description: "Graded relevance test",
      language: "ar",
      jurisdiction: "EG",
      items: [
        {
          id: "q1",
          query: "question",
          relevantChunkIds: ["high", "medium", "low"],
          relevance: {
            high: 3,
            medium: 2,
            low: 1,
          },
        },
      ],
    };

    const evaluator = new RetrievalEvaluator({
      ks: [1, 3],
    });

    const result = await evaluator.evaluate(dataset, async () =>
      ids("high", "medium", "low"),
    );

    expect(result.metrics.ndcg[1]).toBe(1);
    expect(result.metrics.ndcg[3]).toBe(1);
  });

  it("supports custom K values", async () => {
    const evaluator = new RetrievalEvaluator({
      ks: [2, 7],
    });

    const result = await evaluator.evaluate(createDataset(), async () =>
      ids("a", "b", "c"),
    );

    expect(Object.keys(result.metrics.recall)).toEqual(["2", "7"]);
  });

  it("rejects invalid K values", () => {
    expect(() => new RetrievalEvaluator({ ks: [0] })).toThrow(
      /invalid evaluation k/i,
    );

    expect(() => new RetrievalEvaluator({ ks: [1, 1] })).toThrow(
      /duplicate evaluation k/i,
    );
  });

  it("rejects an empty dataset", async () => {
    const evaluator = new RetrievalEvaluator();

    const dataset: RetrievalGoldDataset = {
      schema_version: "1.0",
      name: "empty",
      description: "Empty",
      language: "ar",
      jurisdiction: "EG",
      items: [],
    };

    await expect(evaluator.evaluate(dataset, async () => [])).rejects.toThrow(
      /empty retrieval dataset/i,
    );
  });
});
