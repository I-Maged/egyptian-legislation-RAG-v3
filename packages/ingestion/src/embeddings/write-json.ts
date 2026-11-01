import type { EmbeddingArtifact } from "@egyptian-law/core";

import { validateEmbeddingArtifact } from "@egyptian-law/core";

import { writeJsonFile } from "../io/json-file";

export async function writeEmbeddingArtifactJson(
  outputPath: string,
  artifact: EmbeddingArtifact,
): Promise<void> {
  validateEmbeddingArtifact(artifact);

  await writeJsonFile(outputPath, artifact);
}