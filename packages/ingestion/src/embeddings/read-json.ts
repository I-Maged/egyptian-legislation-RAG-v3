import { readFile } from "fs/promises";

import type { EmbeddingArtifact } from "@egyptian-law/core";

export async function readEmbeddingArtifactJson(
  inputPath: string,
): Promise<EmbeddingArtifact> {
  const json = await readFile(inputPath, "utf8");

  return JSON.parse(json) as EmbeddingArtifact;
}
