import { readFile, readdir } from "fs/promises";
import { join, relative, resolve } from "path";

import {
  validateCanonicalCorpus,
  type CanonicalCorpus,
} from "@egyptian-law/core";

export interface LoadedCanonicalCorpus {
  relativePath: string;
  corpus: CanonicalCorpus;
}

export interface CanonicalCorpusSet {
  corpora: LoadedCanonicalCorpus[];
  documentCount: number;
  chunkCount: number;
}

async function findJsonFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await findJsonFiles(path)));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(path);
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
}

export async function loadCanonicalCorpora(
  canonicalDirectory: string,
): Promise<CanonicalCorpusSet> {
  const root = resolve(canonicalDirectory);
  const files = await findJsonFiles(root);

  if (files.length === 0) {
    throw new Error(`No canonical corpus JSON files found in ${root}.`);
  }

  const corpora: LoadedCanonicalCorpus[] = [];
  const documentIds = new Set<string>();
  const chunkIds = new Set<string>();

  for (const file of files) {
    const json = await readFile(file, "utf8");
    const corpus = validateCanonicalCorpus(JSON.parse(json));

    if (documentIds.has(corpus.document.id)) {
      throw new Error(`Duplicate canonical document ID: ${corpus.document.id}`);
    }

    documentIds.add(corpus.document.id);

    for (const chunk of corpus.chunks) {
      if (chunkIds.has(chunk.id)) {
        throw new Error(`Duplicate canonical chunk ID: ${chunk.id}`);
      }

      chunkIds.add(chunk.id);
    }

    corpora.push({
      relativePath: relative(root, file).replaceAll("\\", "/"),
      corpus,
    });
  }

  return {
    corpora,
    documentCount: corpora.length,
    chunkCount: [...chunkIds].length,
  };
}
