/**
 * Calculate Recall@K.
 *
 * Recall@K =
 *
 *   relevant retrieved in top K
 *   ---------------------------
 *       total relevant
 *
 * Returns 0 when there are no relevant documents.
 */
export function recallAtK(
  retrievedChunkIds: string[],
  relevantChunkIds: string[],
  k: number,
): number {
  validateK(k);

  if (relevantChunkIds.length === 0) {
    return 0;
  }

  const relevant = new Set(relevantChunkIds);
  const retrieved = retrievedChunkIds.slice(0, k);

  const matched = new Set(retrieved.filter((id) => relevant.has(id)));

  return matched.size / relevant.size;
}

/**
 * Calculate Mean Reciprocal Rank for a single query.
 *
 * MRR for one query is:
 *
 *     1 / rank_of_first_relevant_result
 *
 * Returns 0 when no relevant result is retrieved.
 */
export function reciprocalRank(
  retrievedChunkIds: string[],
  relevantChunkIds: string[],
): number {
  if (relevantChunkIds.length === 0) {
    return 0;
  }

  const relevant = new Set(relevantChunkIds);

  for (let index = 0; index < retrievedChunkIds.length; index++) {
    if (relevant.has(retrievedChunkIds[index]!)) {
      return 1 / (index + 1);
    }
  }

  return 0;
}

/**
 * Calculate Mean Reciprocal Rank across queries.
 */
export function meanReciprocalRank(
  predictions: Array<{
    retrievedChunkIds: string[];
    relevantChunkIds: string[];
  }>,
): number {
  if (predictions.length === 0) {
    return 0;
  }

  const total = predictions.reduce(
    (sum, prediction) =>
      sum +
      reciprocalRank(prediction.retrievedChunkIds, prediction.relevantChunkIds),
    0,
  );

  return total / predictions.length;
}

/**
 * Calculate DCG using graded relevance.
 *
 * DCG@K =
 *
 * relevance_1 +
 * relevance_2 / log2(3) +
 * relevance_3 / log2(4) + ...
 */
export function dcgAtK(
  retrievedChunkIds: string[],
  relevance: Record<string, number>,
  k: number,
): number {
  validateK(k);

  return retrievedChunkIds.slice(0, k).reduce((sum, chunkId, index) => {
    const score = relevance[chunkId] ?? 0;

    return sum + score / Math.log2(index + 2);
  }, 0);
}

/**
 * Calculate ideal DCG@K.
 *
 * The ideal ranking places the highest-relevance
 * documents first.
 */
export function idealDcgAtK(
  relevance: Record<string, number>,
  k: number,
): number {
  validateK(k);

  const idealRanking = Object.entries(relevance)
    .sort(([, a], [, b]) => b - a)
    .map(([chunkId]) => chunkId);

  return dcgAtK(idealRanking, relevance, k);
}

/**
 * Calculate normalized Discounted Cumulative Gain.
 *
 * nDCG = DCG / ideal DCG
 *
 * Returns 0 when the ideal DCG is zero.
 */
export function ndcgAtK(
  retrievedChunkIds: string[],
  relevance: Record<string, number>,
  k: number,
): number {
  const dcg = dcgAtK(retrievedChunkIds, relevance, k);

  const idealDcg = idealDcgAtK(relevance, k);

  if (idealDcg === 0) {
    return 0;
  }

  return dcg / idealDcg;
}

/**
 * Calculate Precision@K.
 *
 * Although our main focus is recall, precision is
 * useful when deciding how many chunks to pass to
 * the reranker/generator.
 */
export function precisionAtK(
  retrievedChunkIds: string[],
  relevantChunkIds: string[],
  k: number,
): number {
  validateK(k);

  const relevant = new Set(relevantChunkIds);
  const retrieved = retrievedChunkIds.slice(0, k);

  if (retrieved.length === 0) {
    return 0;
  }

  const matched = new Set(retrieved.filter((id) => relevant.has(id)));

  return matched.size / retrieved.length;
}

function validateK(k: number): void {
  if (!Number.isInteger(k) || k <= 0) {
    throw new Error(`Invalid k: ${k}`);
  }
}
export function hitRateAtK(
  retrievedChunkIds: string[],
  relevantChunkIds: string[],
  k: number,
): number {
  if (k <= 0) {
    return 0;
  }

  const relevant = new Set(relevantChunkIds);

  return retrievedChunkIds.slice(0, k).some((chunkId) => relevant.has(chunkId))
    ? 1
    : 0;
}
