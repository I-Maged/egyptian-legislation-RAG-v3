import type { CanonicalCorpus, LawChunk } from "@egyptian-law/core";

import { InMemoryBm25Retriever } from "./bm25-retriever";

import type { Bm25Options } from "./bm25";

import {
  InMemoryVectorRetriever,
  type EmbeddingArtifact,
} from "./vector-retriever";

export interface HybridSearchOptions {
  topK?: number;
  vectorTopK?: number;
  bm25TopK?: number;
  minScore?: number;
  vectorWeight?: number;
  bm25Weight?: number;
  rrfK?: number;
}

export interface HybridRetrievalResult {
  chunk: LawChunk;
  score: number;

  vectorScore: number | null;
  bm25Score: number | null;

  vectorRank: number | null;
  bm25Rank: number | null;
}

interface FusionEntry {
  chunk: LawChunk;
  score: number;

  vectorScore: number | null;
  bm25Score: number | null;

  vectorRank: number | null;
  bm25Rank: number | null;
}

const DEFAULT_RRF_K = 60;
const DEFAULT_VECTOR_WEIGHT = 1;
const DEFAULT_BM25_WEIGHT = 1;

export class HybridRetriever {
  private readonly vectorRetriever: InMemoryVectorRetriever;
  private readonly bm25Retriever: InMemoryBm25Retriever;

  constructor(
    corpus: CanonicalCorpus,
    embeddingArtifact: EmbeddingArtifact,
    bm25Options: Bm25Options = {},
  ) {
    this.vectorRetriever = new InMemoryVectorRetriever(
      corpus,
      embeddingArtifact,
    );

    this.bm25Retriever = new InMemoryBm25Retriever(corpus, bm25Options);
  }

  search(
    query: string,
    queryEmbedding: number[],
    options: HybridSearchOptions = {},
  ): HybridRetrievalResult[] {
    const topK = options.topK ?? 10;
    const vectorTopK = options.vectorTopK ?? topK;
    const bm25TopK = options.bm25TopK ?? topK;

    const vectorWeight = options.vectorWeight ?? DEFAULT_VECTOR_WEIGHT;

    const bm25Weight = options.bm25Weight ?? DEFAULT_BM25_WEIGHT;

    const rrfK = options.rrfK ?? DEFAULT_RRF_K;
    const minScore = options.minScore ?? 0;

    this.validateOptions({
      topK,
      vectorTopK,
      bm25TopK,
      vectorWeight,
      bm25Weight,
      rrfK,
      minScore,
    });

    const vectorResults = this.vectorRetriever.search(queryEmbedding, {
      topK: vectorTopK,
    });

    const bm25Results = this.bm25Retriever.search(query, {
      topK: bm25TopK,
    });

    const entries = new Map<string, FusionEntry>();

    vectorResults.forEach((result, index) => {
      const rank = index + 1;

      const existing = entries.get(result.chunk.id);

      const contribution = vectorWeight / (rrfK + rank);

      if (existing) {
        existing.score += contribution;
        existing.vectorScore = result.score;
        existing.vectorRank = rank;
      } else {
        entries.set(result.chunk.id, {
          chunk: result.chunk,
          score: contribution,
          vectorScore: result.score,
          bm25Score: null,
          vectorRank: rank,
          bm25Rank: null,
        });
      }
    });

    bm25Results.forEach((result, index) => {
      const rank = index + 1;

      const existing = entries.get(result.chunk.id);

      const contribution = bm25Weight / (rrfK + rank);

      if (existing) {
        existing.score += contribution;
        existing.bm25Score = result.score;
        existing.bm25Rank = rank;
      } else {
        entries.set(result.chunk.id, {
          chunk: result.chunk,
          score: contribution,
          vectorScore: null,
          bm25Score: result.score,
          vectorRank: null,
          bm25Rank: rank,
        });
      }
    });

    return [...entries.values()]
      .filter((result) => result.score >= minScore)
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }

        return a.chunk.id.localeCompare(b.chunk.id);
      })
      .slice(0, topK);
  }

  private validateOptions(options: {
    topK: number;
    vectorTopK: number;
    bm25TopK: number;
    vectorWeight: number;
    bm25Weight: number;
    rrfK: number;
    minScore: number;
  }): void {
    const {
      topK,
      vectorTopK,
      bm25TopK,
      vectorWeight,
      bm25Weight,
      rrfK,
      minScore,
    } = options;

    if (!Number.isInteger(topK) || topK <= 0) {
      throw new Error(`Invalid topK: ${topK}`);
    }

    if (!Number.isInteger(vectorTopK) || vectorTopK <= 0) {
      throw new Error(`Invalid vectorTopK: ${vectorTopK}`);
    }

    if (!Number.isInteger(bm25TopK) || bm25TopK <= 0) {
      throw new Error(`Invalid bm25TopK: ${bm25TopK}`);
    }

    if (!Number.isFinite(vectorWeight) || vectorWeight < 0) {
      throw new Error(`Invalid vectorWeight: ${vectorWeight}`);
    }

    if (!Number.isFinite(bm25Weight) || bm25Weight < 0) {
      throw new Error(`Invalid bm25Weight: ${bm25Weight}`);
    }

    if (vectorWeight === 0 && bm25Weight === 0) {
      throw new Error(
        "At least one hybrid retrieval weight must be greater than zero.",
      );
    }

    if (!Number.isFinite(rrfK) || rrfK <= 0) {
      throw new Error(`Invalid rrfK: ${rrfK}`);
    }

    if (!Number.isFinite(minScore) || minScore < 0) {
      throw new Error(`Invalid minScore: ${minScore}`);
    }
  }
}
