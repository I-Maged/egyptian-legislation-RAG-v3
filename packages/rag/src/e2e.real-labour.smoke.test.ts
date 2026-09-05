// packages/rag/src/e2e.smoke.test.ts

import { describe, expect, it } from "vitest";

import { OllamaGenerationProvider } from "@egyptian-law/generation";
import { OllamaEmbeddingProvider } from "@egyptian-law/ingestion";

import { getChunksByIds } from "@egyptian-law/db";

import { PostgresVectorRetriever } from "@egyptian-law/ingestion";

import { DbRagRetriever } from "./retriever";
import { createRagService } from "./service";

const RUN_REAL_SMOKE = process.env.RUN_RAG_LABOUR_SMOKE === "1";

describe.skipIf(!RUN_REAL_SMOKE)(
  "RAG real Labour end-to-end smoke test",
  () => {
    it("runs query -> Ollama embedding -> pgvector -> chunk loading -> reranking -> context -> generation -> citations", async () => {
      // ---------------------------------------------------------
      // Real embedding provider
      // ---------------------------------------------------------

      const embeddingProvider = new OllamaEmbeddingProvider({
        model: "bge-m3",
        dimensions: 1024,
      });

      // ---------------------------------------------------------
      // Real database-backed vector retrieval
      //
      // PostgresVectorRetriever does:
      //
      // pgvector
      //   ↓
      // chunk IDs
      //   ↓
      // getChunksByIds()
      //   ↓
      // complete LawChunk objects
      // ---------------------------------------------------------

      const chunkLoader = {
        getChunksByIds,
      };

      const vectorRetriever = new PostgresVectorRetriever(chunkLoader);

      // ---------------------------------------------------------
      // Real RAG retriever
      //
      // This performs:
      //
      // query
      //   ↓
      // embedding
      //   ↓
      // vector candidate retrieval
      //   ↓
      // BaselineReranker
      //   ↓
      // RagRetrievalResult[]
      // ---------------------------------------------------------

      const retriever = new DbRagRetriever(embeddingProvider, vectorRetriever);

      // ---------------------------------------------------------
      // Real Ollama generation
      // ---------------------------------------------------------

      const generator = new OllamaGenerationProvider({ model: "gemma4:cloud" });

      // ---------------------------------------------------------
      // RAG service
      // ---------------------------------------------------------

      const service = createRagService(retriever, generator, {
        topK: 5,
        candidateTopK: 20,
      });

      // ---------------------------------------------------------
      // Real query
      // ---------------------------------------------------------

      const response = await service.answer({
        query:
          "ما طبيعة قانون العمل بالنسبة إلى القوانين المنظمة لعلاقات العمل؟",
        retrieval: {
          lawDocumentId: "lawdoc_04ec12b4c4f7e3a6",
          topK: 5,
          candidateTopK: 20,
        },
      });

      // ---------------------------------------------------------
      // Final answer
      // ---------------------------------------------------------

      expect(response.answer).toBeTruthy();
      expect(response.answer.length).toBeGreaterThan(0);

      // ---------------------------------------------------------
      // Retrieval
      // ---------------------------------------------------------

      expect(response.retrieved.length).toBeGreaterThan(0);
      expect(response.retrieved.length).toBeLessThanOrEqual(5);

      // Every retrieved result must contain a real canonical chunk.
      for (const result of response.retrieved) {
        expect(result.chunk.id).toBeTruthy();

        expect(result.chunk.document_id).toBe("lawdoc_04ec12b4c4f7e3a6");

        expect(result.chunk.law_name).toBe("labour_law");

        expect(result.chunk.law_number).toBe("14");

        expect(result.chunk.year).toBe("2025");

        expect(result.chunk.article_number).toBeTruthy();

        expect(result.chunk.text).toBeTruthy();

        expect(result.chunk.text_for_embedding).toBeTruthy();

        expect(result.vectorScore).toEqual(expect.any(Number));

        expect(result.retrievalScore).toEqual(expect.any(Number));

        expect(result.rerankScore).toEqual(expect.any(Number));

        expect(result.matchedTerms).toEqual(expect.any(Number));

        expect(result.termCoverage).toEqual(expect.any(Number));

        expect(result.exactPhraseMatch).toEqual(expect.any(Boolean));
      }

      // ---------------------------------------------------------
      // Context
      // ---------------------------------------------------------

      expect(response.context.documents).toHaveLength(
        response.retrieved.length,
      );

      expect(response.context.text).toBeTruthy();

      for (const [index, result] of response.retrieved.entries()) {
        const citationId = `[${index + 1}]`;

        expect(response.context.text).toContain(citationId);

        expect(response.context.text).toContain(result.chunk.text);

        expect(response.context.text).toContain(
          `المادة: ${result.chunk.article_number}`,
        );
      }

      // ---------------------------------------------------------
      // Generation
      // ---------------------------------------------------------

      expect(response.generation.model).toBe("gemma4:cloud");
      expect(response.generation.durationMs).toBeGreaterThanOrEqual(0);
    }, 120_000);
  },
);
