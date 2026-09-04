import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../client";

export interface CreateLawInput {
  id: string;
  lawName: string;
  lawNumber?: string | null;
  year?: string | null;
  jurisdiction?: string;
  language?: string;
  sourceFile: string;
  parserVersion?: string | null;
  normalizationVersion?: string | null;
}

export interface CreateChunkInput {
  id: string;
  articleNumber: string;
  articleTitle?: string | null;
  text: string;
  textForEmbedding: string;
  sourcePageStart?: number | null;
  sourcePageEnd?: number | null;
  sourceOrder?: number | null;

  /**
   * Prisma JSON input.
   *
   * null means explicitly store JSON null.
   * undefined means do not provide the field on create/update.
   */
  hierarchy?: Prisma.InputJsonValue | null;

  parserVersion?: string | null;
  normalizationVersion?: string | null;
  ocrConfidence?: number | null;
}

export async function listLawDocuments() {
  return prisma.lawDocument.findMany({
    orderBy: [{ lawName: "asc" }, { year: "asc" }],
    include: {
      _count: {
        select: {
          chunks: true,
        },
      },
    },
  });
}

export async function getLawDocument(id: string) {
  return prisma.lawDocument.findUnique({
    where: { id },
    include: {
      chunks: {
        orderBy: {
          sourceOrder: "asc",
        },
        include: {
          embedding: {
            select: {
              model: true,
              dimensions: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });
}

export async function createLawDocument(input: CreateLawInput) {
  return prisma.lawDocument.create({
    data: {
      id: input.id,
      lawName: input.lawName,
      lawNumber: input.lawNumber ?? null,
      year: input.year ?? null,
      jurisdiction: input.jurisdiction ?? "EG",
      language: input.language ?? "ar",
      sourceFile: input.sourceFile,
      parserVersion: input.parserVersion ?? null,
      normalizationVersion: input.normalizationVersion ?? null,
    },
  });
}

export async function updateLawDocument(
  id: string,
  input: Omit<CreateLawInput, "id">,
) {
  return prisma.lawDocument.update({
    where: { id },
    data: {
      lawName: input.lawName,
      lawNumber: input.lawNumber ?? null,
      year: input.year ?? null,
      jurisdiction: input.jurisdiction ?? "EG",
      language: input.language ?? "ar",
      sourceFile: input.sourceFile,
      parserVersion: input.parserVersion ?? null,
      normalizationVersion: input.normalizationVersion ?? null,
    },
  });
}

export async function deleteLawDocument(id: string) {
  return prisma.lawDocument.delete({
    where: { id },
  });
}

export async function createLawChunk(
  documentId: string,
  input: CreateChunkInput,
) {
  return prisma.lawChunk.create({
    data: {
      id: input.id,
      documentId,

      articleNumber: input.articleNumber,
      articleTitle: input.articleTitle ?? null,

      text: input.text,
      textForEmbedding: input.textForEmbedding,

      sourcePageStart: input.sourcePageStart ?? null,
      sourcePageEnd: input.sourcePageEnd ?? null,
      sourceOrder: input.sourceOrder ?? null,

      ...(input.hierarchy !== undefined
        ? {
            hierarchy:
              input.hierarchy === null ? Prisma.JsonNull : input.hierarchy,
          }
        : {}),

      parserVersion: input.parserVersion ?? null,
      normalizationVersion: input.normalizationVersion ?? null,
      ocrConfidence: input.ocrConfidence ?? null,
    },
  });
}

export async function updateLawChunk(
  id: string,
  input: Partial<CreateChunkInput>,
) {
  return prisma.lawChunk.update({
    where: { id },
    data: {
      ...(input.articleNumber !== undefined && {
        articleNumber: input.articleNumber,
      }),

      ...(input.articleTitle !== undefined && {
        articleTitle: input.articleTitle,
      }),

      ...(input.text !== undefined && {
        text: input.text,
      }),

      ...(input.textForEmbedding !== undefined && {
        textForEmbedding: input.textForEmbedding,
      }),

      ...(input.sourcePageStart !== undefined && {
        sourcePageStart: input.sourcePageStart,
      }),

      ...(input.sourcePageEnd !== undefined && {
        sourcePageEnd: input.sourcePageEnd,
      }),

      ...(input.sourceOrder !== undefined && {
        sourceOrder: input.sourceOrder,
      }),

      ...(input.hierarchy !== undefined && {
        hierarchy: input.hierarchy === null ? Prisma.JsonNull : input.hierarchy,
      }),

      ...(input.parserVersion !== undefined && {
        parserVersion: input.parserVersion,
      }),

      ...(input.normalizationVersion !== undefined && {
        normalizationVersion: input.normalizationVersion,
      }),

      ...(input.ocrConfidence !== undefined && {
        ocrConfidence: input.ocrConfidence,
      }),
    },
  });
}

export async function deleteLawChunk(id: string) {
  return prisma.lawChunk.delete({
    where: { id },
  });
}
