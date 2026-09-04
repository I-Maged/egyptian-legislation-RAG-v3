// npm --workspace packages/ingestion run canonicalize:labour

import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { resolve } from "path";

import {
  type ParserV23LawChunk,
  canonicalizeLabourLaw,
} from "../canonical/labour-law";

import { writeCanonicalCorpusJson } from "../corpus/write-json";

const ROOT_DIR = resolve(
  fileURLToPath(new URL("../../../../", import.meta.url)),
);
const INPUT_PATH = resolve(ROOT_DIR, "data/output/labour-v3.json");
const OUTPUT_PATH = resolve(ROOT_DIR, "data/canonical/labour-law-14-2025.json");

async function main(): Promise<void> {
  console.log(`Reading parser output: ${INPUT_PATH}`);

  const json = await readFile(INPUT_PATH, "utf8");

  const parsed = JSON.parse(json) as {
    articles: ParserV23LawChunk[];
  };

  const parserChunks = parsed.articles;

  if (parserChunks.length === 0) {
    throw new Error("Parser output contains no articles.");
  }

  console.log(`Loaded ${parserChunks.length} parser articles.`);

  const corpus = canonicalizeLabourLaw(parserChunks, {
    source_file: "labour-v2.3.pdf",
    parser_version: "parser-v2.3",
    normalization_version: "parser-v2.3",
  });

  console.log(`Canonicalized ${corpus.chunks.length} chunks.`);

  await writeCanonicalCorpusJson(OUTPUT_PATH, corpus);

  console.log(`Canonical corpus written to: ${OUTPUT_PATH}`);
}

main().catch((error: unknown) => {
  console.error("Failed to canonicalize Labour Law.");

  console.error(error);

  process.exitCode = 1;
});
