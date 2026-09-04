import { readFile } from "fs/promises";

import {
  validateCanonicalCorpus,
  type CanonicalCorpus,
} from "@egyptian-law/core";

export async function readCanonicalCorpusJson(
  filePath: string,
): Promise<CanonicalCorpus> {
  const json = await readFile(filePath, "utf8");

  const parsed: unknown = JSON.parse(json);

  return validateCanonicalCorpus(parsed);
}
