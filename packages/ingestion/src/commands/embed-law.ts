import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { resolve } from "path";
import { EmbeddingProvider } from "@egyptian-law/core";

import type { CanonicalCorpus } from "@egyptian-law/core";

import { embedCorpus } from "../embeddings/embed-corpus";
import { OllamaEmbeddingProvider } from "../embeddings/ollama-provider";
import { writeEmbeddingArtifactJson } from "../embeddings/write-json";

const ROOT_DIR = resolve(
  fileURLToPath(new URL("../../../../", import.meta.url)),
);

export interface EmbedLawOptions {
  inputPath: string;
  outputPath: string;
  batch_size?: number;
  provider?: EmbeddingProvider;
}

export async function embedLaw(options: EmbedLawOptions): Promise<void> {
  if (!options.inputPath.trim()) {
    throw new Error("inputPath is required.");
  }

  if (!options.outputPath.trim()) {
    throw new Error("outputPath is required.");
  }

  const inputPath = resolve(ROOT_DIR, options.inputPath);
  const outputPath = resolve(ROOT_DIR, options.outputPath);

  console.log(`Reading canonical corpus: ${inputPath}`);

  const json = await readFile(inputPath, "utf8");
  const corpus = JSON.parse(json) as CanonicalCorpus;

  console.log(`Loaded ${corpus.chunks.length} canonical chunks.`);

  // const provider = new OllamaEmbeddingProvider();
  const provider = options.provider ?? new OllamaEmbeddingProvider();

  console.log(
    `Embedding with ${provider.model} (${provider.dimensions} dimensions)...`,
  );

  const artifact = await embedCorpus(corpus, provider, {
    batch_size: options.batch_size ?? 32,
  });

  console.log(`Generated ${artifact.records.length} embeddings.`);

  await writeEmbeddingArtifactJson(outputPath, artifact);

  console.log(`Embedding artifact written to: ${outputPath}`);
}
