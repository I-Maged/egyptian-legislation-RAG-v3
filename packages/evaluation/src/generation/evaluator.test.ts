import { describe, expect, it } from "vitest";

import { GenerationEvaluator } from "./evaluator";

describe("GenerationEvaluator", () => {
  it("evaluates generated answers", async () => {
    const evaluator = new GenerationEvaluator({
      judge: async () => ({
        correctness: 0.9,
        faithfulness: 0.8,
        citationCorrectness: 1,
      }),
    });

    const result = await evaluator.evaluate(
      [
        {
          id: "q1",
          query: "ما مدة فترة الاختبار؟",
          contextChunkIds: ["chunk-90"],
          context: ["النص الخاص بالمادة 90"],
          referenceAnswer: "لا يجوز أن تزيد مدة الاختبار على ثلاثة أشهر.",
          referenceChunkIds: ["chunk-90"],
        },
      ],
      async () => "مدة الاختبار لا تزيد على ثلاثة أشهر.",
    );

    expect(result.queryCount).toBe(1);

    expect(result.correctness).toBe(0.9);
    expect(result.faithfulness).toBe(0.8);
    expect(result.citationCorrectness).toBe(1);

    expect(result.predictions).toHaveLength(1);
    expect(result.perQuery).toHaveLength(1);

    expect(result.perQuery[0]?.passed).toBe(true);
  });

  it("returns per-query results", async () => {
    const evaluator = new GenerationEvaluator({
      judge: async (input) => ({
        correctness: input.query === "q1" ? 1 : 0.5,
        faithfulness: 0.8,
        citationCorrectness: 1,
      }),
    });

    const result = await evaluator.evaluate(
      [
        {
          id: "q1",
          query: "q1",
          contextChunkIds: ["c1"],
          context: ["context"],
          referenceAnswer: "answer",
          referenceChunkIds: ["c1"],
        },
        {
          id: "q2",
          query: "q2",
          contextChunkIds: ["c2"],
          context: ["context"],
          referenceAnswer: "answer",
          referenceChunkIds: ["c2"],
        },
      ],
      async (query) => `answer for ${query}`,
    );

    expect(result.perQuery).toHaveLength(2);

    expect(result.perQuery[0]?.correctness).toBe(1);
    expect(result.perQuery[1]?.correctness).toBe(0.5);
  });

  it("preserves generated predictions", async () => {
    const evaluator = new GenerationEvaluator({
      judge: async () => ({
        correctness: 1,
        faithfulness: 1,
        citationCorrectness: 1,
      }),
    });

    const result = await evaluator.evaluate(
      [
        {
          id: "q1",
          query: "question",
          contextChunkIds: ["c1"],
          context: ["context"],
          referenceAnswer: "answer",
          referenceChunkIds: ["c1"],
        },
      ],
      async () => "generated answer",
    );

    expect(result.predictions).toEqual([
      {
        queryId: "q1",
        answer: "generated answer",
      },
    ]);
  });

  it("supports asynchronous generation and judging", async () => {
    const evaluator = new GenerationEvaluator({
      judge: async () => ({
        correctness: 0.9,
        faithfulness: 0.9,
        citationCorrectness: 0.9,
      }),
    });

    const result = await evaluator.evaluate(
      [
        {
          id: "q1",
          query: "question",
          contextChunkIds: ["c1"],
          context: ["context"],
          referenceAnswer: "answer",
          referenceChunkIds: ["c1"],
        },
      ],
      async () => {
        await Promise.resolve();

        return "generated answer";
      },
    );

    expect(result.correctness).toBe(0.9);
  });

  it("handles an empty dataset", async () => {
    const evaluator = new GenerationEvaluator({
      judge: async () => ({
        correctness: 1,
        faithfulness: 1,
        citationCorrectness: 1,
      }),
    });

    const result = await evaluator.evaluate([], async () => "answer");

    expect(result.queryCount).toBe(0);
    expect(result.correctness).toBe(0);
    expect(result.faithfulness).toBe(0);
    expect(result.citationCorrectness).toBe(0);
    expect(result.predictions).toEqual([]);
    expect(result.perQuery).toEqual([]);
  });

  it("marks a query as failed when a score is below the threshold", async () => {
    const evaluator = new GenerationEvaluator({
      passThreshold: 0.7,

      judge: async () => ({
        correctness: 0.9,
        faithfulness: 0.6,
        citationCorrectness: 1,
      }),
    });

    const result = await evaluator.evaluate(
      [
        {
          id: "q1",
          query: "question",
          contextChunkIds: ["c1"],
          context: ["context"],
          referenceAnswer: "answer",
          referenceChunkIds: ["c1"],
        },
      ],
      async () => "answer",
    );

    expect(result.perQuery[0]?.passed).toBe(false);
  });

  it("rejects invalid judge scores", async () => {
    const evaluator = new GenerationEvaluator({
      judge: async () => ({
        correctness: 1.2,
        faithfulness: 0.8,
        citationCorrectness: 1,
      }),
    });

    await expect(
      evaluator.evaluate(
        [
          {
            id: "q1",
            query: "question",
            contextChunkIds: ["c1"],
            context: ["context"],
            referenceAnswer: "answer",
            referenceChunkIds: ["c1"],
          },
        ],
        async () => "answer",
      ),
    ).rejects.toThrow("correctness score must be between 0 and 1");
  });
});
