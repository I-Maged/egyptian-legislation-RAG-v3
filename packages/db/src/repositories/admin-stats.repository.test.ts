import { describe, expect, it } from "vitest";

import {
  buildTopLaws,
  computeFeedbackEngagement,
  percent,
} from "./admin-stats.repository";

describe("percent", () => {
  it("returns null when the whole is zero", () => {
    expect(percent(5, 0)).toBeNull();
  });

  it("returns a rounded percentage", () => {
    expect(percent(40, 50)).toBe(80);
    expect(percent(1, 3)).toBe(33.3);
  });
});

describe("buildTopLaws", () => {
  const chunksById = new Map([
    [
      "chunk-1",
      { lawName: "قانون العمل", lawNumber: "14", year: "2025" },
    ],
    [
      "chunk-2",
      { lawName: "قانون العمل", lawNumber: "14", year: "2025" },
    ],
    [
      "chunk-3",
      { lawName: "قانون الإيجارات", lawNumber: null, year: null },
    ],
  ]);

  it("aggregates citations per law and sorts descending", () => {
    const citationsByChunkId = new Map([
      ["chunk-1", 3],
      ["chunk-2", 4],
      ["chunk-3", 9],
    ]);

    const topLaws = buildTopLaws(citationsByChunkId, chunksById);

    expect(topLaws).toEqual([
      {
        lawName: "قانون الإيجارات",
        lawNumber: null,
        year: null,
        citations: 9,
      },
      {
        lawName: "قانون العمل",
        lawNumber: "14",
        year: "2025",
        citations: 7,
      },
    ]);
  });

  it("skips chunks missing from the corpus", () => {
    const citationsByChunkId = new Map([["chunk-orphan", 100]]);

    expect(buildTopLaws(citationsByChunkId, chunksById)).toEqual([]);
  });

  it("limits results to the top laws", () => {
    const citationsByChunkId = new Map(
      Array.from({ length: 15 }, (_, index) => [`chunk-${index}`, 1]),
    );

    const manyChunks = new Map(
      Array.from({ length: 15 }, (_, index) => [
        `chunk-${index}`,
        { lawName: `law-${index}`, lawNumber: null, year: null },
      ]),
    );

    expect(buildTopLaws(citationsByChunkId, manyChunks)).toHaveLength(10);
  });
});

describe("computeFeedbackEngagement", () => {
  it("computes coverage and positive rates", () => {
    const stats = computeFeedbackEngagement(50, 40, 5, 200, []);

    expect(stats.coverageRatePercent).toBe(25);
    expect(stats.positiveRatePercent).toBe(80);
    expect(stats.negativeWithComments).toBe(5);
    expect(stats.recentNegativeComments).toEqual([]);
  });

  it("returns null coverage when there are no assistant messages", () => {
    const stats = computeFeedbackEngagement(0, 0, 0, 0, []);

    expect(stats.coverageRatePercent).toBeNull();
    expect(stats.positiveRatePercent).toBeNull();
  });
});
