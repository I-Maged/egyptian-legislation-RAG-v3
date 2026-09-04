import type { LawChunk } from "@egyptian-law/core";

import {
  searchSimilarEmbeddings,
  type VectorSearchInput,
} from "@egyptian-law/db";

export interface DbVectorRetrieverOptions {
  topK?: number;
  minScore?: number;
  lawDocumentId?: string;
}

export interface DbVectorRetrievalResult {
  chunk: LawChunk;
  score: number;
}

export interface ChunkLoader {
  getChunksByIds(chunkIds: string[]): Promise<LawChunk[]>;
}

export class PostgresVectorRetriever {
  private readonly chunkLoader: ChunkLoader;

  constructor(chunkLoader: ChunkLoader) {
    this.chunkLoader = chunkLoader;
  }

  async search(
    queryEmbedding: number[],
    options: DbVectorRetrieverOptions = {},
  ): Promise<DbVectorRetrievalResult[]> {
    const topK = options.topK ?? 5;
    const minScore = options.minScore ?? -Infinity;

    if (!Number.isInteger(topK) || topK <= 0) {
      throw new Error("topK must be a positive integer.");
    }

    if (!Number.isFinite(minScore) && minScore !== -Infinity) {
      throw new Error("minScore must be a finite number.");
    }

    const vectorSearchInput: VectorSearchInput = {
      queryEmbedding,
      topK,
      ...(options.lawDocumentId !== undefined
        ? { lawDocumentId: options.lawDocumentId }
        : {}),
    };

    const vectorResults = await searchSimilarEmbeddings(vectorSearchInput);

    const filteredResults = vectorResults.filter(
      (result) => result.score >= minScore,
    );

    if (filteredResults.length === 0) {
      return [];
    }

    const chunkIds = filteredResults.map((result) => result.chunkId);

    const chunks = await this.chunkLoader.getChunksByIds(chunkIds);

    const chunksById = new Map(chunks.map((chunk) => [chunk.id, chunk]));

    return filteredResults
      .map((result) => {
        const chunk = chunksById.get(result.chunkId);

        if (!chunk) {
          throw new Error(
            `Vector search returned unknown chunk ID: ${result.chunkId}`,
          );
        }

        return {
          chunk,
          score: result.score,
        };
      })
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }

        return a.chunk.id.localeCompare(b.chunk.id);
      });
  }
}
