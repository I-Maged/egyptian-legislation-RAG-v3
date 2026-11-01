import {
  validateCanonicalCorpus,
  type CanonicalCorpus,
} from "@egyptian-law/core";

import { writeJsonFile } from "../io/json-file";

export interface WriteCanonicalCorpusOptions {
  pretty?: boolean;
}

export async function writeCanonicalCorpusJson(
  filePath: string,
  corpus: CanonicalCorpus,
  options: WriteCanonicalCorpusOptions = {},
): Promise<void> {
  const validatedCorpus = validateCanonicalCorpus(corpus);

  await writeJsonFile(filePath, validatedCorpus, {
    ...(options.pretty !== undefined ? { pretty: options.pretty } : {}),
  });
}