import {
  hitRateAtK,
  meanReciprocalRank,
  ndcgAtK,
  precisionAtK,
  recallAtK,
} from "./metrics";

import type { RetrievalPrediction, RetrievalQuery } from "./types";

export type RetrievalFunction = (query: string) => string[] | Promise<string[]>;

export interface RetrievalEvaluationOptions {
  recallAt?: number[];
  precisionAt?: number[];
  hitRateAt?: number[];
  ndcgAt?: number[];
  includeMrr?: boolean;
}

export interface RetrievalEvaluationResult {
  queryCount: number;

  recall: Record<string, number>;
  precision: Record<string, number>;
  hitRate: Record<string, number>;
  ndcg: Record<string, number>;

  mrr: number;

  predictions: RetrievalPrediction[];
}

export class RetrievalEvaluator {
  async evaluate(
    dataset: RetrievalQuery[],
    retrieve: RetrievalFunction,
    options: RetrievalEvaluationOptions = {},
  ): Promise<RetrievalEvaluationResult> {
    const recallAt = options.recallAt ?? [1, 3, 5, 10];

    const precisionAt = options.precisionAt ?? [1, 3, 5, 10];

    const hitRateAt = options.hitRateAt ?? [1, 3, 5, 10];

    const ndcgAt = options.ndcgAt ?? [5, 10];

    const includeMrr = options.includeMrr ?? true;

    if (dataset.length === 0) {
      return {
        queryCount: 0,
        recall: {},
        precision: {},
        hitRate: {},
        ndcg: {},
        mrr: 0,
        predictions: [],
      };
    }

    const predictions: RetrievalPrediction[] = [];

    for (const example of dataset) {
      const retrievedChunkIds = await retrieve(example.query);

      predictions.push({
        queryId: example.id,
        retrievedChunkIds,
      });
    }

    const recall: Record<string, number> = {};

    for (const k of recallAt) {
      recall[String(k)] = average(
        dataset.map((example, index) =>
          recallAtK(
            predictions[index]!.retrievedChunkIds,
            example.relevantChunkIds,
            k,
          ),
        ),
      );
    }

    const precision: Record<string, number> = {};

    for (const k of precisionAt) {
      precision[String(k)] = average(
        dataset.map((example, index) =>
          precisionAtK(
            predictions[index]!.retrievedChunkIds,
            example.relevantChunkIds,
            k,
          ),
        ),
      );
    }

    const hitRate: Record<string, number> = {};

    for (const k of hitRateAt) {
      hitRate[String(k)] = average(
        dataset.map((example, index) =>
          hitRateAtK(
            predictions[index]!.retrievedChunkIds,
            example.relevantChunkIds,
            k,
          ),
        ),
      );
    }

    const ndcg: Record<string, number> = {};

    for (const k of ndcgAt) {
      ndcg[String(k)] = average(
        dataset.map((example, index) => {
          const relevance =
            example.relevance ??
            Object.fromEntries(
              example.relevantChunkIds.map((chunkId) => [chunkId, 1]),
            );

          return ndcgAtK(predictions[index]!.retrievedChunkIds, relevance, k);
        }),
      );
    }

    const mrr = includeMrr
      ? meanReciprocalRank(
          dataset.map((example, index) => ({
            retrievedChunkIds: predictions[index]!.retrievedChunkIds,
            relevantChunkIds: example.relevantChunkIds,
          })),
        )
      : 0;

    return {
      queryCount: dataset.length,
      recall,
      precision,
      hitRate,
      ndcg,
      mrr,
      predictions,
    };
  }
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
