import type {
  CanonicalCorpus,
  LawChunk,
  LawHierarchyNode,
} from "@egyptian-law/core";

import { Prisma } from "../../generated/prisma/client";

import { prisma } from "../client";

export async function upsertCorpus(corpus: CanonicalCorpus): Promise<{
  documentId: string;
  chunksInserted: number;
}> {
  const document = corpus.document;

  return prisma.$transaction(
    async (tx) => {
      await tx.lawDocument.upsert({
        where: {
          id: document.id,
        },

        create: {
          id: document.id,
          lawName: document.law_name,
          lawNumber: document.law_number,
          year: document.year,
          jurisdiction: document.jurisdiction,
          language: document.language,
          sourceFile: document.source_file,
          parserVersion: document.metadata.parser_version,
          normalizationVersion: document.metadata.normalization_version,
        },

        update: {
          lawName: document.law_name,
          lawNumber: document.law_number,
          year: document.year,
          jurisdiction: document.jurisdiction,
          language: document.language,
          sourceFile: document.source_file,
          parserVersion: document.metadata.parser_version,
          normalizationVersion: document.metadata.normalization_version,
        },
      });

      for (const chunk of corpus.chunks) {
        await tx.lawChunk.upsert({
          where: {
            documentId_articleNumber: {
              documentId: document.id,
              articleNumber: chunk.article_number,
            },
          },

          create: {
            id: chunk.id,
            documentId: document.id,

            articleNumber: chunk.article_number,
            articleTitle: chunk.article_title,

            text: chunk.text,
            textForEmbedding: chunk.text_for_embedding,

            sourcePageStart: chunk.provenance.page_start,
            sourcePageEnd: chunk.provenance.page_end,

            sourceOrder: chunk.source_order,

            hierarchy: chunk.hierarchy,

            parserVersion: chunk.metadata.parser_version,
            normalizationVersion: chunk.metadata.normalization_version,
            ocrConfidence: chunk.metadata.ocr_confidence,
          },

          update: {
            // The canonical chunk ID may change when the corpus is re-canonicalized.
            // Match the existing row by its stable legal identity (document + article)
            // and migrate the primary key to the current canonical chunk ID. The DB
            // schema uses ON UPDATE CASCADE for chunk foreign keys, so existing
            // RagCitation references remain valid.
            id: chunk.id,
            documentId: document.id,

            articleNumber: chunk.article_number,
            articleTitle: chunk.article_title,

            text: chunk.text,
            textForEmbedding: chunk.text_for_embedding,

            sourcePageStart: chunk.provenance.page_start,
            sourcePageEnd: chunk.provenance.page_end,

            sourceOrder: chunk.source_order,

            hierarchy: chunk.hierarchy,

            parserVersion: chunk.metadata.parser_version,
            normalizationVersion: chunk.metadata.normalization_version,
            ocrConfidence: chunk.metadata.ocr_confidence,
          },
        });
      }

      return {
        documentId: document.id,
        chunksInserted: corpus.chunks.length,
      };
    },
    {
      maxWait: 10_000,
      timeout: 60_000,
    },
  );
}

function parseHierarchy(value: Prisma.JsonValue | null): LawHierarchyNode[] {
  if (value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error("Invalid law chunk hierarchy: expected an array.");
  }

  return value as unknown as LawHierarchyNode[];
}

export async function getChunksByIds(chunkIds: string[]): Promise<LawChunk[]> {
  if (chunkIds.length === 0) {
    return [];
  }

  const rows = await prisma.lawChunk.findMany({
    where: {
      id: {
        in: chunkIds,
      },
    },

    include: {
      document: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,

    document_id: row.documentId,

    law_name: row.document.lawName,
    law_number: row.document.lawNumber,
    year: row.document.year,

    article_number: row.articleNumber,
    article_title: row.articleTitle,

    hierarchy: parseHierarchy(row.hierarchy),

    text: row.text,
    text_for_embedding: row.textForEmbedding,

    source_order: row.sourceOrder,

    provenance: {
      source_file: row.document.sourceFile,
      page_start: row.sourcePageStart,
      page_end: row.sourcePageEnd,
    },

    metadata: {
      parser_version: row.parserVersion ?? "",
      normalization_version: row.normalizationVersion ?? "",
      ocr_confidence: row.ocrConfidence,
    },
  }));
}
