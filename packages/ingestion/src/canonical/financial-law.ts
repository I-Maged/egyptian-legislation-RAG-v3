import { createHash } from "crypto";

import type {
  CanonicalCorpus,
  LawChunk,
  LawDocument,
} from "@egyptian-law/core";

export interface FinancialLawParserArticle {
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

  pages?: number[];
  sourceOrder?: number;
  source?: string;

  sourceRecordIds?: string[];

  qwenRecordCount?: number;
  recoveryRecordCount?: number;

  needsReview?: boolean;
  reviewReasons?: string[];
}

function buildDocumentId(article: FinancialLawParserArticle): string {
  const raw = [
    article.lawName,
    article.lawNumber,
    article.year,
    "financial_law.pdf",
  ].join("|");

  return `lawdoc_${createHash("sha256")
    .update(raw)
    .digest("hex")
    .slice(0, 16)}`;
}

function buildChunkId(
  documentId: string,
  article: FinancialLawParserArticle,
): string {
  const raw = [
    documentId,
    article.articleNumber,
    article.sourceOrder ?? "",
    article.pageStart ?? "",
    article.pageEnd ?? "",
  ].join("|");

  return `chunk_${createHash("sha256").update(raw).digest("hex").slice(0, 16)}`;
}

function buildHierarchy(chapter: string | null): LawChunk["hierarchy"] {
  if (!chapter) {
    return [];
  }

  return [
    {
      type: "chapter",
      label: chapter,
      title: null,
    },
  ];
}

function normalizePageNumber(page: number | null | undefined): number | null {
  if (typeof page !== "number" || page <= 0) {
    return null;
  }

  return page;
}

export function canonicalizeFinancialLaw(
  parserChunks: FinancialLawParserArticle[],
): CanonicalCorpus {
  if (parserChunks.length === 0) {
    throw new Error("Cannot canonicalize an empty parser output.");
  }

  const first = parserChunks[0]!;

  const documentId = buildDocumentId(first);

  const document: LawDocument = {
    id: documentId,

    law_name: first.lawName,
    law_number: first.lawNumber,
    year: first.year,

    jurisdiction: "EG",
    language: "ar",

    source_file: "financial_law.pdf",

    metadata: {
      parser_version: "parser-v2.3",
      normalization_version: "parser-v2.3",
    },
  };

  const chunks: LawChunk[] = parserChunks.map((article) => ({
    id: buildChunkId(documentId, article),

    document_id: documentId,

    law_name: article.lawName,
    law_number: article.lawNumber,
    year: article.year,

    article_number: article.articleNumber,
    article_title: null,

    hierarchy: buildHierarchy(article.chapter),

    text: article.text,
    text_for_embedding: article.textForEmbedding,

    source_order: article.sourceOrder ?? null,

    provenance: {
      source_file: "financial_law.pdf",
      page_start: normalizePageNumber(article.pageStart),
      page_end: normalizePageNumber(article.pageEnd),
    },

    metadata: {
      parser_version: "parser-v2.3",
      normalization_version: "parser-v2.3",
      ocr_confidence: null,
    },
  }));

  return {
    schema_version: "1.0",
    document,
    chunks,
  };
}
