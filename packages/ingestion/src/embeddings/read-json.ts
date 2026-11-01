import type { EmbeddingArtifact } from "@egyptian-law/core";

import { readJsonFile } from "../io/json-file";
import { validateEmbeddingArtifact } from "@egyptian-law/core";

export async function readEmbeddingArtifactJson(
  inputPath: string,
): Promise<EmbeddingArtifact> {
  const parsed = await readJsonFile(inputPath);

  return validateEmbeddingArtifact(parsed);
}