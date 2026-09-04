import { contextHit, contextPrecision, contextRecall } from "./metrics";

import type {
  ContextEvaluationResult,
  ContextPrediction,
  ContextQuery,
  ContextQueryResult,
} from "./types";

export type ContextFunction = (query: string) => string[] | Promise<string[]>;

export class ContextEvaluator {
  async evaluate(
    dataset: ContextQuery[],
    getContext: ContextFunction,
  ): Promise<ContextEvaluationResult> {
    if (dataset.length === 0) {
      return {
        queryCount: 0,
        contextRecall: 0,
        contextPrecision: 0,
        contextHitRate: 0,
        predictions: [],
        perQuery: [],
      };
    }

    const predictions: ContextPrediction[] = [];
    const perQuery: ContextQueryResult[] = [];

    for (const example of dataset) {
      const contextChunkIds = await getContext(example.query);

      const relevant = new Set(example.relevantChunkIds);

      const relevantRetrievedChunkIds = contextChunkIds.filter((id) =>
        relevant.has(id),
      );

      const queryResult: ContextQueryResult = {
        queryId: example.id,
        contextChunkIds,
        relevantChunkIds: example.relevantChunkIds,
        relevantRetrievedChunkIds,

        contextRecall: contextRecall(contextChunkIds, example.relevantChunkIds),

        contextPrecision: contextPrecision(
          contextChunkIds,
          example.relevantChunkIds,
        ),

        contextHit: contextHit(contextChunkIds, example.relevantChunkIds),
      };

      predictions.push({
        queryId: example.id,
        contextChunkIds,
      });

      perQuery.push(queryResult);
    }

    return {
      queryCount: dataset.length,

      contextRecall: average(perQuery.map((result) => result.contextRecall)),

      contextPrecision: average(
        perQuery.map((result) => result.contextPrecision),
      ),

      contextHitRate:
        perQuery.filter((result) => result.contextHit).length / perQuery.length,

      predictions,
      perQuery,
    };
  }
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
