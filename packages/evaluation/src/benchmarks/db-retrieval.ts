import type { LawChunk } from "@egyptian-law/core";
import type { BaselineReranker } from "@egyptian-law/ingestion";

import { getChunksByIds, searchSimilarEmbeddings } from "@egyptian-law/db";

import type { RetrievalFunction } from "../retrieval/evaluator";

export interface DbRetrievalOptions {
  lawDocumentId?: string;
  topK?: number;
}

export interface DbVectorRetrievalOptions extends DbRetrievalOptions {
  embed: (query: string) => Promise<number[]>;
}

export interface DbVectorRerankedRetrievalOptions extends DbVectorRetrievalOptions {
  reranker: BaselineReranker;

  /**
   * Number of vector candidates retrieved before reranking.
   */
  rerankTopK?: number;

  phraseWeight?: number;
  coverageWeight?: number;
  retrievalWeight?: number;
}

/**
 * PostgreSQL pgvector retrieval adapter.
 */
export function createDbVectorRetrievalFunction(
  options: DbVectorRetrievalOptions,
): RetrievalFunction {
  const topK = options.topK ?? 10;

  return async (query: string): Promise<string[]> => {
    const queryEmbedding = await options.embed(query);

    if (queryEmbedding.length === 0) {
      throw new Error("Embedding provider returned an empty embedding.");
    }

    const results = await searchSimilarEmbeddings({
      queryEmbedding,
      topK,

      ...(options.lawDocumentId !== undefined
        ? {
            lawDocumentId: options.lawDocumentId,
          }
        : {}),
    });

    return results.map((result) => result.chunkId);
  };
}

/**
 * Hydrates vector retrieval results into candidates
 * expected by the BaselineReranker.
 */
export async function hydrateVectorResults(
  results: Array<{
    chunkId: string;
    score: number;
  }>,
): Promise<
  Array<{
    chunk: LawChunk;
    score: number;
    vectorScore: number;
  }>
> {
  if (results.length === 0) {
    return [];
  }

  const chunkIds = results.map((result) => result.chunkId);

  const chunks = await getChunksByIds(chunkIds);

  const chunksById = new Map(chunks.map((chunk) => [chunk.id, chunk]));

  return results.map((result) => {
    const chunk = chunksById.get(result.chunkId);

    if (!chunk) {
      throw new Error(
        `Unable to hydrate vector retrieval chunk: ${result.chunkId}`,
      );
    }

    return {
      chunk,
      score: result.score,
      vectorScore: result.score,
    };
  });
}

/**
 * PostgreSQL pgvector retrieval followed by the
 * existing baseline reranker.
 *
 * Pipeline:
 *
 * pgvector
 *    ↓
 * candidate pool
 *    ↓
 * hydrate LawChunks
 *    ↓
 * BaselineReranker
 *    ↓
 * final chunk IDs
 */
export function createDbVectorRerankedRetrievalFunction(
  options: DbVectorRerankedRetrievalOptions,
): RetrievalFunction {
  const retrievalTopK = options.topK ?? 10;

  return async (query: string): Promise<string[]> => {
    const queryEmbedding = await options.embed(query);

    if (queryEmbedding.length === 0) {
      throw new Error("Embedding provider returned an empty embedding.");
    }

    /*
     * Retrieve more candidates than the final K
     * whenever rerankTopK is configured.
     */
    const candidateTopK = options.rerankTopK ?? retrievalTopK;

    const results = await searchSimilarEmbeddings({
      queryEmbedding,

      topK: candidateTopK,

      ...(options.lawDocumentId !== undefined
        ? {
            lawDocumentId: options.lawDocumentId,
          }
        : {}),
    });

    const candidates = await hydrateVectorResults(results);

    const reranked = options.reranker.rerank(query, candidates, {
      topK: retrievalTopK,

      ...(options.phraseWeight !== undefined
        ? {
            phraseWeight: options.phraseWeight,
          }
        : {}),

      ...(options.coverageWeight !== undefined
        ? {
            coverageWeight: options.coverageWeight,
          }
        : {}),

      ...(options.retrievalWeight !== undefined
        ? {
            retrievalWeight: options.retrievalWeight,
          }
        : {}),
    });

    return reranked.map((result) => result.chunk.id);
  };
}
