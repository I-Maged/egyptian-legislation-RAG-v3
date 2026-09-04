import { mkdir, writeFile } from "fs/promises";
import { dirname } from "path";

import {
  validateCanonicalCorpus,
  type CanonicalCorpus,
} from "@egyptian-law/core";

export interface WriteCanonicalCorpusOptions {
  pretty?: boolean;
}

export async function writeCanonicalCorpusJson(
  filePath: string,
  corpus: CanonicalCorpus,
  options: WriteCanonicalCorpusOptions = {},
): Promise<void> {
  // Validate again at the persistence boundary.
  const validatedCorpus = validateCanonicalCorpus(corpus);

  await mkdir(dirname(filePath), {
    recursive: true,
  });

  const json = JSON.stringify(
    validatedCorpus,
    null,
    options.pretty === false ? 0 : 2,
  );

  await writeFile(filePath, `${json}\n`, "utf8");
}
