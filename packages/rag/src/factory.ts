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
  /** Ollama server base URL shared by embeddings + generation. */
  ollamaHost?: string;
  /** Generation-specific host override (defaults to `ollamaHost`). */
  generationHost?: string;
}

let defaultRagService: RagService | undefined;

function envOr(value: string | undefined, name: string): string | undefined {
  if (value !== undefined) {
    return value;
  }

  const envValue = process.env[name];

  return envValue?.trim() ? envValue.trim() : undefined;
}

function envInt(
  value: number | undefined,
  name: string,
): number | undefined {
  if (value !== undefined) {
    return value;
  }

  const raw = process.env[name];

  if (!raw?.trim()) {
    return undefined;
  }

  const parsed = Number.parseInt(raw.trim(), 10);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export function getRagService(
  options: RagServiceFactoryOptions = {},
): RagService {
  if (defaultRagService && Object.keys(options).length === 0) {
    return defaultRagService;
  }

  const ollamaHost = envOr(options.ollamaHost, "OLLAMA_HOST");
  const embeddingBaseUrl =
    envOr(options.embeddingBaseUrl, "EMBEDDING_BASE_URL") ?? ollamaHost;
  const generationHost =
    envOr(options.generationHost, "GENERATION_HOST") ?? ollamaHost;

  const embeddingProvider = new OllamaEmbeddingProvider({
    model:
      envOr(options.embeddingModel, "EMBEDDING_MODEL") ?? "bge-m3",

    dimensions:
      envInt(options.embeddingDimensions, "EMBEDDING_DIMENSIONS") ?? 1024,

    ...(embeddingBaseUrl !== undefined
      ? {
          base_url: embeddingBaseUrl,
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
    // Local default so a fresh clone works with `ollama pull gemma4` and no
    // ollama.com signin. Cloud models (e.g. `gemma4:cloud`) remain available
    // via GENERATION_MODEL override (requires `ollama signin` + internet).
    model:
      envOr(options.generationModel, "GENERATION_MODEL") ?? "gemma4",

    ...(generationHost !== undefined
      ? {
          host: generationHost,
        }
      : {}),
  });

  const service = new RagService(ragRetriever, generator, options);

  if (Object.keys(options).length === 0) {
    defaultRagService = service;
  }

  return service;
}
