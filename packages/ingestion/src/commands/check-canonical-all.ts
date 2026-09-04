import { readFile } from "fs/promises";
import { resolve } from "path";

import {
  validateCanonicalCorpus,
  type CanonicalCorpus,
} from "@egyptian-law/core";
import type { ParserOutput } from "../parser/types";
import { canonicalizeLabourLaw } from "../canonical/labour-law";
import { canonicalizeFinancialLaw } from "../canonical/financial-law";
import { canonicalizePersonalAffairsBundle } from "../canonical/personal-affairs";

const ROOT = resolve(process.cwd());

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8"));
}

function assertCorpusInvariants(path: string, corpus: CanonicalCorpus): void {
  if (corpus.chunks.length === 0) throw new Error(`${path}: empty corpus`);

  const ids = new Set<string>();
  for (const chunk of corpus.chunks) {
    if (ids.has(chunk.id))
      throw new Error(`${path}: duplicate chunk id ${chunk.id}`);
    ids.add(chunk.id);
    if (chunk.document_id !== corpus.document.id) {
      throw new Error(`${path}: chunk ${chunk.id} has wrong document_id`);
    }
    if (!chunk.text.trim())
      throw new Error(`${path}: chunk ${chunk.id} has empty text`);
    if (!chunk.text_for_embedding.trim()) {
      throw new Error(
        `${path}: chunk ${chunk.id} has empty text_for_embedding`,
      );
    }
    const { page_start, page_end } = chunk.provenance;
    if (page_start !== null && page_start <= 0)
      throw new Error(`${path}: invalid page_start`);
    if (page_end !== null && page_end <= 0)
      throw new Error(`${path}: invalid page_end`);
    if (page_start !== null && page_end !== null && page_end < page_start) {
      throw new Error(`${path}: page_end precedes page_start`);
    }
  }
}

async function checkStoredAgainstGenerated(
  path: string,
  generated: CanonicalCorpus,
): Promise<number> {
  const stored = validateCanonicalCorpus(await readJson(path));
  assertCorpusInvariants(path, stored);
  assertCorpusInvariants(path, generated);

  if (JSON.stringify(stored) !== JSON.stringify(generated)) {
    throw new Error(
      `${path}: stored canonical corpus differs from current parser output`,
    );
  }

  return stored.chunks.length;
}

async function main(): Promise<void> {
  const labour = (await readJson(
    resolve(ROOT, "data/output/labour-v3.json"),
  )) as {
    articles: Parameters<typeof canonicalizeLabourLaw>[0];
  };
  const labourCorpus = canonicalizeLabourLaw(labour.articles, {
    source_file: "labour-src.pdf",
    parser_version: "parser-v3.3.0",
    normalization_version: "parser-v3.3.0",
  });

  const financial = (await readJson(
    resolve(ROOT, "data/output/financial-v3.json"),
  )) as {
    articles: Parameters<typeof canonicalizeFinancialLaw>[0];
  };
  const financialCorpus = canonicalizeFinancialLaw(financial.articles);

  const personal = (await readJson(
    resolve(ROOT, "data/output/personal-bundle-v3.json"),
  )) as ParserOutput;
  const personalCorpora = canonicalizePersonalAffairsBundle(personal);

  const checks: Array<[string, CanonicalCorpus]> = [
    ["data/canonical/labour-law-14-2025.json", labourCorpus],
    ["data/canonical/financial-law-6-2022.json", financialCorpus],
  ];

  for (const [relativePath, generated] of checks) {
    const count = await checkStoredAgainstGenerated(
      resolve(ROOT, relativePath),
      generated,
    );
    console.log(`✓ ${resolve(ROOT, relativePath)} — ${count} chunks`);
  }

  if (personalCorpora.length !== personal.instruments.length) {
    throw new Error(
      `Personal Affairs: expected ${personal.instruments.length} corpora, got ${personalCorpora.length}`,
    );
  }

  let personalTotal = 0;
  for (const corpus of personalCorpora) {
    const instrument = personal.instruments.find(
      (item) =>
        item.lawName === corpus.document.law_name &&
        item.lawNumber === corpus.document.law_number &&
        item.year === corpus.document.year,
    );
    if (!instrument)
      throw new Error(`No parser instrument matches ${corpus.document.id}`);

    const relativePath = `data/canonical/personal-affairs/${instrument.id}.json`;
    const count = await checkStoredAgainstGenerated(
      resolve(ROOT, relativePath),
      corpus,
    );
    personalTotal += count;
    console.log(`✓ ${resolve(ROOT, relativePath)} — ${count} chunks`);
  }

  const total =
    labourCorpus.chunks.length + financialCorpus.chunks.length + personalTotal;
  if (total !== 802) throw new Error(`Expected 802 total chunks, got ${total}`);

  console.log(`\nValidated 16 canonical corpora.`);
  console.log(`Total chunks: ${total}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
