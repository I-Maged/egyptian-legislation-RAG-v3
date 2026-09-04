import type { EmbeddingArtifact } from "@egyptian-law/core";
import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../client";

export interface UpsertEmbeddingInput {
  chunkId: string;
  model: string;
  dimensions: number;
  embedding: number[];
}

export async function upsertEmbedding(
  input: UpsertEmbeddingInput,
): Promise<void> {
  if (input.embedding.length !== input.dimensions) {
    throw new Error(
      `Embedding dimension mismatch for ${input.chunkId}: ` +
        `expected ${input.dimensions}, got ${input.embedding.length}.`,
    );
  }

  const vector = `[${input.embedding.join(",")}]`;

  await prisma.$executeRaw(
    Prisma.sql`
      INSERT INTO "law_chunk_embeddings"
        ("chunk_id", "model", "dimensions", "embedding")
      VALUES
        (${input.chunkId}, ${input.model}, ${input.dimensions}, ${vector}::vector)
      ON CONFLICT ("chunk_id")
      DO UPDATE SET
        "model" = EXCLUDED."model",
        "dimensions" = EXCLUDED."dimensions",
        "embedding" = EXCLUDED."embedding"
    `,
  );
}

export async function upsertEmbeddings(
  artifact: EmbeddingArtifact,
): Promise<number> {
  if (artifact.records.length === 0) {
    return 0;
  }

  for (const record of artifact.records) {
    if (record.dimensions !== artifact.dimensions) {
      throw new Error(
        `Embedding dimension mismatch for ${record.chunk_id}: ` +
          `artifact expects ${artifact.dimensions}, ` +
          `record has ${record.dimensions}.`,
      );
    }

    if (record.embedding.length !== artifact.dimensions) {
      throw new Error(
        `Invalid embedding length for ${record.chunk_id}: ` +
          `expected ${artifact.dimensions}, got ${record.embedding.length}.`,
      );
    }

    await upsertEmbedding({
      chunkId: record.chunk_id,
      model: record.model,
      dimensions: record.dimensions,
      embedding: record.embedding,
    });
  }

  return artifact.records.length;
}

/**
 * Replaces the active vector index while preserving law documents/chunks,
 * conversations, citations, and other application data.
 *
 * Stale chunks remain in the database for historical references, but they no
 * longer participate in vector retrieval because their embeddings are removed.
 */
export async function replaceEmbeddingIndex(
  artifacts: EmbeddingArtifact[],
): Promise<number> {
  if (artifacts.length === 0) {
    throw new Error("At least one embedding artifact is required.");
  }

  const model = artifacts[0]!.model;
  const dimensions = artifacts[0]!.dimensions;
  const chunkIds = new Set<string>();

  for (const artifact of artifacts) {
    if (artifact.model !== model || artifact.dimensions !== dimensions) {
      throw new Error("All embedding artifacts must use the same model and dimensions.");
    }

    for (const record of artifact.records) {
      if (record.model !== model || record.dimensions !== dimensions) {
        throw new Error(
          `Embedding record ${record.chunk_id} does not match the index model/dimensions.`,
        );
      }

      if (record.embedding.length !== dimensions) {
        throw new Error(
          `Invalid embedding length for ${record.chunk_id}: expected ${dimensions}, got ${record.embedding.length}.`,
        );
      }

      if (chunkIds.has(record.chunk_id)) {
        throw new Error(`Duplicate embedding chunk ID across artifacts: ${record.chunk_id}`);
      }

      chunkIds.add(record.chunk_id);
    }
  }

  const databaseChunkIds = [...chunkIds];

  await prisma.$transaction(
    async (tx) => {
      // Verify every target FK before deleting the current index. If this
      // fails, the transaction aborts and the existing embedding index stays
      // intact.
      const rows = await tx.$queryRaw<Array<{ id: string }>>(
        Prisma.sql`
          SELECT "id"
          FROM "law_chunks"
          WHERE "id" IN (${Prisma.join([...databaseChunkIds])})
        `,
      );

      const existingIds = new Set(rows.map((row) => row.id));
      const missingIds = [...databaseChunkIds].filter(
        (id) => !existingIds.has(id),
      );

      if (missingIds.length > 0) {
        throw new Error(
          `Cannot rebuild embedding index: ${missingIds.length} target chunks do not exist in the database: ${missingIds.join(", ")}`,
        );
      }

      await tx.$executeRaw(Prisma.sql`DELETE FROM "law_chunk_embeddings"`);

      for (const artifact of artifacts) {
        for (const record of artifact.records) {
          const databaseChunkId = record.chunk_id;
          const vector = `[${record.embedding.join(",")}]`;

          await tx.$executeRaw(
            Prisma.sql`
              INSERT INTO "law_chunk_embeddings"
                ("chunk_id", "model", "dimensions", "embedding")
              VALUES
                (${databaseChunkId}, ${record.model}, ${record.dimensions}, ${vector}::vector)
            `,
          );
        }
      }
    },
    {
      maxWait: 10_000,
      timeout: 120_000,
    },
  );

  return chunkIds.size;
}
