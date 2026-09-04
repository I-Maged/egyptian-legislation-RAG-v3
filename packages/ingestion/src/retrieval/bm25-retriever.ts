import type { CanonicalCorpus, LawChunk } from "@egyptian-law/core";

import {
  createBm25Index,
  searchBm25,
  type Bm25Index,
  type Bm25Options,
} from "./bm25";

export interface Bm25SearchOptions {
  topK?: number;
  minScore?: number;
}

export interface Bm25RetrievalResult {
  chunk: LawChunk;
  score: number;
}

export class InMemoryBm25Retriever {
  private readonly corpus: CanonicalCorpus;
  private readonly index: Bm25Index;
  private readonly chunksById: Map<string, LawChunk>;

  constructor(corpus: CanonicalCorpus, options: Bm25Options = {}) {
    if (corpus.chunks.length === 0) {
      throw new Error("Cannot create BM25 retriever from empty corpus.");
    }

    this.corpus = corpus;

    this.chunksById = new Map();

    for (const chunk of corpus.chunks) {
      if (this.chunksById.has(chunk.id)) {
        throw new Error(`Duplicate chunk ID: ${chunk.id}`);
      }

      this.chunksById.set(chunk.id, chunk);
    }

    this.index = createBm25Index(
      corpus.chunks.map((chunk) => ({
        id: chunk.id,
        text: chunk.text_for_embedding,
      })),
      options,
    );
  }

  search(
    query: string,
    options: Bm25SearchOptions = {},
  ): Bm25RetrievalResult[] {
    const topK = options.topK ?? this.corpus.chunks.length;
    const minScore = options.minScore ?? 0;

    if (!Number.isInteger(topK) || topK <= 0) {
      throw new Error(`Invalid topK: ${topK}`);
    }

    if (!Number.isFinite(minScore) || minScore < 0) {
      throw new Error(`Invalid minScore: ${minScore}`);
    }

    if (query.trim().length === 0) {
      return [];
    }

    const results = searchBm25(this.index, query);

    return results
      .filter((result) => result.score >= minScore)
      .slice(0, topK)
      .map((result) => {
        const chunk = this.chunksById.get(result.id);

        if (!chunk) {
          throw new Error(`BM25 index contains unknown chunk ID: ${result.id}`);
        }

        return {
          chunk,
          score: result.score,
        };
      });
  }
}
