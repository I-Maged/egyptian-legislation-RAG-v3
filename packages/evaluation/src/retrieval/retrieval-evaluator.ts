import type {
  RetrievalGoldDataset,
  RetrievalGoldItem,
} from "../datasets/retrieval-dataset";

export interface RetrievedChunk {
  chunkId: string;
  score?: number;
}

export interface RetrievalEvaluatorOptions {
  ks?: number[];
}

export interface RetrievalMetrics {
  recall: Record<number, number>;
  precision: Record<number, number>;
  hitRate: Record<number, number>;
  mrr: Record<number, number>;
  ndcg: Record<number, number>;
}

export interface RetrievalEvaluationResult {
  dataset: string;
  queryCount: number;
  metrics: RetrievalMetrics;
}

export type RetrievalFunction = (
  query: string,
) => RetrievedChunk[] | Promise<RetrievedChunk[]>;

function validateKValues(ks: number[]): void {
  if (ks.length === 0) {
    throw new Error("At least one evaluation K value is required.");
  }

  const seen = new Set<number>();

  for (const k of ks) {
    if (!Number.isInteger(k) || k <= 0) {
      throw new Error(`Invalid evaluation K: ${k}`);
    }

    if (seen.has(k)) {
      throw new Error(`Duplicate evaluation K: ${k}`);
    }

    seen.add(k);
  }
}

function getRelevantSet(item: RetrievalGoldItem): Set<string> {
  return new Set(item.relevantChunkIds);
}

function calculateRecallAtK(
  retrievedIds: string[],
  relevantIds: Set<string>,
  k: number,
): number {
  if (relevantIds.size === 0) {
    return 0;
  }

  const retrieved = new Set(retrievedIds.slice(0, k));

  let relevantRetrieved = 0;

  for (const chunkId of retrieved) {
    if (relevantIds.has(chunkId)) {
      relevantRetrieved++;
    }
  }

  return relevantRetrieved / relevantIds.size;
}

function calculatePrecisionAtK(
  retrievedIds: string[],
  relevantIds: Set<string>,
  k: number,
): number {
  const topK = retrievedIds.slice(0, k);

  if (topK.length === 0) {
    return 0;
  }

  let relevantRetrieved = 0;

  for (const chunkId of topK) {
    if (relevantIds.has(chunkId)) {
      relevantRetrieved++;
    }
  }

  return relevantRetrieved / topK.length;
}

function calculateHitRateAtK(
  retrievedIds: string[],
  relevantIds: Set<string>,
  k: number,
): number {
  return retrievedIds.slice(0, k).some((chunkId) => relevantIds.has(chunkId))
    ? 1
    : 0;
}

function calculateReciprocalRankAtK(
  retrievedIds: string[],
  relevantIds: Set<string>,
  k: number,
): number {
  const topK = retrievedIds.slice(0, k);

  for (const [index, chunkId] of topK.entries()) {
    if (relevantIds.has(chunkId)) {
      return 1 / (index + 1);
    }
  }

  return 0;
}

function getRelevanceScore(item: RetrievalGoldItem, chunkId: string): number {
  if (!item.relevance) {
    return item.relevantChunkIds.includes(chunkId) ? 1 : 0;
  }

  return item.relevance[chunkId] ?? 0;
}

function calculateNdcgAtK(
  item: RetrievalGoldItem,
  retrievedIds: string[],
  k: number,
): number {
  const topK = retrievedIds.slice(0, k);

  if (item.relevantChunkIds.length === 0) {
    return 0;
  }

  /*
   * If graded relevance is not supplied, binary relevance is used:
   * relevant = 1, non-relevant = 0.
   */
  const dcg = topK.reduce((sum, chunkId, index) => {
    const relevance = getRelevanceScore(item, chunkId);

    return sum + (2 ** relevance - 1) / Math.log2(index + 2);
  }, 0);

  /*
   * Build the ideal ranking from all known relevant chunks.
   */
  const idealScores = item.relevantChunkIds
    .map((chunkId) => getRelevanceScore(item, chunkId))
    .sort((a, b) => b - a)
    .slice(0, k);

  const idcg = idealScores.reduce((sum, relevance, index) => {
    return sum + (2 ** relevance - 1) / Math.log2(index + 2);
  }, 0);

  if (idcg === 0) {
    return 0;
  }

  return dcg / idcg;
}

export class RetrievalEvaluator {
  private readonly ks: number[];

  constructor(options: RetrievalEvaluatorOptions = {}) {
    this.ks = options.ks ?? [1, 3, 5, 10];

    validateKValues(this.ks);
  }

  async evaluate(
    dataset: RetrievalGoldDataset,
    retrieve: RetrievalFunction,
  ): Promise<RetrievalEvaluationResult> {
    if (dataset.items.length === 0) {
      throw new Error("Cannot evaluate an empty retrieval dataset.");
    }

    const recallSums = new Map<number, number>();
    const precisionSums = new Map<number, number>();
    const hitRateSums = new Map<number, number>();
    const mrrSums = new Map<number, number>();
    const ndcgSums = new Map<number, number>();

    for (const k of this.ks) {
      recallSums.set(k, 0);
      precisionSums.set(k, 0);
      hitRateSums.set(k, 0);
      mrrSums.set(k, 0);
      ndcgSums.set(k, 0);
    }

    for (const item of dataset.items) {
      const results = await retrieve(item.query);

      const retrievedIds = results.map((result) => result.chunkId);

      const relevantIds = getRelevantSet(item);

      for (const k of this.ks) {
        recallSums.set(
          k,
          recallSums.get(k)! + calculateRecallAtK(retrievedIds, relevantIds, k),
        );

        precisionSums.set(
          k,
          precisionSums.get(k)! +
            calculatePrecisionAtK(retrievedIds, relevantIds, k),
        );

        hitRateSums.set(
          k,
          hitRateSums.get(k)! +
            calculateHitRateAtK(retrievedIds, relevantIds, k),
        );

        mrrSums.set(
          k,
          mrrSums.get(k)! +
            calculateReciprocalRankAtK(retrievedIds, relevantIds, k),
        );

        ndcgSums.set(
          k,
          ndcgSums.get(k)! + calculateNdcgAtK(item, retrievedIds, k),
        );
      }
    }

    const queryCount = dataset.items.length;

    const average = (values: Map<number, number>): Record<number, number> => {
      return Object.fromEntries(
        this.ks.map((k) => [k, values.get(k)! / queryCount]),
      );
    };

    return {
      dataset: dataset.name,
      queryCount,
      metrics: {
        recall: average(recallSums),
        precision: average(precisionSums),
        hitRate: average(hitRateSums),
        mrr: average(mrrSums),
        ndcg: average(ndcgSums),
      },
    };
  }
}
