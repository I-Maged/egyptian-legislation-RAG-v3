// npx tsx src/commands/check-canonical.ts ../../data/canonical/
// financial-law-18-2019.json

import { readFile } from "fs/promises";
import { resolve } from "path";

import {
  validateCanonicalCorpus,
  type CanonicalCorpus,
} from "@egyptian-law/core";

type CorpusStatistics = {
  chunks: number;

  articleNumbers: {
    unique: number;
    missing: number;
    duplicates: number;
  };

  sourceOrder: {
    present: number;
    null: number;
    min: number | null;
    max: number | null;
  };

  provenance: {
    pageStartPresent: number;
    pageEndPresent: number;
    bothPresent: number;
  };

  text: {
    min: number;
    max: number;
    mean: number;
    median: number;
  };

  textForEmbedding: {
    min: number;
    max: number;
    mean: number;
    median: number;
  };

  duplicates: {
    text: number;
    textForEmbedding: number;
  };

  hierarchy: {
    withEntries: number;
    withoutEntries: number;
  };
};

function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1]! + sorted[middle]!) / 2;
  }

  return sorted[middle]!;
}

function mean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function countDuplicates(values: string[]): number {
  const counts = new Map<string, number>();

  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  let duplicates = 0;

  for (const count of counts.values()) {
    if (count > 1) {
      duplicates += count - 1;
    }
  }

  return duplicates;
}

function calculateStatistics(corpus: CanonicalCorpus): CorpusStatistics {
  const chunks = corpus.chunks;

  const articleNumbers = chunks.map((chunk) => chunk.article_number);

  const uniqueArticleNumbers = new Set(articleNumbers);

  const sourceOrders = chunks.map((chunk) => chunk.source_order);
  const presentSourceOrders = sourceOrders.filter(
    (value): value is number => value !== null,
  );

  const pageStarts = chunks.map((chunk) => chunk.provenance.page_start);
  const pageEnds = chunks.map((chunk) => chunk.provenance.page_end);

  const textLengths = chunks.map((chunk) => chunk.text.length);
  const embeddingTextLengths = chunks.map(
    (chunk) => chunk.text_for_embedding.length,
  );

  const hierarchyCounts = chunks.map((chunk) => chunk.hierarchy.length);

  return {
    chunks: chunks.length,

    articleNumbers: {
      unique: uniqueArticleNumbers.size,
      missing: articleNumbers.filter((value) => !value.trim()).length,
      duplicates: countDuplicates(articleNumbers),
    },

    sourceOrder: {
      present: presentSourceOrders.length,
      null: sourceOrders.length - presentSourceOrders.length,
      min:
        presentSourceOrders.length > 0
          ? Math.min(...presentSourceOrders)
          : null,
      max:
        presentSourceOrders.length > 0
          ? Math.max(...presentSourceOrders)
          : null,
    },

    provenance: {
      pageStartPresent: pageStarts.filter((value) => value !== null).length,

      pageEndPresent: pageEnds.filter((value) => value !== null).length,

      bothPresent: chunks.filter(
        (chunk) =>
          chunk.provenance.page_start !== null &&
          chunk.provenance.page_end !== null,
      ).length,
    },

    text: {
      min: Math.min(...textLengths),
      max: Math.max(...textLengths),
      mean: mean(textLengths),
      median: median(textLengths),
    },

    textForEmbedding: {
      min: Math.min(...embeddingTextLengths),
      max: Math.max(...embeddingTextLengths),
      mean: mean(embeddingTextLengths),
      median: median(embeddingTextLengths),
    },

    duplicates: {
      text: countDuplicates(chunks.map((chunk) => chunk.text)),
      textForEmbedding: countDuplicates(
        chunks.map((chunk) => chunk.text_for_embedding),
      ),
    },

    hierarchy: {
      withEntries: hierarchyCounts.filter((value) => value > 0).length,
      withoutEntries: hierarchyCounts.filter((value) => value === 0).length,
    },
  };
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function printStatistics(corpus: CanonicalCorpus): void {
  const stats = calculateStatistics(corpus);
  const document = corpus.document;

  console.log("");
  console.log("Canonical Corpus Statistics");
  console.log("────────────────────────────");
  console.log("");

  console.log(`Law: ${document.law_name}`);
  console.log(`Law number: ${document.law_number ?? "null"}`);
  console.log(`Year: ${document.year ?? "null"}`);
  console.log(`Source: ${document.source_file}`);
  console.log("");

  console.log(`Chunks: ${stats.chunks}`);
  console.log("");

  console.log("Article numbers");
  console.log(`  unique: ${stats.articleNumbers.unique}`);
  console.log(`  missing: ${stats.articleNumbers.missing}`);
  console.log(`  duplicates: ${stats.articleNumbers.duplicates}`);
  console.log("");

  console.log("Source order");
  console.log(`  present: ${stats.sourceOrder.present}`);
  console.log(`  null: ${stats.sourceOrder.null}`);
  console.log(`  min: ${stats.sourceOrder.min ?? "null"}`);
  console.log(`  max: ${stats.sourceOrder.max ?? "null"}`);
  console.log("");

  console.log("Provenance");
  console.log(`  page_start present: ${stats.provenance.pageStartPresent}`);
  console.log(`  page_end present: ${stats.provenance.pageEndPresent}`);
  console.log(`  both present: ${stats.provenance.bothPresent}`);
  console.log("");

  console.log("Text");
  console.log(`  min chars: ${stats.text.min}`);
  console.log(`  max chars: ${stats.text.max}`);
  console.log(`  mean chars: ${formatNumber(stats.text.mean)}`);
  console.log(`  median chars: ${formatNumber(stats.text.median)}`);
  console.log("");

  console.log("Text for embedding");
  console.log(`  min chars: ${stats.textForEmbedding.min}`);
  console.log(`  max chars: ${stats.textForEmbedding.max}`);
  console.log(`  mean chars: ${formatNumber(stats.textForEmbedding.mean)}`);
  console.log(`  median chars: ${formatNumber(stats.textForEmbedding.median)}`);
  console.log("");

  console.log("Duplicates");
  console.log(`  text: ${stats.duplicates.text}`);
  console.log(`  text_for_embedding: ${stats.duplicates.textForEmbedding}`);
  console.log("");

  console.log("Hierarchy");
  console.log(`  with entries: ${stats.hierarchy.withEntries}`);
  console.log(`  without entries: ${stats.hierarchy.withoutEntries}`);
  console.log("");

  console.log("✓ Canonical corpus integrity validation passed.");
}

async function main(): Promise<void> {
  const [, , inputPath] = process.argv;

  if (!inputPath || !inputPath.trim()) {
    throw new Error(
      "Usage: tsx src/commands/check-canonical.ts <canonical-json>",
    );
  }

  const resolvedPath = resolve(process.cwd(), inputPath);

  console.log(`Reading canonical corpus: ${resolvedPath}`);

  const json = await readFile(resolvedPath, "utf8");

  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error(`Invalid JSON: ${resolvedPath}`);
  }

  /*
   * validateCanonicalCorpus is the authoritative structural/schema
   * validation. Statistics are calculated only after validation passes.
   */
  const corpus = validateCanonicalCorpus(parsed);

  printStatistics(corpus);
}

main().catch((error: unknown) => {
  console.error("");
  console.error("Canonical corpus integrity validation failed.");
  console.error("");
  console.error(error);
  process.exitCode = 1;
});
