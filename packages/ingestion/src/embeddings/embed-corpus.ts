import type { CanonicalCorpus, EmbeddingArtifact } from "@egyptian-law/core";

import { validateEmbeddingVector } from "./provider";

export interface EmbedCorpusOptions {
  batch_size?: number;
}

export async function embedCorpus(
  corpus: CanonicalCorpus,
  provider: {
    readonly model: string;
    readonly dimensions: number;
    embed(texts: string[]): Promise<number[][]>;
  },
  options: EmbedCorpusOptions = {},
): Promise<EmbeddingArtifact> {
  const batchSize = options.batch_size ?? 32;

  if (!Number.isInteger(batchSize) || batchSize <= 0) {
    throw new Error("batch_size must be a positive integer.");
  }

  if (corpus.chunks.length === 0) {
    throw new Error("Cannot embed an empty corpus.");
  }

  const records = [];

  for (let i = 0; i < corpus.chunks.length; i += batchSize) {
    const batch = corpus.chunks.slice(i, i + batchSize);

    const texts = batch.map((chunk) => {
      if (!chunk.text_for_embedding.trim()) {
        throw new Error(`Chunk ${chunk.id} has empty text_for_embedding.`);
      }

      return chunk.text_for_embedding;
    });

    const vectors = await provider.embed(texts);

    if (vectors.length !== batch.length) {
      throw new Error(
        `Embedding provider returned ${vectors.length} vectors for ${batch.length} inputs.`,
      );
    }

    for (let j = 0; j < batch.length; j++) {
      const vector = vectors[j]!;

      validateEmbeddingVector(vector, provider.dimensions);

      records.push({
        chunk_id: batch[j]!.id,
        embedding: vector,
        model: provider.model,
        dimensions: provider.dimensions,
      });
    }
  }

  return {
    schema_version: "1.0",
    model: provider.model,
    dimensions: provider.dimensions,
    records,
  };
}
