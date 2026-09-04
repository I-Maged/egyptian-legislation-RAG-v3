import { prisma } from "../client";

export async function getCorpusAnalytics() {
  const [lawCount, chunkCount, embeddingCount, laws] = await Promise.all([
    prisma.lawDocument.count(),

    prisma.lawChunk.count(),

    prisma.lawChunkEmbedding.count(),

    prisma.lawDocument.findMany({
      select: {
        id: true,
        lawName: true,
        lawNumber: true,
        year: true,
        _count: {
          select: {
            chunks: true,
          },
        },
      },
      orderBy: {
        lawName: "asc",
      },
    }),
  ]);

  return {
    lawCount,
    chunkCount,
    embeddingCount,
    unembeddedChunks: chunkCount - embeddingCount,
    laws,
  };
}
