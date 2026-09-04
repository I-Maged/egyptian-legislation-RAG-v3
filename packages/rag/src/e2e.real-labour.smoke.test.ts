// packages/rag/src/e2e.smoke.test.ts

import { describe, expect, it, vi } from "vitest";

import type { GenerationProvider } from "@egyptian-law/generation";
import { OllamaEmbeddingProvider } from "@egyptian-law/ingestion";

import { getChunksByIds } from "@egyptian-law/db";

import { PostgresVectorRetriever } from "@egyptian-law/ingestion";

import { DbRagRetriever } from "./retriever";
import { createRagService } from "./service";

describe("RAG real end-to-end smoke test", () => {
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
    // Generation remains mocked.
    //
    // The purpose of this smoke test is to verify the real
    // retrieval path and its integration with the RAG service.
    // ---------------------------------------------------------

    const generator: GenerationProvider = {
      model: "smoke-test-generator",

      generate: vi.fn().mockResolvedValue({
        answer:
          "يحدد قانون العمل الإطار المنظم لعلاقات العمل والحقوق والالتزامات المرتبطة بها. [1]",
        metadata: {
          model: "smoke-test-generator",
          durationMs: 1,
        },
      }),
    };

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
      query: "ما الهدف من قانون العمل؟",
      retrieval: {
        lawDocumentId: "lawdoc_f1fd6f6338643087",
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

      expect(result.chunk.document_id).toBe("lawdoc_f1fd6f6338643087");

      expect(result.chunk.law_name).toBe("labour_law");

      expect(result.chunk.law_number).toBe("148");

      expect(result.chunk.year).toBe("2019");

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

    expect(response.context.documents).toHaveLength(response.retrieved.length);

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

    expect(generator.generate).toHaveBeenCalledTimes(1);

    const generationRequest = vi.mocked(generator.generate).mock.calls[0]![0];

    expect(generationRequest.system).toContain(
      "مساعد قانوني متخصص في التشريعات المصرية",
    );

    expect(generationRequest.prompt).toContain("ما الهدف من قانون العمل؟");

    expect(generationRequest.prompt).toContain(response.context.text);

    // ---------------------------------------------------------
    // Citations
    // ---------------------------------------------------------

    expect(response.citations).toHaveLength(1);

    expect(response.citations[0]).toMatchObject({
      id: "[1]",
      chunkId: response.retrieved[0]?.chunk.id,
    });

    for (const [index, citation] of response.citations.entries()) {
      const retrieved = response.retrieved[index]!;

      expect(citation).toMatchObject({
        id: `[${index + 1}]`,
        chunkId: retrieved.chunk.id,
        lawName: retrieved.chunk.law_name,
        lawNumber: retrieved.chunk.law_number,
        year: retrieved.chunk.year,
        articleNumber: retrieved.chunk.article_number,
        articleTitle: retrieved.chunk.article_title,
        sourceFile: retrieved.chunk.provenance.source_file,
        pageStart: retrieved.chunk.provenance.page_start,
        pageEnd: retrieved.chunk.provenance.page_end,
      });
    }

    // ---------------------------------------------------------
    // Generation metadata
    // ---------------------------------------------------------

    expect(response.generation).toEqual({
      model: "smoke-test-generator",
      durationMs: 1,
    });
  }, 30_000);
});
