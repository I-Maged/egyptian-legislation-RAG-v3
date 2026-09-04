import { describe, expect, it } from "vitest";

import { ContextEvaluator, type ContextFunction } from "./evaluator";

describe("ContextEvaluator", () => {
  const dataset = [
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

  const getContext: ContextFunction = (query) => {
    if (query === "query one") {
      return ["a", "x", "y"];
    }

    if (query === "query two") {
      return ["x", "b", "y"];
    }

    return ["x", "y", "z"];
  };

  it("evaluates context", async () => {
    const evaluator = new ContextEvaluator();

    const result = await evaluator.evaluate(dataset, getContext);

    expect(result.queryCount).toBe(3);

    expect(result.contextRecall).toBeCloseTo(2 / 3);

    expect(result.contextPrecision).toBeCloseTo((1 / 3 + 1 / 3 + 0) / 3);

    expect(result.contextHitRate).toBeCloseTo(2 / 3);
  });

  it("returns per-query results", async () => {
    const evaluator = new ContextEvaluator();

    const result = await evaluator.evaluate(dataset, getContext);

    expect(result.perQuery).toHaveLength(3);

    expect(result.perQuery[0]).toEqual({
      queryId: "q1",
      contextChunkIds: ["a", "x", "y"],
      relevantChunkIds: ["a"],
      relevantRetrievedChunkIds: ["a"],
      contextRecall: 1,
      contextPrecision: 1 / 3,
      contextHit: true,
    });

    expect(result.perQuery[1]?.contextRecall).toBe(1);
    expect(result.perQuery[2]?.contextRecall).toBe(0);
    expect(result.perQuery[2]?.contextHit).toBe(false);
  });

  it("preserves predictions", async () => {
    const evaluator = new ContextEvaluator();

    const result = await evaluator.evaluate(dataset, getContext);

    expect(result.predictions).toEqual([
      {
        queryId: "q1",
        contextChunkIds: ["a", "x", "y"],
      },
      {
        queryId: "q2",
        contextChunkIds: ["x", "b", "y"],
      },
      {
        queryId: "q3",
        contextChunkIds: ["x", "y", "z"],
      },
    ]);
  });

  it("supports asynchronous context functions", async () => {
    const evaluator = new ContextEvaluator();

    const asyncGetContext: ContextFunction = async (query) => {
      if (query === "query one") {
        return ["a"];
      }

      return [];
    };

    const result = await evaluator.evaluate(dataset, asyncGetContext);

    expect(result.queryCount).toBe(3);
    expect(result.contextHitRate).toBeCloseTo(1 / 3);
  });

  it("handles an empty dataset", async () => {
    const evaluator = new ContextEvaluator();

    const result = await evaluator.evaluate([], () => []);

    expect(result.queryCount).toBe(0);
    expect(result.contextRecall).toBe(0);
    expect(result.contextPrecision).toBe(0);
    expect(result.contextHitRate).toBe(0);
    expect(result.predictions).toEqual([]);
    expect(result.perQuery).toEqual([]);
  });
});
