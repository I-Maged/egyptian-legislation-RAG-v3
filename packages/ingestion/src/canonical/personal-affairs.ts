import { createHash } from "crypto";

import type { LawChunk, LawDocument } from "@egyptian-law/core";
import type { ParsedArticle, ParserOutput } from "../parser/types";
import { reconstructPersonalAffairsArticles } from "./personal-affairs-reconstruction";
import type { CanonicalCorpus } from "./types";

/** Parser article shape used by the Personal Affairs canonicalizer. */
export type PersonalAffairsParserArticle = ParsedArticle;

export interface PersonalAffairsParserOutput {
  metadataResolved: {
    lawName: string | null;
    lawNumber: string | null;
    year: string | null;
  };
  articles: PersonalAffairsParserArticle[];
}

const SOURCE_FILE = "personal_affair_law.pdf";
const PARSER_VERSION = "parser-v3.3.0";
const NORMALIZATION_VERSION = "parser-v3.3.0";

function stableId(prefix: string, value: string): string {
  return `${prefix}_${createHash("sha256").update(value, "utf8").digest("hex").slice(0, 16)}`;
}

function normalizePageNumber(page: number | null | undefined): number | null {
  if (page == null || !Number.isInteger(page) || page <= 0) return null;
  return page;
}

function buildDocumentId(lawName: string, lawNumber: string, year: string): string {
  return stableId("lawdoc", `${lawName}|${lawNumber}|${year}`);
}

function buildChunkId(documentId: string, article: PersonalAffairsParserArticle): string {
  return stableId(
    "lawchunk",
    [
      documentId,
      article.articleNumber,
      article.sourceOrder,
      article.pageStart,
      article.pageEnd,
      article.text,
    ].join("|"),
  );
}

function buildHierarchy(chapter: string | null): LawChunk["hierarchy"] {
  return chapter?.trim()
    ? [{ type: "chapter", label: chapter.trim(), title: null }]
    : [];
}

function normalizeInput(
  input: PersonalAffairsParserOutput | ParserOutput,
): PersonalAffairsParserOutput {
  if ("instruments" in input && "coverage" in input) {
    const first = input.articles[0];
    return {
      metadataResolved: {
        lawName: input.metadataResolved.lawName ?? first?.lawName ?? null,
        lawNumber: input.metadataResolved.lawNumber ?? first?.lawNumber ?? null,
        year: input.metadataResolved.year ?? first?.year ?? null,
      },
      articles: input.articles,
    };
  }

  return input;
}

export function canonicalizePersonalAffairsLaw(
  input: PersonalAffairsParserOutput | ParserOutput,
): CanonicalCorpus {
  const normalized = normalizeInput(input);
  const first = normalized.articles[0];
  const lawName = normalized.metadataResolved.lawName ?? first?.lawName;
  const lawNumber = normalized.metadataResolved.lawNumber ?? first?.lawNumber;
  const year = normalized.metadataResolved.year ?? first?.year;

  if (!lawName || !lawNumber || !year) {
    throw new Error(
      "Personal Affairs canonicalization requires lawName, lawNumber, and year.",
    );
  }

  const documentId = buildDocumentId(lawName, lawNumber, year);

  const document: LawDocument = {
    id: documentId,
    law_name: lawName,
    law_number: lawNumber,
    year,
    jurisdiction: "EG",
    language: "ar",
    source_file: SOURCE_FILE,
    metadata: {
      parser_version: PARSER_VERSION,
      normalization_version: NORMALIZATION_VERSION,
    },
  };

  const chunks = normalized.articles.map((article) => ({
    id: buildChunkId(documentId, article),
    document_id: documentId,
    law_name: article.lawName,
    law_number: article.lawNumber,
    year: article.year,
    article_number: article.articleNumber,
    article_title: null,
    source_order: article.sourceOrder,
    hierarchy: buildHierarchy(article.chapter),
    text: article.text,
    text_for_embedding: article.textForEmbedding,
    provenance: {
      source_file: SOURCE_FILE,
      page_start: normalizePageNumber(article.pageStart),
      page_end: normalizePageNumber(article.pageEnd),
    },
    metadata: {
      parser_version: PARSER_VERSION,
      normalization_version: NORMALIZATION_VERSION,
      ocr_confidence: null,
    },
  } satisfies LawChunk));

  return { schema_version: "1.0", document, chunks };
}

/**
 * Canonicalize the complete multi-instrument Personal Affairs parser output.
 * Each legal instrument becomes its own CanonicalCorpus so that document
 * identity is never represented by the compilation-level null identity.
 */
export function canonicalizePersonalAffairsBundle(
  input: ParserOutput | PersonalAffairsParserOutput,
): CanonicalCorpus[] {
  const articles = input.articles;

  if (articles.length === 0) return [];

  if (!("instruments" in input)) {
    const instrumentIds = [...new Set(articles.map((article) => article.instrumentId))];
    if (instrumentIds.length <= 1) return [canonicalizePersonalAffairsLaw(input)];
    throw new Error(
      "Personal Affairs bundle canonicalization requires ParserOutput with instrument metadata when multiple instruments are present.",
    );
  }

  const corpora: CanonicalCorpus[] = [];

  for (const instrument of input.instruments) {
    const instrumentArticles = articles.filter(
      (article) => article.instrumentId === instrument.id,
    );

    if (instrumentArticles.length === 0) continue;

    const reconstructed = reconstructPersonalAffairsArticles(instrumentArticles);

    corpora.push(
      canonicalizePersonalAffairsLaw({
        metadataResolved: {
          lawName: instrument.lawName,
          lawNumber: instrument.lawNumber,
          year: instrument.year,
        },
        articles: reconstructed,
      }),
    );
  }

  return corpora;
}
