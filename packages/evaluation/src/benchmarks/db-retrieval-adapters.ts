import { getChunksByIds, searchSimilarEmbeddings } from "@egyptian-law/db";

import type { RetrievalFunction } from "../retrieval/evaluator";

import {
  BaselineReranker,
  type RerankCandidate,
  type RerankOptions,
} from "@egyptian-law/ingestion";

export interface DbRetrievalAdapterOptions {
  /**
   * Final number of chunk IDs returned.
   */
  topK: number;

  /**
   * Restrict retrieval to one law document.
   */
  lawDocumentId?: string;

  /**
   * Number of vector candidates retrieved before reranking.
   *
   * Example:
   *
   * topK = 5
   * rerankTopK = 20
   *
   * means:
   *
   * pgvector → 20 candidates
   * reranker → 5 final results
   */
  rerankTopK?: number;

  /**
   * Reranker configuration.
   */
  rerank?: RerankOptions;
}

export interface EmbeddingProviderLike {
  embed(texts: string[]): Promise<number[][]>;
}

/**
 * Creates a RetrievalFunction backed by PostgreSQL pgvector.
 */
export function createDbVectorRetriever(
  embeddingProvider: EmbeddingProviderLike,
  options: DbRetrievalAdapterOptions,
): RetrievalFunction {
  return async (query: string): Promise<string[]> => {
    const [queryEmbedding] = await embeddingProvider.embed([query]);

    if (!queryEmbedding) {
      throw new Error("Embedding provider returned no query embedding.");
    }

    const results = await searchSimilarEmbeddings({
      queryEmbedding,
      topK: options.topK,
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
 * Creates a RetrievalFunction backed by:
 *
 * PostgreSQL pgvector
 *        ↓
 * vector candidate pool
 *        ↓
 * getChunksByIds
 *        ↓
 * BaselineReranker
 *        ↓
 * final chunk IDs
 *
 * `topK` controls the final result size.
 *
 * `rerankTopK` controls how many vector candidates are
 * retrieved before reranking.
 */
export function createDbVectorRerankedRetriever(
  embeddingProvider: EmbeddingProviderLike,
  options: DbRetrievalAdapterOptions,
  rerankOptions?: RerankOptions,
): RetrievalFunction {
  const reranker = new BaselineReranker();

  return async (query: string): Promise<string[]> => {
    const [queryEmbedding] = await embeddingProvider.embed([query]);

    if (!queryEmbedding) {
      throw new Error("Embedding provider returned no query embedding.");
    }

    /*
     * Retrieve a larger candidate pool than the final K.
     *
     * Example:
     *
     * final K       = 5
     * rerankTopK    = 20
     *
     * pgvector     → 20
     * reranker     → 5
     */
    const candidateTopK = options.rerankTopK ?? options.topK;

    const vectorResults = await searchSimilarEmbeddings({
      queryEmbedding,

      topK: candidateTopK,

      ...(options.lawDocumentId !== undefined
        ? {
            lawDocumentId: options.lawDocumentId,
          }
        : {}),
    });

    if (vectorResults.length === 0) {
      return [];
    }

    const chunkIds = vectorResults.map((result) => result.chunkId);

    const chunks = await getChunksByIds(chunkIds);

    const chunksById = new Map(chunks.map((chunk) => [chunk.id, chunk]));

    /*
     * Every vector retrieval result should correspond
     * to a canonical LawChunk.
     */
    for (const chunkId of chunkIds) {
      if (!chunksById.has(chunkId)) {
        throw new Error(
          `Vector retrieval returned unknown chunk ID: ${chunkId}`,
        );
      }
    }

    const candidates: RerankCandidate[] = vectorResults.map((result) => {
      const chunk = chunksById.get(result.chunkId);

      if (!chunk) {
        throw new Error(
          `Vector retrieval returned unknown chunk ID: ${result.chunkId}`,
        );
      }

      return {
        chunk,

        /*
         * Baseline reranker uses the original retrieval
         * score as its retrieval signal.
         */
        score: result.score,

        /*
         * Keep the original vector similarity explicitly.
         */
        vectorScore: result.score,
      };
    });

    const effectiveRerankOptions: RerankOptions = {
      ...(options.rerank ?? {}),
      ...(rerankOptions ?? {}),

      /*
       * Adapter owns the final result size.
       */
      topK: options.topK,
    };

    const reranked = reranker.rerank(query, candidates, effectiveRerankOptions);

    return reranked.map((result) => result.chunk.id);
  };
}
