import {
  getRagService as createRagService,
  type RagService,
} from "@egyptian-law/rag";

let service: RagService | undefined;

/**
 * Lazily creates the singleton RAG service.
 *
 * Called per-request (first request wins), so `process.env` is read at
 * container runtime — not at `next build` time. Configure via:
 * `OLLAMA_HOST`, `EMBEDDING_BASE_URL`, `EMBEDDING_MODEL`,
 * `EMBEDDING_DIMENSIONS`, `GENERATION_MODEL`.
 */
export function getRagService(): RagService {
  if (service) {
    return service;
  }

  service = createRagService({
    ...(process.env.OLLAMA_HOST?.trim()
      ? { ollamaHost: process.env.OLLAMA_HOST.trim() }
      : {}),
    ...(process.env.EMBEDDING_BASE_URL?.trim()
      ? { embeddingBaseUrl: process.env.EMBEDDING_BASE_URL.trim() }
      : {}),
    ...(process.env.EMBEDDING_MODEL?.trim()
      ? { embeddingModel: process.env.EMBEDDING_MODEL.trim() }
      : {}),
    ...(process.env.GENERATION_MODEL?.trim()
      ? { generationModel: process.env.GENERATION_MODEL.trim() }
      : {}),
  });

  return service;
}
