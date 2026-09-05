import { describe, expect, it } from "vitest";

import { OllamaGenerationProvider } from "@egyptian-law/generation";
import { getChunksByIds } from "@egyptian-law/db";
import { OllamaEmbeddingProvider, PostgresVectorRetriever } from "@egyptian-law/ingestion";

import { DbRagRetriever } from "./retriever";
import { createRagService } from "./service";

const RUN_REAL_SMOKE = process.env.RUN_RAG_PERSONAL_SMOKE === "1";

describe.skipIf(!RUN_REAL_SMOKE)("RAG real Personal Affairs end-to-end smoke test", () => {
  it("retrieves from the active personal-affairs embedding index without a document filter", async () => {
    const embeddingProvider = new OllamaEmbeddingProvider({ model: "bge-m3", dimensions: 1024 });
    const vectorRetriever = new PostgresVectorRetriever({ getChunksByIds });
    const retriever = new DbRagRetriever(embeddingProvider, vectorRetriever);

    const generator = new OllamaGenerationProvider({ model: "gemma4:cloud" });

    const service = createRagService(retriever, generator, { topK: 5, candidateTopK: 20 });
    const query = "خلال كم يوم يجب على الموثق إعلان المطلقة بوقوع الطلاق؟";

    const response = await service.answer({ query, retrieval: { topK: 5, candidateTopK: 20 } });

    expect(response.answer).toBeTruthy();
    expect(response.retrieved.length).toBeGreaterThan(0);
    expect(response.retrieved.length).toBeLessThanOrEqual(5);

    for (const result of response.retrieved) {
      expect(result.chunk.document_id).toBeTruthy();
      expect(result.chunk.text).toBeTruthy();
      expect(result.vectorScore).toEqual(expect.any(Number));
      expect(result.rerankScore).toEqual(expect.any(Number));
    }

    expect(response.context.documents).toHaveLength(response.retrieved.length);
    expect(response.context.text).toContain(response.retrieved[0]!.chunk.text);
  }, 120_000);
});
