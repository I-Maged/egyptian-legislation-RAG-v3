import type { EmbeddingArtifact, EmbeddingProvider } from "@egyptian-law/core";

export interface EmbeddingInput {
  chunk_id: string;
  text: string;
}

export interface EmbedCorpusOptions {
  provider: EmbeddingProvider;
  batch_size?: number;
}

export type { EmbeddingArtifact };
