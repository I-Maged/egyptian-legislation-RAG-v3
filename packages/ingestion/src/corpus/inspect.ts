import type { CanonicalCorpus } from "@egyptian-law/core";

export interface TextStatistics {
  min_chars: number;
  max_chars: number;
  mean_chars: number;
  median_chars: number;
}

export interface CorpusStatistics {
  schema_version: string;

  document: {
    id: string;
    law_name: string;
    law_number: string | null;
    year: string | null;
    source_file: string;
  };

  chunks: {
    total: number;

    article_numbers: {
      unique: number;
      missing: number;
      duplicates: number;
    };

    source_order: {
      present: number;
      null: number;
      min: number | null;
      max: number | null;
    };

    provenance: {
      page_start_present: number;
      page_end_present: number;
      both_present: number;
    };

    text: TextStatistics;
    text_for_embedding: TextStatistics;

    duplicates: {
      text: number;
      text_for_embedding: number;
    };

    hierarchy: {
      with_entries: number;
      without_entries: number;
    };
  };
}

function calculateTextStatistics(values: string[]): TextStatistics {
  if (values.length === 0) {
    return {
      min_chars: 0,
      max_chars: 0,
      mean_chars: 0,
      median_chars: 0,
    };
  }

  const lengths = values.map((value) => value.length).sort((a, b) => a - b);

  const total = lengths.reduce((sum, length) => sum + length, 0);

  const middle = Math.floor(lengths.length / 2);

  const median =
    lengths.length % 2 === 0
      ? (lengths[middle - 1]! + lengths[middle]!) / 2
      : lengths[middle]!;

  return {
    min_chars: lengths[0]!,
    max_chars: lengths[lengths.length - 1]!,
    mean_chars: total / lengths.length,
    median_chars: median,
  };
}

function countDuplicates(values: string[]): number {
  return values.length - new Set(values).size;
}

export function inspectCanonicalCorpus(
  corpus: CanonicalCorpus,
): CorpusStatistics {
  const chunks = corpus.chunks;

  const articleNumbers = chunks
    .map((chunk) => chunk.article_number)
    .filter((value) => value.trim().length > 0);

  const missingArticleNumbers = chunks.length - articleNumbers.length;

  const uniqueArticleNumbers = new Set(articleNumbers).size;

  const sourceOrders = chunks
    .map((chunk) => chunk.source_order)
    .filter((value): value is number => value !== null);

  const sourceOrdersMissing = chunks.length - sourceOrders.length;

  const pageStarts = chunks.filter(
    (chunk) => chunk.provenance.page_start !== null,
  ).length;

  const pageEnds = chunks.filter(
    (chunk) => chunk.provenance.page_end !== null,
  ).length;

  const bothPages = chunks.filter(
    (chunk) =>
      chunk.provenance.page_start !== null &&
      chunk.provenance.page_end !== null,
  ).length;

  const textValues = chunks.map((chunk) => chunk.text);

  const embeddingTextValues = chunks.map((chunk) => chunk.text_for_embedding);

  const hierarchyWithEntries = chunks.filter(
    (chunk) => chunk.hierarchy.length > 0,
  ).length;

  return {
    schema_version: corpus.schema_version,

    document: {
      id: corpus.document.id,
      law_name: corpus.document.law_name,
      law_number: corpus.document.law_number,
      year: corpus.document.year,
      source_file: corpus.document.source_file,
    },

    chunks: {
      total: chunks.length,

      article_numbers: {
        unique: uniqueArticleNumbers,
        missing: missingArticleNumbers,
        duplicates: Math.max(0, articleNumbers.length - uniqueArticleNumbers),
      },

      source_order: {
        present: sourceOrders.length,
        null: sourceOrdersMissing,
        min: sourceOrders.length > 0 ? Math.min(...sourceOrders) : null,
        max: sourceOrders.length > 0 ? Math.max(...sourceOrders) : null,
      },

      provenance: {
        page_start_present: pageStarts,
        page_end_present: pageEnds,
        both_present: bothPages,
      },

      text: calculateTextStatistics(textValues),

      text_for_embedding: calculateTextStatistics(embeddingTextValues),

      duplicates: {
        text: countDuplicates(textValues),
        text_for_embedding: countDuplicates(embeddingTextValues),
      },

      hierarchy: {
        with_entries: hierarchyWithEntries,
        without_entries: chunks.length - hierarchyWithEntries,
      },
    },
  };
}
