import type { EmbeddingProvider } from "@egyptian-law/core";

export function validateEmbeddingVector(
  vector: number[],
  expectedDimensions: number,
): void {
  if (vector.length !== expectedDimensions) {
    throw new Error(
      `Invalid embedding dimensions: expected ${expectedDimensions}, received ${vector.length}.`,
    );
  }

  for (const value of vector) {
    if (!Number.isFinite(value)) {
      throw new Error("Embedding contains a non-finite value.");
    }
  }
}

export function createEmbeddingProvider(
  provider: EmbeddingProvider,
): EmbeddingProvider {
  if (!provider.model.trim()) {
    throw new Error("Embedding provider model must not be empty.");
  }

  if (!Number.isInteger(provider.dimensions) || provider.dimensions <= 0) {
    throw new Error(
      "Embedding provider dimensions must be a positive integer.",
    );
  }

  return provider;
}
