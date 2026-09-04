import type {
  RetrievalEvaluationOptions,
  RetrievalEvaluationResult,
  RetrievalFunction,
} from "../retrieval/evaluator";

import { RetrievalEvaluator } from "../retrieval/evaluator";

import type { RetrievalGoldDataset } from "../datasets/retrieval-dataset";

export interface RetrievalBenchmarkSystem {
  name: string;
  retrieve: RetrievalFunction;
}

export interface RetrievalBenchmarkOptions extends RetrievalEvaluationOptions {
  systems: RetrievalBenchmarkSystem[];
}

export interface RetrievalBenchmarkSystemResult {
  name: string;
  result: RetrievalEvaluationResult;
}

export interface RetrievalBenchmarkResult {
  datasetName: string;
  queryCount: number;
  systems: RetrievalBenchmarkSystemResult[];
}

export async function runRetrievalBenchmark(
  dataset: RetrievalGoldDataset,
  options: RetrievalBenchmarkOptions,
): Promise<RetrievalBenchmarkResult> {
  const evaluator = new RetrievalEvaluator();

  const systems: RetrievalBenchmarkSystemResult[] = [];

  for (const system of options.systems) {
    const result = await evaluator.evaluate(
      dataset.items,
      system.retrieve,
      options,
    );

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
