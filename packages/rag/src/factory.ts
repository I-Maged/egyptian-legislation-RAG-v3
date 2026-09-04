import { getChunksByIds } from "@egyptian-law/db";

import {
  PostgresVectorRetriever,
  OllamaEmbeddingProvider,
  BaselineReranker,
} from "@egyptian-law/ingestion";

import { OllamaGenerationProvider } from "@egyptian-law/generation";

import { RagService, type RagServiceOptions } from "./service";

import { DbRagRetriever } from "./retriever";

export interface RagServiceFactoryOptions extends RagServiceOptions {
  embeddingModel?: string;
  embeddingDimensions?: number;
  embeddingBaseUrl?: string;

  generationModel?: string;
}

let defaultRagService: RagService | undefined;

export function getRagService(
  options: RagServiceFactoryOptions = {},
): RagService {
  if (defaultRagService && Object.keys(options).length === 0) {
    return defaultRagService;
  }

  const embeddingProvider = new OllamaEmbeddingProvider({
    model: options.embeddingModel ?? "bge-m3",

    dimensions: options.embeddingDimensions ?? 1024,

    ...(options.embeddingBaseUrl !== undefined
      ? {
          base_url: options.embeddingBaseUrl,
        }
      : {}),
  });

  const vectorRetriever = new PostgresVectorRetriever({
    getChunksByIds,
  });

  const ragRetriever = new DbRagRetriever(
    embeddingProvider,
    vectorRetriever,
    new BaselineReranker(),
  );

  const generator = new OllamaGenerationProvider({
    model: options.generationModel ?? "gemma4:cloud",
  });

  const service = new RagService(ragRetriever, generator, options);

  if (Object.keys(options).length === 0) {
    defaultRagService = service;
  }

  return service;
}
