import { EmbeddingArtifactSchema } from "../schemas/embedding";

import type { EmbeddingArtifact } from "../types/embedding";

export function validateEmbeddingArtifact(value: unknown): EmbeddingArtifact {
  const parsed = EmbeddingArtifactSchema.parse(value);

  const chunkIds = new Set<string>();

  for (const record of parsed.records) {
    if (record.dimensions !== parsed.dimensions) {
      throw new Error(
        `Embedding record ${record.chunk_id} dimensions ` +
          `${record.dimensions} do not match artifact dimensions ` +
          `${parsed.dimensions}.`,
      );
    }

    if (record.model !== parsed.model) {
      throw new Error(
        `Embedding record ${record.chunk_id} model ` +
          `${record.model} does not match artifact model ${parsed.model}.`,
      );
    }

    if (record.embedding.length !== record.dimensions) {
      throw new Error(
        `Embedding record ${record.chunk_id} has ` +
          `${record.embedding.length} values, expected ${record.dimensions}.`,
      );
    }

    if (chunkIds.has(record.chunk_id)) {
      throw new Error(`Duplicate embedding chunk ID: ${record.chunk_id}`);
    }

    chunkIds.add(record.chunk_id);
  }

  return parsed as EmbeddingArtifact;
}