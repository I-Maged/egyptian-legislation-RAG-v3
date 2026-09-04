import type { LawChunk } from "@egyptian-law/core";

import { tokenizeArabic } from "./bm25";

export interface RerankCandidate {
  chunk: LawChunk;

  /**
   * Original vector retrieval score.
   */
  score: number;

  /**
   * Original pgvector similarity score.
   */
  vectorScore: number;
}

export interface RerankOptions {
  topK?: number;

  /**
   * Weight applied to exact query phrase matching.
   */
  phraseWeight?: number;

  /**
   * Weight applied to query-term coverage.
   */
  coverageWeight?: number;

  /**
   * Weight applied to the original vector retrieval score.
   */
  retrievalWeight?: number;
}

export interface RerankedResult {
  chunk: LawChunk;

  /**
   * Final reranking score.
   */
  score: number;

  /**
   * Original vector retrieval score.
   */
  retrievalScore: number;

  /**
   * Number of unique query terms found in the chunk.
   */
  matchedTerms: number;

  /**
   * Query-term coverage in [0, 1].
   */
  termCoverage: number;

  /**
   * Whether the normalized query phrase occurs in the chunk.
   */
  exactPhraseMatch: boolean;

  /**
   * Original vector similarity score.
   */
  vectorScore: number;
}

const DEFAULT_PHRASE_WEIGHT = 0.45;
const DEFAULT_COVERAGE_WEIGHT = 0.35;
const DEFAULT_RETRIEVAL_WEIGHT = 0.2;

function normalizeText(text: string): string {
  return tokenizeArabic(text).join(" ");
}

function countMatchedTerms(
  queryTokens: string[],
  documentTokens: string[],
): number {
  const documentTerms = new Set(documentTokens);
  const uniqueQueryTerms = new Set(queryTokens);

  if (uniqueQueryTerms.size === 0) {
    return 0;
  }

  return [...uniqueQueryTerms].filter((term) => documentTerms.has(term)).length;
}

function calculateTermCoverage(
  queryTokens: string[],
  documentTokens: string[],
): number {
  const uniqueQueryTerms = new Set(queryTokens);

  if (uniqueQueryTerms.size === 0) {
    return 0;
  }

  const matchedTerms = countMatchedTerms(queryTokens, documentTokens);

  return matchedTerms / uniqueQueryTerms.size;
}

function hasExactPhrase(query: string, text: string): boolean {
  const normalizedQuery = normalizeText(query);
  const normalizedText = normalizeText(text);

  if (normalizedQuery.length === 0) {
    return false;
  }

  return normalizedText.includes(normalizedQuery);
}

function normalizeScores(results: RerankCandidate[]): Map<string, number> {
  if (results.length === 0) {
    return new Map();
  }

  const maxScore = Math.max(...results.map((result) => result.score));

  if (maxScore <= 0) {
    return new Map(results.map((result) => [result.chunk.id, 0]));
  }

  return new Map(
    results.map((result) => [result.chunk.id, result.score / maxScore]),
  );
}

export class BaselineReranker {
  rerank(
    query: string,
    candidates: RerankCandidate[],
    options: RerankOptions = {},
  ): RerankedResult[] {
    if (candidates.length === 0) {
      return [];
    }

    if (query.trim().length === 0) {
      return [];
    }

    const topK = options.topK ?? candidates.length;

    const phraseWeight = options.phraseWeight ?? DEFAULT_PHRASE_WEIGHT;

    const coverageWeight = options.coverageWeight ?? DEFAULT_COVERAGE_WEIGHT;

    const retrievalWeight = options.retrievalWeight ?? DEFAULT_RETRIEVAL_WEIGHT;

    this.validateOptions({
      topK,
      phraseWeight,
      coverageWeight,
      retrievalWeight,
    });

    const queryTokens = tokenizeArabic(query);

    const normalizedRetrievalScores = normalizeScores(candidates);

    return candidates
      .map((candidate) => {
        const documentTokens = tokenizeArabic(
          candidate.chunk.text_for_embedding,
        );

        const matchedTerms = countMatchedTerms(queryTokens, documentTokens);

        const termCoverage = calculateTermCoverage(queryTokens, documentTokens);

        const exactPhraseMatch = hasExactPhrase(
          query,
          candidate.chunk.text_for_embedding,
        );

        const phraseScore = exactPhraseMatch ? 1 : 0;

        const retrievalScore =
          normalizedRetrievalScores.get(candidate.chunk.id) ?? 0;

        const score =
          phraseWeight * phraseScore +
          coverageWeight * termCoverage +
          retrievalWeight * retrievalScore;

        return {
          chunk: candidate.chunk,
          score,

          retrievalScore: candidate.score,

          matchedTerms,
          termCoverage,
          exactPhraseMatch,

          vectorScore: candidate.vectorScore,
        };
      })
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }

        return a.chunk.id.localeCompare(b.chunk.id);
      })
      .slice(0, topK);
  }

  private validateOptions(options: {
    topK: number;
    phraseWeight: number;
    coverageWeight: number;
    retrievalWeight: number;
  }): void {
    const { topK, phraseWeight, coverageWeight, retrievalWeight } = options;

    if (!Number.isInteger(topK) || topK <= 0) {
      throw new Error(`Invalid topK: ${topK}`);
    }

    for (const [name, value] of [
      ["phraseWeight", phraseWeight],
      ["coverageWeight", coverageWeight],
      ["retrievalWeight", retrievalWeight],
    ] as const) {
      if (!Number.isFinite(value) || value < 0) {
        throw new Error(`Invalid ${name}: ${value}`);
      }
    }

    if (phraseWeight + coverageWeight + retrievalWeight === 0) {
      throw new Error(
        "At least one reranking weight must be greater than zero.",
      );
    }
  }
}
