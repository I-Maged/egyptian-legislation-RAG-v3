export interface ContextQuery {
  id: string;
  query: string;
  relevantChunkIds: string[];
}

export interface ContextPrediction {
  queryId: string;
  contextChunkIds: string[];
}

export interface ContextQueryResult {
  queryId: string;
  contextChunkIds: string[];
  relevantChunkIds: string[];

  relevantRetrievedChunkIds: string[];

  contextRecall: number;
  contextPrecision: number;
  contextHit: boolean;
}

export interface ContextEvaluationResult {
  queryCount: number;

  contextRecall: number;
  contextPrecision: number;
  contextHitRate: number;

  predictions: ContextPrediction[];
  perQuery: ContextQueryResult[];
}
