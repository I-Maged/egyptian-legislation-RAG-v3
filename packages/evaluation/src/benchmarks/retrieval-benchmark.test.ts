import { describe, expect, it } from "vitest";

import type { RetrievalGoldDataset } from "../datasets/retrieval-dataset";

import { runRetrievalBenchmark } from "./retrieval-benchmark";

const dataset: RetrievalGoldDataset = {
  schema_version: "1.0",
  name: "test-retrieval-dataset",
  description: "Test dataset",
  language: "ar",
  jurisdiction: "EG",
  items: [
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
  ],
};

describe("runRetrievalBenchmark", () => {
  it("evaluates multiple retrieval systems", async () => {
    const result = await runRetrievalBenchmark(dataset, {
      systems: [
        {
          name: "bm25",
          retrieve: (query) => {
            if (query === "query one") {
              return ["a"];
            }

            return ["x"];
          },
        },
        {
          name: "vector",
          retrieve: (query) => {
            if (query === "query two") {
              return ["b"];
            }

            return ["x"];
          },
        },
      ],
    });

    expect(result.datasetName).toBe("test-retrieval-dataset");

    expect(result.queryCount).toBe(2);

    expect(result.systems).toHaveLength(2);

    expect(result.systems.map((system) => system.name)).toEqual([
      "bm25",
      "vector",
    ]);
  });

  it("preserves each system's evaluation result", async () => {
    const result = await runRetrievalBenchmark(dataset, {
      systems: [
        {
          name: "perfect",
          retrieve: () => ["a"],
        },
      ],
    });

    const system = result.systems[0]!;

    expect(system.name).toBe("perfect");

    expect(system.result.queryCount).toBe(2);

    expect(system.result.recall["1"]).toBeCloseTo(0.5);

    expect(system.result.mrr).toBeCloseTo(0.5);
  });

  it("supports asynchronous retrieval systems", async () => {
    const result = await runRetrievalBenchmark(dataset, {
      systems: [
        {
          name: "async-vector",
          retrieve: async (query) => {
            await Promise.resolve();

            return query === "query one" ? ["a"] : ["b"];
          },
        },
      ],
    });

    expect(result.systems[0]!.result.recall["1"]).toBeCloseTo(1);
  });

  it("supports evaluation options", async () => {
    const result = await runRetrievalBenchmark(dataset, {
      systems: [
        {
          name: "test",
          retrieve: () => ["a"],
        },
      ],
      recallAt: [1, 5],
      precisionAt: [5],
      ndcgAt: [5],
      includeMrr: false,
    });

    const evaluation = result.systems[0]!.result;

    expect(Object.keys(evaluation.recall)).toEqual(["1", "5"]);

    expect(Object.keys(evaluation.precision)).toEqual(["5"]);

    expect(Object.keys(evaluation.ndcg)).toEqual(["5"]);

    expect(evaluation.mrr).toBe(0);
  });

  it("returns an empty result for an empty dataset", async () => {
    const emptyDataset: RetrievalGoldDataset = {
      ...dataset,
      items: [],
    };

    const result = await runRetrievalBenchmark(emptyDataset, {
      systems: [
        {
          name: "bm25",
          retrieve: () => [],
        },
      ],
    });

    expect(result.queryCount).toBe(0);

    expect(result.systems[0]!.result.queryCount).toBe(0);
  });

  it("supports multiple systems with different retrieval behavior", async () => {
    const result = await runRetrievalBenchmark(dataset, {
      systems: [
        {
          name: "perfect",
          retrieve: (query) => (query === "query one" ? ["a"] : ["b"]),
        },
        {
          name: "bad",
          retrieve: () => ["x"],
        },
      ],
    });

    expect(result.systems[0]!.result.recall["1"]).toBeCloseTo(1);

    expect(result.systems[1]!.result.recall["1"]).toBeCloseTo(0);
  });
});
