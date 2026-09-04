import { createHash } from "crypto";

import {
  LawChunkSchema,
  LawDocumentSchema,
  validateCanonicalCorpus,
  type CanonicalCorpus,
  type LawChunk as CanonicalLawChunk,
  type LawDocument,
} from "@egyptian-law/core";

/**
 * Exact output shape produced by the current parser v2.3.
 *
 * We intentionally define this locally rather than importing the parser's
 * LawChunk type. This keeps the canonical layer independent from the parser
 * implementation.
 */
export interface ParserV23LawChunk {
  instrumentId: string;

  lawName: string;
  lawNumber: string;
  year: string;

  articleNumber: string;
  articleNumberNormalized: number | null;
  articleSuffix: string | null;

  chapter: string | null;

  text: string;
  textForEmbedding: string;

  pageStart: number | null;
  pageEnd: number | null;
  pages: number[];

  sourceOrder: number;

  source?: "vision_ocr";

  sourceRecordIds: string[];
  qwenRecordCount: number;
  recoveryRecordCount: number;

  needsReview: boolean;
  reviewReasons: string[];
}

export interface CanonicalizeOptions {
  source_file: string;

  /**
   * Version of the parser that produced the input.
   *
   * Example:
   *   "parser-v2.3"
   */
  parser_version: string;

  /**
   * Version/name of the normalization process that produced
   * text_for_embedding.
   *
   * Example:
   *   "arabic-normalization-v1"
   */
  normalization_version: string;
}

/**
 * Create a stable document ID from the legal identity + source file.
 *
 * The same document metadata and source file will produce the same ID.
 */
function createDocumentId(
  lawName: string,
  lawNumber: string | null,
  year: string | null,
  sourceFile: string,
): string {
  const identity = [lawName, lawNumber ?? "", year ?? "", sourceFile].join("|");

  const hash = createHash("sha256")
    .update(identity, "utf8")
    .digest("hex")
    .slice(0, 16);

  return `lawdoc_${hash}`;
}

/**
 * Create a stable chunk ID.
 *
 * The occurrence index is important because article numbers are not
 * guaranteed to be unique in a damaged/parser output.
 */
function createChunkId(
  documentId: string,
  articleNumber: string,
  occurrenceIndex: number,
): string {
  const identity = [documentId, articleNumber, occurrenceIndex].join("|");

  const hash = createHash("sha256")
    .update(identity, "utf8")
    .digest("hex")
    .slice(0, 16);

  return `lawchunk_${hash}`;
}

/**
 * Convert parser-v2.3 output into our canonical legal corpus format.
 */
export function canonicalizeLabourLaw(
  parserChunks: ParserV23LawChunk[],
  options: CanonicalizeOptions,
): CanonicalCorpus {
  if (parserChunks.length === 0) {
    throw new Error("Cannot canonicalize an empty parser output.");
  }

  const first = parserChunks[0]!;

  const documentId = createDocumentId(
    first.lawName,
    first.lawNumber,
    first.year,
    options.source_file,
  );

  const document: LawDocument = {
    id: documentId,

    law_name: first.lawName,
    law_number: first.lawNumber,
    year: first.year,

    jurisdiction: "EG",
    language: "ar",

    source_file: options.source_file,

    metadata: {
      parser_version: options.parser_version,
      normalization_version: options.normalization_version,
    },
  };

  // Track repeated article numbers so chunk IDs remain unique.
  const articleOccurrences = new Map<string, number>();

  const chunks: CanonicalLawChunk[] = parserChunks.map((parserChunk) => {
    const occurrenceIndex =
      articleOccurrences.get(parserChunk.articleNumber) ?? 0;

    articleOccurrences.set(parserChunk.articleNumber, occurrenceIndex + 1);

    const id = createChunkId(
      documentId,
      parserChunk.articleNumber,
      occurrenceIndex,
    );

    const chunk: CanonicalLawChunk = {
      id,

      document_id: documentId,

      law_name: parserChunk.lawName,
      law_number: parserChunk.lawNumber,
      year: parserChunk.year,

      article_number: parserChunk.articleNumber,
      article_title: null,

      source_order: parserChunk.sourceOrder ?? null,

      hierarchy: parserChunk.chapter
        ? [
            {
              type: "chapter",
              label: parserChunk.chapter,
              title: null,
            },
          ]
        : [],

      text: parserChunk.text,
      text_for_embedding: parserChunk.textForEmbedding,

      provenance: {
        source_file: options.source_file,
        page_start: normalizePageNumber(parserChunk.pageStart),
        page_end: normalizePageNumber(parserChunk.pageEnd),
      },

      metadata: {
        parser_version: options.parser_version,
        normalization_version: options.normalization_version,
        ocr_confidence: null,
      },
    };

    return chunk;
  });

  const corpus: CanonicalCorpus = {
    schema_version: "1.0",

    document,

    chunks,
  };

  return validateCanonicalCorpus(corpus);
}

/**
 * Parser v2.3 uses a numeric page_number.
 *
 * Canonical schema requires a positive integer when a page exists.
 * Invalid/missing values become null rather than being invented.
 */
function normalizePageNumber(page: number | null | undefined): number | null {
  if (page == null) {
    return null;
  }

  if (!Number.isInteger(page) || page <= 0) {
    return null;
  }

  return page;
}
