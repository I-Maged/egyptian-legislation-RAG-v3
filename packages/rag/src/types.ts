import type { LawChunk } from "@egyptian-law/core";

export interface RagRetrievalResult {
  chunk: LawChunk;

  vectorScore: number;
  rerankScore: number;
  retrievalScore: number;

  matchedTerms: number;
  termCoverage: number;
  exactPhraseMatch: boolean;
}

export interface RagRetriever {
  retrieve(
    query: string,
    options?: RagRetrievalOptions,
  ): Promise<RagRetrievalResult[]>;
}

export interface RagRetrievalOptions {
  topK?: number;
  candidateTopK?: number;
  lawDocumentId?: string;
}

export interface RagContextDocument {
  citationId: string;

  chunkId: string;

  lawName: string;
  lawNumber: string | null;
  year: string | null;

  articleNumber: string;
  articleTitle: string | null;

  hierarchy: string[];

  text: string;

  sourceFile: string;

  pageStart: number | null;
  pageEnd: number | null;

  vectorScore: number;
  rerankScore: number;
}

export interface RagContext {
  documents: RagContextDocument[];
  text: string;
}

export interface RagCitation {
  id: string;

  chunkId: string;

  lawName: string;
  lawNumber: string | null;
  year: string | null;

  articleNumber: string;
  articleTitle: string | null;

  text: string;

  sourceFile: string;

  pageStart: number | null;
  pageEnd: number | null;
}

export interface RagRequest {
  query: string;

  retrieval?: RagRetrievalOptions;

  systemInstruction?: string;
}

export interface RagResponse {
  answer: string;

  citations: RagCitation[];

  retrieved: RagRetrievalResult[];

  context: RagContext;

  generation: {
    model: string;
    durationMs: number;
  };
}
