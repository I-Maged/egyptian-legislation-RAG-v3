import { afterAll, describe, expect, it } from "vitest";

import { prisma } from "../client";
import { searchSimilarEmbeddings } from "./vector.repository";

describe("vector repository", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("retrieves the nearest embedding from pgvector", async () => {
    const source = await prisma.$queryRaw<
      Array<{
        chunkId: string;
        embedding: string;
      }>
    >`
      SELECT
        "chunk_id" AS "chunkId",
        "embedding"::text AS "embedding"
      FROM "law_chunk_embeddings"
      ORDER BY "chunk_id"
      LIMIT 1
    `;

    expect(source).toHaveLength(1);

    const sourceEmbedding = JSON.parse(
      source[0]!.embedding.replace(/^\[/, "[").replace(/\]$/, "]"),
    ) as number[];

    const results = await searchSimilarEmbeddings({
      queryEmbedding: sourceEmbedding,
      topK: 5,
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0]!.chunkId).toBe(source[0]!.chunkId);
    expect(results[0]!.score).toBeCloseTo(1, 5);
  });

  it("respects topK", async () => {
    const source = await prisma.$queryRaw<
      Array<{
        embedding: string;
      }>
    >`
      SELECT
        "embedding"::text AS "embedding"
      FROM "law_chunk_embeddings"
      LIMIT 1
    `;

    expect(source).toHaveLength(1);

    const embedding = JSON.parse(source[0]!.embedding) as number[];

    const results = await searchSimilarEmbeddings({
      queryEmbedding: embedding,
      topK: 3,
    });

    expect(results).toHaveLength(3);
  });

  it("filters by law document", async () => {
    const source = await prisma.$queryRaw<
      Array<{
        documentId: string;
        embedding: string;
      }>
    >`
      SELECT
        c."document_id" AS "documentId",
        e."embedding"::text AS "embedding"
      FROM "law_chunk_embeddings" e
      INNER JOIN "law_chunks" c
        ON c."id" = e."chunk_id"
      LIMIT 1
    `;

    expect(source).toHaveLength(1);

    const embedding = JSON.parse(source[0]!.embedding) as number[];

    const results = await searchSimilarEmbeddings({
      queryEmbedding: embedding,
      topK: 10,
      lawDocumentId: source[0]!.documentId,
    });

    expect(results.length).toBeGreaterThan(0);

    const rows = await prisma.$queryRaw<Array<{ documentId: string }>>`
      SELECT "document_id" AS "documentId"
      FROM "law_chunks"
      WHERE "id" = ANY(${results.map((result) => result.chunkId)})
    `;

    for (const row of rows) {
      expect(row.documentId).toBe(source[0]!.documentId);
    }
  });

  it("rejects an empty query embedding", async () => {
    await expect(
      searchSimilarEmbeddings({
        queryEmbedding: [],
        topK: 5,
      }),
    ).rejects.toThrow(/queryEmbedding must not be empty/i);
  });

  it("rejects an invalid topK", async () => {
    await expect(
      searchSimilarEmbeddings({
        queryEmbedding: [1],
        topK: 0,
      }),
    ).rejects.toThrow(/Invalid topK/i);
  });

  it("rejects non-finite embedding values", async () => {
    await expect(
      searchSimilarEmbeddings({
        queryEmbedding: [1, Number.NaN],
        topK: 5,
      }),
    ).rejects.toThrow(/non-finite/i);
  });
});
