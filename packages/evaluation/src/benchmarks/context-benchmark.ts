import type { RetrievalEvaluationResult } from "../retrieval/evaluator";
import { ContextEvaluator } from "../context/evaluator";

import type { RetrievalGoldDataset } from "../datasets/retrieval-dataset";
import type { ContextEvaluationResult, ContextQuery } from "../context/types";

export interface ContextBenchmarkSystem {
  name: string;
  retrievalResult: RetrievalEvaluationResult;
}

export interface ContextBenchmarkOptions {
  systems: ContextBenchmarkSystem[];
}

export interface ContextBenchmarkSystemResult {
  name: string;
  result: ContextEvaluationResult;
}

export interface ContextBenchmarkResult {
  datasetName: string;
  queryCount: number;
  systems: ContextBenchmarkSystemResult[];
}

/**
 * Evaluates the context returned by already-completed retrieval runs.
 *
 * IMPORTANT:
 * This does NOT execute retrieval again.
 * It reuses RetrievalEvaluationResult.predictions.
 */
export async function runContextBenchmark(
  dataset: RetrievalGoldDataset,
  options: ContextBenchmarkOptions,
): Promise<ContextBenchmarkResult> {
  const evaluator = new ContextEvaluator();

  const contextDataset: ContextQuery[] = dataset.items.map((item) => ({
    id: item.id,
    query: item.query,
    relevantChunkIds: item.relevantChunkIds,
  }));

  const systems: ContextBenchmarkSystemResult[] = [];

  for (const system of options.systems) {
    const predictionByQueryId = new Map(
      system.retrievalResult.predictions.map((prediction) => [
        prediction.queryId,
        prediction.retrievedChunkIds,
      ]),
    );

    const result = await evaluator.evaluate(contextDataset, async (query) => {
      const item = contextDataset.find(
        (contextQuery) => contextQuery.query === query,
      );

      if (!item) {
        throw new Error(
          `Missing context query for retrieval benchmark query: ${query}`,
        );
      }

      return predictionByQueryId.get(item.id) ?? [];
    });

    systems.push({
      name: system.name,
      result,
    });
  }

  return {
    datasetName: dataset.name,
    queryCount: dataset.items.length,
    systems,
  };
}
