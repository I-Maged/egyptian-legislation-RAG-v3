// npm --workspace packages/ingestion run inspect:corpus

import { readFile } from "fs/promises";
import { resolve } from "path";
import { fileURLToPath } from "url";

import {
  validateCanonicalCorpus,
  type CanonicalCorpus,
} from "@egyptian-law/core";

import { inspectCanonicalCorpus } from "../corpus/inspect";

async function main(): Promise<void> {
  const ROOT_DIR = resolve(
    fileURLToPath(new URL("../../../../", import.meta.url)),
  );
  const inputPath = resolve(
    ROOT_DIR,
    "data/canonical/personal-affairs-law-25-1929.json",
  );

  //   const inputPath = process.argv[2];

  if (!inputPath) {
    throw new Error("Usage: npm run inspect:corpus -- <canonical-corpus.json>");
  }

  const resolvedPath = resolve(process.cwd(), inputPath);

  console.log(`Reading canonical corpus: ${resolvedPath}`);

  const json = await readFile(resolvedPath, "utf8");

  const parsed: unknown = JSON.parse(json);

  const corpus: CanonicalCorpus = validateCanonicalCorpus(parsed);

  const statistics = inspectCanonicalCorpus(corpus);

  console.log("");
  console.log("Canonical Corpus Statistics");
  console.log("────────────────────────────────────");
  console.log("");

  console.log(`Law: ${statistics.document.law_name}`);
  console.log(`Law number: ${statistics.document.law_number}`);
  console.log(`Year: ${statistics.document.year}`);
  console.log(`Source: ${statistics.document.source_file}`);

  console.log("");
  console.log(`Chunks: ${statistics.chunks.total}`);

  console.log("");
  console.log("Article numbers");
  console.log(`  unique: ${statistics.chunks.article_numbers.unique}`);
  console.log(`  missing: ${statistics.chunks.article_numbers.missing}`);
  console.log(`  duplicates: ${statistics.chunks.article_numbers.duplicates}`);

  console.log("");
  console.log("Source order");
  console.log(`  present: ${statistics.chunks.source_order.present}`);
  console.log(`  null: ${statistics.chunks.source_order.null}`);
  console.log(`  min: ${statistics.chunks.source_order.min ?? "N/A"}`);
  console.log(`  max: ${statistics.chunks.source_order.max ?? "N/A"}`);

  console.log("");
  console.log("Provenance");
  console.log(
    `  page_start present: ${statistics.chunks.provenance.page_start_present}`,
  );
  console.log(
    `  page_end present: ${statistics.chunks.provenance.page_end_present}`,
  );
  console.log(`  both present: ${statistics.chunks.provenance.both_present}`);

  console.log("");
  console.log("Text");
  console.log(`  min chars: ${statistics.chunks.text.min_chars}`);
  console.log(`  max chars: ${statistics.chunks.text.max_chars}`);
  console.log(`  mean chars: ${statistics.chunks.text.mean_chars.toFixed(2)}`);
  console.log(`  median chars: ${statistics.chunks.text.median_chars}`);

  console.log("");
  console.log("Text for embedding");
  console.log(`  min chars: ${statistics.chunks.text_for_embedding.min_chars}`);
  console.log(`  max chars: ${statistics.chunks.text_for_embedding.max_chars}`);
  console.log(
    `  mean chars: ${statistics.chunks.text_for_embedding.mean_chars.toFixed(
      2,
    )}`,
  );
  console.log(
    `  median chars: ${statistics.chunks.text_for_embedding.median_chars}`,
  );

  console.log("");
  console.log("Duplicates");
  console.log(`  text: ${statistics.chunks.duplicates.text}`);
  console.log(
    `  text_for_embedding: ${statistics.chunks.duplicates.text_for_embedding}`,
  );

  console.log("");
  console.log("Hierarchy");
  console.log(`  with entries: ${statistics.chunks.hierarchy.with_entries}`);
  console.log(
    `  without entries: ${statistics.chunks.hierarchy.without_entries}`,
  );
}

main().catch((error: unknown) => {
  console.error("Failed to inspect canonical corpus.");
  console.error(error);
  process.exitCode = 1;
});
