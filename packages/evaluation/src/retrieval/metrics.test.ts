import { describe, expect, it } from "vitest";

import {
  dcgAtK,
  hitRateAtK,
  idealDcgAtK,
  meanReciprocalRank,
  ndcgAtK,
  precisionAtK,
  recallAtK,
  reciprocalRank,
} from "./metrics";

describe("recallAtK", () => {
  it("returns 1 when all relevant documents are retrieved", () => {
    expect(recallAtK(["a", "b", "c"], ["a", "b"], 3)).toBe(1);
  });

  it("returns partial recall", () => {
    expect(recallAtK(["a", "x", "y"], ["a", "b"], 3)).toBe(0.5);
  });

  it("respects K", () => {
    expect(recallAtK(["x", "a", "b"], ["a", "b"], 2)).toBe(0.5);
  });

  it("returns zero when no relevant document is retrieved", () => {
    expect(recallAtK(["x", "y"], ["a", "b"], 2)).toBe(0);
  });

  it("returns zero for an empty relevance set", () => {
    expect(recallAtK(["a", "b"], [], 2)).toBe(0);
  });

  it("does not double-count duplicate retrieved IDs", () => {
    expect(recallAtK(["a", "a", "a"], ["a", "b"], 3)).toBe(0.5);
  });

  it("rejects invalid K", () => {
    expect(() => recallAtK(["a"], ["a"], 0)).toThrow(/invalid k/i);
  });
});

describe("reciprocalRank", () => {
  it("returns 1 when the first result is relevant", () => {
    expect(reciprocalRank(["a", "b"], ["a"])).toBe(1);
  });

  it("returns reciprocal of the first relevant rank", () => {
    expect(reciprocalRank(["x", "y", "a"], ["a"])).toBeCloseTo(1 / 3);
  });

  it("ignores later relevant documents", () => {
    expect(reciprocalRank(["x", "a", "b"], ["a", "b"])).toBe(0.5);
  });

  it("returns zero when no relevant document is found", () => {
    expect(reciprocalRank(["x", "y"], ["a"])).toBe(0);
  });
});

describe("meanReciprocalRank", () => {
  it("calculates MRR across queries", () => {
    expect(
      meanReciprocalRank([
        {
          retrievedChunkIds: ["a"],
          relevantChunkIds: ["a"],
        },
        {
          retrievedChunkIds: ["x", "a"],
          relevantChunkIds: ["a"],
        },
      ]),
    ).toBeCloseTo(0.75);
  });

  it("returns zero for an empty evaluation set", () => {
    expect(meanReciprocalRank([])).toBe(0);
  });
});

describe("precisionAtK", () => {
  it("calculates precision at K", () => {
    expect(precisionAtK(["a", "x", "b", "y"], ["a", "b"], 4)).toBe(0.5);
  });

  it("respects K", () => {
    expect(precisionAtK(["a", "x", "b"], ["a", "b"], 2)).toBe(0.5);
  });

  it("returns zero when nothing is relevant", () => {
    expect(precisionAtK(["x", "y"], ["a"], 2)).toBe(0);
  });

  it("returns zero precision when nothing is retrieved", () => {
    expect(precisionAtK([], ["chunk-1", "chunk-2"], 5)).toBe(0);
  });
});

describe("dcgAtK", () => {
  const relevance = {
    a: 3,
    b: 2,
    c: 1,
  };

  it("calculates DCG", () => {
    const value = dcgAtK(["a", "b", "c"], relevance, 3);

    expect(value).toBeCloseTo(3 + 2 / Math.log2(3) + 1 / Math.log2(4));
  });

  it("respects K", () => {
    expect(dcgAtK(["a", "b", "c"], relevance, 1)).toBe(3);
  });

  it("treats unknown documents as zero relevance", () => {
    expect(dcgAtK(["unknown"], relevance, 1)).toBe(0);
  });
});

describe("idealDcgAtK", () => {
  it("places the highest relevance documents first", () => {
    const relevance = {
      a: 1,
      b: 3,
      c: 2,
    };

    expect(idealDcgAtK(relevance, 3)).toBeCloseTo(
      3 + 2 / Math.log2(3) + 1 / Math.log2(4),
    );
  });
});

describe("ndcgAtK", () => {
  const relevance = {
    a: 3,
    b: 2,
    c: 1,
  };

  it("returns 1 for the ideal ranking", () => {
    expect(ndcgAtK(["a", "b", "c"], relevance, 3)).toBeCloseTo(1);
  });

  it("is less than 1 for a non-ideal ranking", () => {
    expect(ndcgAtK(["c", "b", "a"], relevance, 3)).toBeLessThan(1);
  });

  it("returns zero when there is no relevance", () => {
    expect(ndcgAtK(["a", "b"], {}, 2)).toBe(0);
  });

  it("respects K", () => {
    expect(ndcgAtK(["a", "b", "c"], relevance, 1)).toBeCloseTo(1);
  });
});

describe("hitRateAtK", () => {
  it("returns 1 when a relevant chunk appears in top K", () => {
    expect(hitRateAtK(["x", "a", "y"], ["a"], 3)).toBe(1);
  });

  it("returns 0 when no relevant chunk appears in top K", () => {
    expect(hitRateAtK(["x", "y", "z"], ["a"], 3)).toBe(0);
  });

  it("does not count relevant results after K", () => {
    expect(hitRateAtK(["x", "y", "a"], ["a"], 2)).toBe(0);
  });

  it("returns 0 for K <= 0", () => {
    expect(hitRateAtK(["a"], ["a"], 0)).toBe(0);
  });
});
