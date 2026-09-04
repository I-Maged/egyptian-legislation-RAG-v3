import type {
  GenerationEvaluationResult,
  GenerationJudgeInput,
  GenerationJudgeOutput,
  GenerationPrediction,
  GenerationQuery,
  GenerationQueryResult,
} from "./types";

export type GenerationFunction = (
  query: string,
  context: string[],
) => string | Promise<string>;

export type GenerationJudge = (
  input: GenerationJudgeInput,
) => GenerationJudgeOutput | Promise<GenerationJudgeOutput>;

export interface GenerationEvaluatorOptions {
  judge: GenerationJudge;

  /**
   * Minimum score required for a query to be considered passed.
   *
   * Default: 0.7
   */
  passThreshold?: number;

  /**
   * Maximum number of generation/judge operations
   * allowed to run concurrently.
   *
   * Default: 1.
   */
  concurrency?: number;
}

export class GenerationEvaluator {
  private readonly judge: GenerationJudge;
  private readonly passThreshold: number;
  private readonly concurrency: number;

  constructor(options: GenerationEvaluatorOptions) {
    this.judge = options.judge;
    this.passThreshold = options.passThreshold ?? 0.7;
    this.concurrency = normalizeConcurrency(options.concurrency ?? 1);
  }

  async evaluate(
    dataset: GenerationQuery[],
    generate: GenerationFunction,
  ): Promise<GenerationEvaluationResult> {
    if (dataset.length === 0) {
      return {
        queryCount: 0,
        correctness: 0,
        faithfulness: 0,
        citationCorrectness: 0,
        predictions: [],
        perQuery: [],
      };
    }

    const results = await mapWithConcurrency(
      dataset,
      this.concurrency,
      async (example) => {
        const answer = await generate(example.query, example.context);

        const judgeInput: GenerationJudgeInput = {
          query: example.query,
          answer,

          context: example.context,
          contextChunkIds: example.contextChunkIds,

          referenceAnswer: example.referenceAnswer,
          referenceChunkIds: example.referenceChunkIds,

          ...(example.citedChunkIds !== undefined
            ? { citedChunkIds: example.citedChunkIds }
            : {}),
        };

        const scores = await this.judge(judgeInput);

        validateScore("correctness", scores.correctness);
        validateScore("faithfulness", scores.faithfulness);
        validateScore("citationCorrectness", scores.citationCorrectness);

        const passed =
          scores.correctness >= this.passThreshold &&
          scores.faithfulness >= this.passThreshold &&
          scores.citationCorrectness >= this.passThreshold;

        const prediction: GenerationPrediction = {
          queryId: example.id,
          answer,
        };

        const perQuery: GenerationQueryResult = {
          queryId: example.id,
          answer,

          correctness: scores.correctness,
          faithfulness: scores.faithfulness,
          citationCorrectness: scores.citationCorrectness,

          passed,
        };

        return {
          prediction,
          perQuery,
        };
      },
    );

    const predictions = results.map((result) => result.prediction);
    const perQuery = results.map((result) => result.perQuery);

    return {
      queryCount: dataset.length,

      correctness: average(perQuery.map((result) => result.correctness)),

      faithfulness: average(perQuery.map((result) => result.faithfulness)),

      citationCorrectness: average(
        perQuery.map((result) => result.citationCorrectness),
      ),

      predictions,
      perQuery,
    };
  }
}

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) {
    return [];
  }

  const workerCount = Math.min(concurrency, items.length);
  const results = new Array<R>(items.length);

  let nextIndex = 0;

  async function runWorker(): Promise<void> {
    while (true) {
      const index = nextIndex++;

      if (index >= items.length) {
        return;
      }

      const item = items[index];

      if (item === undefined) {
        throw new Error(
          `Internal evaluator error: missing item at index ${index}.`,
        );
      }

      results[index] = await worker(item, index);
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => runWorker()));

  return results;
}

function normalizeConcurrency(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 1;
  }

  return Math.max(1, Math.floor(value));
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function validateScore(name: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${name} score must be a finite number`);
  }

  if (value < 0 || value > 1) {
    throw new Error(`${name} score must be between 0 and 1`);
  }
}
