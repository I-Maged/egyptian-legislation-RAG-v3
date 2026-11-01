import {
  validateCanonicalCorpus,
  type CanonicalCorpus,
} from "@egyptian-law/core";

import { readJsonFile } from "../io/json-file";

export async function readCanonicalCorpusJson(
  filePath: string,
): Promise<CanonicalCorpus> {
  const parsed: unknown = await readJsonFile(filePath);

  return validateCanonicalCorpus(parsed);
}