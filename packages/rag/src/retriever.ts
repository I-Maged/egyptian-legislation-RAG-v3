import type { PostgresVectorRetriever } from "@egyptian-law/ingestion";
import {
  BaselineReranker,
  type RerankCandidate,
} from "@egyptian-law/ingestion";
import { EmbeddingProviderLike } from "@egyptian-law/evaluation";

import type {
  RagRetriever,
  RagRetrievalOptions,
  RagRetrievalResult,
} from "./types";

export class DbRagRetriever implements RagRetriever {
  constructor(
    private readonly embeddingProvider: EmbeddingProviderLike,
    private readonly vectorRetriever: PostgresVectorRetriever,
    private readonly reranker: BaselineReranker = new BaselineReranker(),
  ) {}

  async retrieve(
    query: string,
    options: RagRetrievalOptions = {},
  ): Promise<RagRetrievalResult[]> {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      throw new Error("Retrieval query cannot be empty.");
    }

    const topK = options.topK ?? 5;
    const candidateTopK = options.candidateTopK ?? Math.max(topK * 4, topK);

    if (!Number.isInteger(topK) || topK <= 0) {
      throw new Error(`Invalid topK: ${topK}`);
    }

    if (!Number.isInteger(candidateTopK) || candidateTopK <= 0) {
      throw new Error(`Invalid candidateTopK: ${candidateTopK}`);
    }

    const [queryEmbedding] = await this.embeddingProvider.embed([
      normalizedQuery,
    ]);

    if (!queryEmbedding) {
      throw new Error("Embedding provider returned no query embedding.");
    }

    /*
     * Stage 1:
     * Retrieve a larger candidate set using vector similarity.
     *
     * No BM25.
     * No hybrid retrieval.
     */
    const vectorResults = await this.vectorRetriever.search(queryEmbedding, {
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

    /*
     * Stage 2:
     * Rerank the vector candidates using the existing
     * lightweight BaselineReranker.
     */
    const candidates: RerankCandidate[] = vectorResults.map((result) => ({
      chunk: result.chunk,
      score: result.score,
      vectorScore: result.score,
    }));

    const reranked = this.reranker.rerank(normalizedQuery, candidates, {
      topK,
    });

    /*
     * Stage 3:
     * Convert the reranked results into the RAG retrieval contract.
     */
    return reranked.map((result) => ({
      chunk: result.chunk,

      vectorScore: result.vectorScore,

      retrievalScore: result.retrievalScore,

      rerankScore: result.score,

      matchedTerms: result.matchedTerms,

      termCoverage: result.termCoverage,

      exactPhraseMatch: result.exactPhraseMatch,
    }));
  }
}
