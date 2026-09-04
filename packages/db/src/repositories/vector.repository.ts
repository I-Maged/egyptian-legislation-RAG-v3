import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../client";

export interface VectorSearchInput {
  queryEmbedding: number[];
  topK: number;
  lawDocumentId?: string;
}

export interface VectorSearchResult {
  chunkId: string;
  score: number;
}

export async function searchSimilarEmbeddings(
  input: VectorSearchInput,
): Promise<VectorSearchResult[]> {
  if (input.queryEmbedding.length === 0) {
    throw new Error("queryEmbedding must not be empty.");
  }

  if (!Number.isInteger(input.topK) || input.topK <= 0) {
    throw new Error(`Invalid topK: ${input.topK}`);
  }

  for (const value of input.queryEmbedding) {
    if (!Number.isFinite(value)) {
      throw new Error("queryEmbedding contains a non-finite value.");
    }
  }

  const vector = `[${input.queryEmbedding.join(",")}]`;

  if (input.lawDocumentId !== undefined) {
    return prisma.$queryRaw<VectorSearchResult[]>(
      Prisma.sql`
        SELECT
          e."chunk_id" AS "chunkId",
          1 - (e."embedding" <=> ${vector}::vector) AS "score"
        FROM "law_chunk_embeddings" e
        INNER JOIN "law_chunks" c
          ON c."id" = e."chunk_id"
        WHERE c."document_id" = ${input.lawDocumentId}
        ORDER BY e."embedding" <=> ${vector}::vector
        LIMIT ${input.topK}
      `,
    );
  }

  return prisma.$queryRaw<VectorSearchResult[]>(
    Prisma.sql`
      SELECT
        e."chunk_id" AS "chunkId",
        1 - (e."embedding" <=> ${vector}::vector) AS "score"
      FROM "law_chunk_embeddings" e
      ORDER BY e."embedding" <=> ${vector}::vector
      LIMIT ${input.topK}
    `,
  );
}
