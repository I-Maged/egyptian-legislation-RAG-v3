export interface RetrievalQuery {
  id: string;
  query: string;

  /**
   * Chunk IDs that are considered relevant.
   *
   * For binary relevance evaluation.
   */
  relevantChunkIds: string[];

  /**
   * Optional graded relevance.
   *
   * Higher values mean more relevant.
   *
   * Example:
   * 3 = highly relevant
   * 2 = relevant
   * 1 = marginally relevant
   * 0 = irrelevant
   */
  relevance?: Record<string, number>;
}

export interface RetrievalPrediction {
  queryId: string;

  /**
   * Retrieved chunk IDs ordered from most relevant
   * to least relevant.
   */
  retrievedChunkIds: string[];
}

export interface RetrievalMetricResult {
  metric: string;
  value: number;
}
