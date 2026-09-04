export interface RagasEvaluationRecord {
  id: string;
  user_input: string;
  response: string;

  retrieved_contexts: string[];
  retrieved_context_ids: string[];

  reference_context_ids: string[];
  reference_contexts: string[];

  citations: Array<{
    id: string;
    chunkId: string;
    articleNumber: string;
  }>;

  generation: {
    model: string;
    durationMs: number;
  };
}

export interface RagasEvaluationDataset {
  schema_version: "1.0";
  evaluator: "ragas";
  dataset_name: string;
  language: "ar";
  jurisdiction: "EG";
  metrics: [
    "faithfulness",
    "answer_relevancy",
    "context_precision",
    "context_relevance",
  ];
  records: RagasEvaluationRecord[];
}
