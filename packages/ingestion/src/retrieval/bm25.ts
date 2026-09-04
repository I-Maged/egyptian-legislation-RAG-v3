export interface Bm25Options {
  k1?: number;
  b?: number;
}

export interface Bm25Document {
  id: string;
  text: string;
}

export interface Bm25IndexDocument {
  id: string;
  tokens: string[];
  length: number;
  termFrequencies: Map<string, number>;
}

export interface Bm25Index {
  documents: Bm25IndexDocument[];
  documentFrequency: Map<string, number>;
  averageDocumentLength: number;
  documentCount: number;
  k1: number;
  b: number;
}

const DEFAULT_K1 = 1.2;
const DEFAULT_B = 0.75;

const ARABIC_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const TATWEEL = /\u0640/g;

const ARABIC_DIGITS: Record<string, string> = {
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
};

function normalizeArabic(text: string): string {
  return text
    .normalize("NFKC")
    .replace(ARABIC_DIACRITICS, "")
    .replace(TATWEEL, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[٠-٩]/g, (digit) => ARABIC_DIGITS[digit] ?? digit)
    .toLowerCase();
}

/**
 * Conservative tokenizer for Arabic legal text.
 *
 * We deliberately avoid stemming at this stage because Arabic legal
 * morphology can carry meaningful distinctions.
 */
export function tokenizeArabic(text: string): string[] {
  const normalized = normalizeArabic(text);

  return normalized.match(/[\p{L}\p{N}]+/gu) ?? [];
}

function createTermFrequency(tokens: string[]): Map<string, number> {
  const frequencies = new Map<string, number>();

  for (const token of tokens) {
    frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
  }

  return frequencies;
}

export function createBm25Index(
  documents: Bm25Document[],
  options: Bm25Options = {},
): Bm25Index {
  const k1 = options.k1 ?? DEFAULT_K1;
  const b = options.b ?? DEFAULT_B;

  if (!Number.isFinite(k1) || k1 <= 0) {
    throw new Error(`Invalid BM25 k1: ${k1}`);
  }

  if (!Number.isFinite(b) || b < 0 || b > 1) {
    throw new Error(`Invalid BM25 b: ${b}`);
  }

  if (documents.length === 0) {
    throw new Error("Cannot create BM25 index from empty corpus.");
  }

  const indexedDocuments: Bm25IndexDocument[] = [];
  const documentFrequency = new Map<string, number>();

  let totalLength = 0;

  for (const document of documents) {
    const tokens = tokenizeArabic(document.text);
    const termFrequencies = createTermFrequency(tokens);

    indexedDocuments.push({
      id: document.id,
      tokens,
      length: tokens.length,
      termFrequencies,
    });

    totalLength += tokens.length;

    // Document frequency counts a term once per document,
    // regardless of how many times it occurs in that document.
    for (const term of termFrequencies.keys()) {
      documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
    }
  }

  return {
    documents: indexedDocuments,
    documentFrequency,
    averageDocumentLength: totalLength / documents.length,
    documentCount: documents.length,
    k1,
    b,
  };
}

function inverseDocumentFrequency(
  documentCount: number,
  documentFrequency: number,
): number {
  return Math.log(
    1 + (documentCount - documentFrequency + 0.5) / (documentFrequency + 0.5),
  );
}

export function scoreBm25(
  queryTokens: string[],
  document: Bm25IndexDocument,
  index: Bm25Index,
): number {
  if (queryTokens.length === 0) {
    return 0;
  }

  if (document.length === 0) {
    return 0;
  }

  if (index.averageDocumentLength === 0) {
    return 0;
  }

  // Standard BM25 treats each query term once.
  const uniqueQueryTerms = new Set(queryTokens);

  let score = 0;

  for (const term of uniqueQueryTerms) {
    const termFrequency = document.termFrequencies.get(term) ?? 0;

    if (termFrequency === 0) {
      continue;
    }

    const documentFrequency = index.documentFrequency.get(term) ?? 0;

    if (documentFrequency === 0) {
      continue;
    }

    const idf = inverseDocumentFrequency(
      index.documentCount,
      documentFrequency,
    );

    const normalization =
      1 - index.b + index.b * (document.length / index.averageDocumentLength);

    const numerator = termFrequency * (index.k1 + 1);

    const denominator = termFrequency + index.k1 * normalization;

    score += idf * (numerator / denominator);
  }

  return score;
}

export function searchBm25(
  index: Bm25Index,
  query: string,
): Array<{ id: string; score: number }> {
  const queryTokens = tokenizeArabic(query);

  if (queryTokens.length === 0) {
    return [];
  }

  return index.documents
    .map((document) => ({
      id: document.id,
      score: scoreBm25(queryTokens, document, index),
    }))
    .filter((result) => result.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.id.localeCompare(b.id);
    });
}
