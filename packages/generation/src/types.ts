import type { LawChunk } from "@egyptian-law/core";

export interface GenerationCitation {
  citationId: string;
  chunkId: string;

  lawName: string;
  lawNumber: string | null;
  year: string | null;

  articleNumber: string;
  articleTitle: string | null;

  sourceFile: string;
  pageStart: number | null;
  pageEnd: number | null;
}

export interface GenerationRequest {
  query: string;
  chunks: LawChunk[];

  temperature?: number;
  maxTokens?: number;
}

export interface GenerationMetadata {
  model: string;
  contextChunkCount: number;
  citationCount: number;
  latencyMs: number;
}

export interface GenerationResponse {
  answer: string;
  citations: GenerationCitation[];
  metadata: GenerationMetadata;
}
