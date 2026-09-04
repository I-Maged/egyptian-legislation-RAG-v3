import type { CanonicalCorpus, LawChunk } from "@egyptian-law/core";

import { cosineSimilarity } from "./cosine";

export interface EmbeddingRecord {
  chunk_id: string;
  embedding: number[];
}

export interface EmbeddingArtifact {
  schema_version: string;
  model: string;
  dimensions: number;
  records: EmbeddingRecord[];
}

export interface RetrievalOptions {
  topK?: number;
  minScore?: number;
}

export interface RetrievalResult {
  chunk: LawChunk;
  score: number;
}

type IndexedChunk = {
  chunk: LawChunk;
  embedding: number[];
};

export class InMemoryVectorRetriever {
  private readonly dimensions: number;
  private readonly chunksById: Map<string, IndexedChunk>;

  constructor(corpus: CanonicalCorpus, artifact: EmbeddingArtifact) {
    if (corpus.chunks.length === 0) {
      throw new Error("Cannot build a vector retriever from an empty corpus.");
    }

    if (artifact.records.length === 0) {
      throw new Error(
        "Cannot build a vector retriever from an empty embedding artifact.",
      );
    }

    if (!Number.isInteger(artifact.dimensions) || artifact.dimensions <= 0) {
      throw new Error("Embedding dimensions must be a positive integer.");
    }

    this.dimensions = artifact.dimensions;

    const chunksById = new Map<string, LawChunk>();

    for (const chunk of corpus.chunks) {
      if (chunksById.has(chunk.id)) {
        throw new Error(`Duplicate canonical chunk ID: ${chunk.id}`);
      }

      chunksById.set(chunk.id, chunk);
    }

    const embeddingsById = new Map<string, number[]>();

    for (const record of artifact.records) {
      if (embeddingsById.has(record.chunk_id)) {
        throw new Error(`Duplicate embedding chunk ID: ${record.chunk_id}`);
      }

      if (record.embedding.length !== this.dimensions) {
        throw new Error(
          `Embedding dimension mismatch for ${record.chunk_id}: ` +
            `${record.embedding.length} !== ${this.dimensions}.`,
        );
      }

      for (const value of record.embedding) {
        if (!Number.isFinite(value)) {
          throw new Error(
            `Embedding contains a non-finite value: ${record.chunk_id}`,
          );
        }
      }

      embeddingsById.set(record.chunk_id, record.embedding);
    }

    if (chunksById.size !== embeddingsById.size) {
      throw new Error(
        `Corpus/embedding count mismatch: ` +
          `${chunksById.size} chunks vs ${embeddingsById.size} embeddings.`,
      );
    }

    for (const chunkId of chunksById.keys()) {
      if (!embeddingsById.has(chunkId)) {
        throw new Error(`Missing embedding for canonical chunk: ${chunkId}`);
      }
    }

    for (const chunkId of embeddingsById.keys()) {
      if (!chunksById.has(chunkId)) {
        throw new Error(`Orphan embedding: ${chunkId}`);
      }
    }

    const indexed = new Map<string, IndexedChunk>();

    for (const [chunkId, chunk] of chunksById) {
      indexed.set(chunkId, {
        chunk,
        embedding: embeddingsById.get(chunkId)!,
      });
    }

    this.chunksById = indexed;
  }

  search(
    queryEmbedding: number[],
    options: RetrievalOptions = {},
  ): RetrievalResult[] {
    if (queryEmbedding.length !== this.dimensions) {
      throw new Error(
        `Query embedding dimension mismatch: ` +
          `${queryEmbedding.length} !== ${this.dimensions}.`,
      );
    }

    for (const value of queryEmbedding) {
      if (!Number.isFinite(value)) {
        throw new Error("Query embedding contains a non-finite value.");
      }
    }

    const topK = options.topK ?? 5;
    const minScore = options.minScore ?? -Infinity;

    if (!Number.isInteger(topK) || topK <= 0) {
      throw new Error("topK must be a positive integer.");
    }

    if (!Number.isFinite(minScore) && minScore !== -Infinity) {
      throw new Error("minScore must be a finite number.");
    }

    const results: RetrievalResult[] = [];

    for (const indexed of this.chunksById.values()) {
      const score = cosineSimilarity(queryEmbedding, indexed.embedding);

      if (score >= minScore) {
        results.push({
          chunk: indexed.chunk,
          score,
        });
      }
    }

    results.sort((a, b) => {
      const scoreDifference = b.score - a.score;

      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      /*
       * Deterministic tie-breaking.
       */
      return a.chunk.id.localeCompare(b.chunk.id);
    });

    return results.slice(0, topK);
  }
}
