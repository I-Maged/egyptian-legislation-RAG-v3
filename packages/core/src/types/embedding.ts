export interface EmbeddingRecord {
  chunk_id: string;
  embedding: number[];
  model: string;
  dimensions: number;
}

export interface EmbeddingArtifact {
  schema_version: "1.0";

  model: string;
  dimensions: number;

  records: EmbeddingRecord[];
}

export interface EmbeddingProvider {
  readonly model: string;
  readonly dimensions: number;

  embed(texts: string[]): Promise<number[][]>;
}
