export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) {
    throw new Error("Cosine similarity requires non-empty vectors.");
  }

  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} !== ${b.length}.`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    const valueA = a[i]!;
    const valueB = b[i]!;

    if (!Number.isFinite(valueA) || !Number.isFinite(valueB)) {
      throw new Error("Cosine similarity requires finite vector values.");
    }

    dotProduct += valueA * valueB;
    normA += valueA * valueA;
    normB += valueB * valueB;
  }

  if (normA === 0 || normB === 0) {
    throw new Error("Cosine similarity is undefined for zero vectors.");
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
