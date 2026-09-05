import { describe, expect, it } from "vitest";

import { OllamaGenerationProvider } from "@egyptian-law/generation";
import { getChunksByIds } from "@egyptian-law/db";
import { OllamaEmbeddingProvider, PostgresVectorRetriever } from "@egyptian-law/ingestion";

import { DbRagRetriever } from "./retriever";
import { createRagService } from "./service";

const RUN_REAL_SMOKE = process.env.RUN_RAG_FINANCIAL_SMOKE === "1";
const FINANCIAL_DOCUMENT_ID = "lawdoc_bdcbef44f3a8e375";

describe.skipIf(!RUN_REAL_SMOKE)("RAG real Financial Law end-to-end smoke test", () => {
  it("runs the real embedding -> pgvector -> chunk loading -> reranking -> context -> generation -> citation path", async () => {
    const embeddingProvider = new OllamaEmbeddingProvider({ model: "bge-m3", dimensions: 1024 });
    const vectorRetriever = new PostgresVectorRetriever({ getChunksByIds });
    const retriever = new DbRagRetriever(embeddingProvider, vectorRetriever);

    const generator = new OllamaGenerationProvider({ model: "gemma4:cloud" });

    const service = createRagService(retriever, generator, { topK: 5, candidateTopK: 20 });
    const query = "على أي أساس زمني تصدر الموازنة العامة للدولة؟";

    const response = await service.answer({
      query,
      retrieval: { lawDocumentId: FINANCIAL_DOCUMENT_ID, topK: 5, candidateTopK: 20 },
    });

    expect(response.answer).toBeTruthy();
    expect(response.retrieved.length).toBeGreaterThan(0);
    expect(response.retrieved.length).toBeLessThanOrEqual(5);

    for (const result of response.retrieved) {
      expect(result.chunk.document_id).toBe(FINANCIAL_DOCUMENT_ID);
      expect(result.chunk.law_number).toBe("6");
      expect(result.chunk.year).toBe("2022");
      expect(result.chunk.text).toBeTruthy();
      expect(result.vectorScore).toEqual(expect.any(Number));
      expect(result.rerankScore).toEqual(expect.any(Number));
    }

    expect(response.context.documents).toHaveLength(response.retrieved.length);
    expect(response.context.text).toContain(response.retrieved[0]!.chunk.text);
  }, 120_000);
});
