import { describe, expect, it } from "vitest";

import { cosineSimilarity } from "./cosine";

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors", () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
  });

  it("returns -1 for opposite vectors", () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1);
  });

  it("returns 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it("works with non-unit vectors", () => {
    expect(cosineSimilarity([3, 4], [6, 8])).toBeCloseTo(1);
  });

  it("is symmetric", () => {
    const a = [0.2, 0.4, 0.8];
    const b = [0.7, -0.1, 0.3];

    expect(cosineSimilarity(a, b)).toBeCloseTo(cosineSimilarity(b, a));
  });

  it("rejects empty vectors", () => {
    expect(() => cosineSimilarity([], [])).toThrow(/non-empty vectors/i);
  });

  it("rejects a dimension mismatch", () => {
    expect(() => cosineSimilarity([1, 2, 3], [1, 2])).toThrow(
      /dimension mismatch/i,
    );
  });

  it("rejects non-finite values", () => {
    expect(() => cosineSimilarity([1, Number.NaN], [1, 2])).toThrow(/finite/i);

    expect(() =>
      cosineSimilarity([1, Number.POSITIVE_INFINITY], [1, 2]),
    ).toThrow(/finite/i);
  });

  it("rejects a zero vector", () => {
    expect(() => cosineSimilarity([0, 0], [1, 2])).toThrow(/zero vectors/i);

    expect(() => cosineSimilarity([1, 2], [0, 0])).toThrow(/zero vectors/i);
  });
});
