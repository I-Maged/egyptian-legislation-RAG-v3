import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname, resolve } from "path";

import type { ParserOutput } from "../parser/types";
import { canonicalizeLabourLaw } from "../canonical/labour-law";
import { canonicalizeFinancialLaw } from "../canonical/financial-law";
import { canonicalizePersonalAffairsBundle } from "../canonical/personal-affairs";
import { writeCanonicalCorpusJson } from "../corpus/write-json";

import { fileURLToPath } from "url";

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8"));
}

async function write(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main(): Promise<void> {
  // const root = resolve(process.cwd());
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const root = resolve(__dirname, "../../../..");

  const labour = (await readJson(
    resolve(root, "data/output/labour-v3.json"),
  )) as {
    articles: Parameters<typeof canonicalizeLabourLaw>[0];
  };
  const labourCorpus = canonicalizeLabourLaw(labour.articles, {
    source_file: "labour-src.pdf",
    parser_version: "parser-v3.3.0",
    normalization_version: "parser-v3.3.0",
  });
  await writeCanonicalCorpusJson(
    resolve(root, "data/canonical/labour-law-14-2025.json"),
    labourCorpus,
  );

  const financial = (await readJson(
    resolve(root, "data/output/financial-v3.json"),
  )) as {
    articles: Parameters<typeof canonicalizeFinancialLaw>[0];
  };
  const financialCorpus = canonicalizeFinancialLaw(financial.articles);
  await writeCanonicalCorpusJson(
    resolve(root, "data/canonical/financial-law-6-2022.json"),
    financialCorpus,
  );

  const personal = (await readJson(
    resolve(root, "data/output/personal-bundle-v3.json"),
  )) as ParserOutput;
  const personalCorpora = canonicalizePersonalAffairsBundle(personal);
  for (const corpus of personalCorpora) {
    const id = corpus.document.id;
    const instrument = personal.instruments.find(
      (item) =>
        item.lawName === corpus.document.law_name &&
        item.lawNumber === corpus.document.law_number &&
        item.year === corpus.document.year,
    );
    const filename = instrument?.id ?? id;
    await writeCanonicalCorpusJson(
      resolve(root, `data/canonical/personal-affairs/${filename}.json`),
      corpus,
    );
  }

  console.log(`Labour: ${labourCorpus.chunks.length}`);
  console.log(`Financial: ${financialCorpus.chunks.length}`);
  console.log(`Personal Affairs instruments: ${personalCorpora.length}`);
  console.log(
    `Personal Affairs chunks: ${personalCorpora.reduce((n, c) => n + c.chunks.length, 0)}`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
