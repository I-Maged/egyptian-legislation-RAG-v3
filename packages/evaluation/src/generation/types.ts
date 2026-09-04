export interface GenerationQuery {
  id: string;

  query: string;

  contextChunkIds: string[];

  context: string[];

  referenceAnswer: string;

  referenceChunkIds: string[];

  citedChunkIds?: string[];
}

export interface GenerationPrediction {
  queryId: string;

  answer: string;
}

export interface GenerationJudgeInput {
  query: string;

  answer: string;

  context: string[];

  contextChunkIds: string[];

  referenceAnswer: string;

  referenceChunkIds: string[];

  citedChunkIds?: string[];
}

export interface GenerationJudgeOutput {
  correctness: number;

  faithfulness: number;

  citationCorrectness: number;
}

export interface GenerationQueryResult {
  queryId: string;

  answer: string;

  correctness: number;

  faithfulness: number;

  citationCorrectness: number;

  passed: boolean;
}

export interface GenerationEvaluationResult {
  queryCount: number;

  correctness: number;

  faithfulness: number;

  citationCorrectness: number;

  predictions: GenerationPrediction[];

  perQuery: GenerationQueryResult[];
}
