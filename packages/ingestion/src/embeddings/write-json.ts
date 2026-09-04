import { mkdir, writeFile } from "fs/promises";
import { dirname } from "path";

import type { EmbeddingArtifact } from "@egyptian-law/core";

export async function writeEmbeddingArtifactJson(
  outputPath: string,
  artifact: EmbeddingArtifact,
): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true });

  await writeFile(outputPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
}
