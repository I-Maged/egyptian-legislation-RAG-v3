import { describe, expect, it, vi } from "vitest";

import type { LawChunk } from "@egyptian-law/core";
import type {
  GenerationProvider,
  GenerationProviderResponse,
} from "@egyptian-law/generation";
import type { EmbeddingProviderLike } from "@egyptian-law/evaluation";

import type { RagRetrievalResult, RagRetriever } from "./types";

import { DbRagRetriever } from "./retriever";
import { createRagService } from "./service";

function createChunk(
  id: string,
  articleNumber: string,
  text: string,
  sourceOrder: number,
): LawChunk {
  return {
    id,
    document_id: "labour-law-148-2019",
    law_name: "قانون العمل",
    law_number: "148",
    year: "2019",
    article_number: articleNumber,
    article_title: null,
    hierarchy: [
      {
        type: "chapter",
        label: "الباب الأول",
        title: "أحكام عامة",
      },
    ],
    source_order: sourceOrder,
    text,
    text_for_embedding: text,
    provenance: {
      source_file: "labour-law-148-2019.pdf",
      page_start: 10,
      page_end: 10,
    },
    metadata: {
      parser_version: "test",
      normalization_version: "test",
      ocr_confidence: 1,
    },
  };
}

function createEmbeddingProvider(embedding: number[]): EmbeddingProviderLike {
  return {
    embed: vi.fn().mockResolvedValue([embedding]),
  };
}

function createVectorRetriever(
  results: Array<{
    chunk: LawChunk;
    score: number;
  }>,
) {
  return {
    search: vi.fn().mockResolvedValue(results),
  };
}

function createGenerator(
  response: GenerationProviderResponse,
): GenerationProvider {
  return {
    model: response.metadata.model,
    generate: vi.fn().mockResolvedValue(response),
  };
}

describe("RAG end-to-end smoke test", () => {
  it("runs query -> embedding -> vector retrieval -> context -> generation -> citations", async () => {
    const chunk = createChunk(
      "labour-148-2019-article-1",
      "1",
      "يهدف هذا القانون إلى تنظيم علاقات العمل وحماية حقوق العمال وأصحاب الأعمال.",
      1,
    );

    const embeddingProvider = createEmbeddingProvider([1, 0, 0]);

    const vectorRetriever = createVectorRetriever([
      {
        chunk,
        score: 0.92,
      },
    ]);

    const ragRetriever = new DbRagRetriever(
      embeddingProvider,
      vectorRetriever as never,
    );

    const generatorResponse: GenerationProviderResponse = {
      answer:
        "ينظم قانون العمل علاقات العمل ويهدف إلى حماية حقوق العمال وأصحاب الأعمال. [1]",
      metadata: {
        model: "test-model",
        durationMs: 42,
      },
    };

    const generator = createGenerator(generatorResponse);

    const service = createRagService(ragRetriever, generator, {
      topK: 5,
      candidateTopK: 20,
    });

    const response = await service.answer({
      query: "ما الهدف من قانون العمل؟",
    });

    // ---------------------------------------------------------
    // 1. Final answer
    // ---------------------------------------------------------

    expect(response.answer).toContain("ينظم قانون العمل علاقات العمل");

    // ---------------------------------------------------------
    // 2. Embedding stage
    // ---------------------------------------------------------

    expect(embeddingProvider.embed).toHaveBeenCalledTimes(1);
    expect(embeddingProvider.embed).toHaveBeenCalledWith([
      "ما الهدف من قانون العمل؟",
    ]);

    // ---------------------------------------------------------
    // 3. Vector retrieval stage
    // ---------------------------------------------------------

    expect(vectorRetriever.search).toHaveBeenCalledTimes(1);

    expect(vectorRetriever.search).toHaveBeenCalledWith([1, 0, 0], {
      topK: 20,
    });

    // ---------------------------------------------------------
    // 4. Retrieval result exposed by RAG
    // ---------------------------------------------------------

    expect(response.retrieved).toHaveLength(1);

    expect(response.retrieved[0]).toMatchObject({
      chunk,
      vectorScore: 0.92,
      retrievalScore: 0.92,
      matchedTerms: 1,
      termCoverage: 0.2,
      exactPhraseMatch: false,
    });

    expect(response.retrieved[0]!.rerankScore).toBeGreaterThan(0);
    expect(response.retrieved[0]!.rerankScore).toBeLessThanOrEqual(1);

    // ---------------------------------------------------------
    // 5. Context construction
    // ---------------------------------------------------------

    expect(response.context.documents).toHaveLength(1);

    expect(response.context.documents[0]).toMatchObject({
      citationId: "[1]",
      chunkId: chunk.id,
      lawName: "قانون العمل",
      lawNumber: "148",
      year: "2019",
      articleNumber: "1",
      articleTitle: null,
      sourceFile: "labour-law-148-2019.pdf",
      pageStart: 10,
      pageEnd: 10,
    });

    expect(response.context.text).toContain("[1]");
    expect(response.context.text).toContain("قانون العمل");
    expect(response.context.text).toContain("المادة: 1");
    expect(response.context.text).toContain(chunk.text);

    // ---------------------------------------------------------
    // 6. Generation stage
    // ---------------------------------------------------------

    expect(generator.generate).toHaveBeenCalledTimes(1);

    const generationRequest = vi.mocked(generator.generate).mock.calls[0]![0];

    expect(generationRequest.system).toContain(
      "مساعد قانوني متخصص في التشريعات المصرية",
    );

    expect(generationRequest.prompt).toContain("ما الهدف من قانون العمل؟");

    expect(generationRequest.prompt).toContain(chunk.text);

    expect(generationRequest.prompt).toContain("[1]");

    // ---------------------------------------------------------
    // 7. Citation mapping
    // ---------------------------------------------------------

    expect(response.citations).toHaveLength(1);

    expect(response.citations[0]).toEqual({
      id: "[1]",
      chunkId: chunk.id,
      lawName: "قانون العمل",
      lawNumber: "148",
      year: "2019",
      articleNumber: "1",
      articleTitle: null,
      text: chunk.text,
      sourceFile: "labour-law-148-2019.pdf",
      pageStart: 10,
      pageEnd: 10,
    });

    // ---------------------------------------------------------
    // 8. Generation metadata
    // ---------------------------------------------------------

    expect(response.generation).toEqual({
      model: "test-model",
      durationMs: 42,
    });
  });

  it("preserves multiple retrieved chunks through retrieval, context, generation, and citations", async () => {
    const firstChunk = createChunk(
      "labour-148-2019-article-1",
      "1",
      "ينظم القانون علاقات العمل ويحمي حقوق العمال.",
      1,
    );

    const secondChunk = createChunk(
      "labour-148-2019-article-2",
      "2",
      "تسري أحكام القانون على علاقات العمل التي تحددها مواده.",
      2,
    );

    const embeddingProvider = createEmbeddingProvider([1, 0, 0]);

    const vectorRetriever = createVectorRetriever([
      {
        chunk: firstChunk,
        score: 0.95,
      },
      {
        chunk: secondChunk,
        score: 0.87,
      },
    ]);

    const ragRetriever = new DbRagRetriever(
      embeddingProvider,
      vectorRetriever as never,
    );

    const generator = createGenerator({
      answer:
        "ينظم القانون علاقات العمل ويحمي حقوق العمال [1]، كما تحدد المادة الثانية نطاق تطبيقه [2].",
      metadata: {
        model: "test-model",
        durationMs: 50,
      },
    });

    const service = createRagService(ragRetriever, generator);

    const response = await service.answer({
      query: "ما الذي ينظمه القانون وما نطاق تطبيقه؟",
    });

    // ---------------------------------------------------------
    // Retrieval
    // ---------------------------------------------------------

    expect(response.retrieved).toHaveLength(2);

    expect(response.retrieved.map((result) => result.chunk.id)).toEqual([
      firstChunk.id,
      secondChunk.id,
    ]);

    expect(response.retrieved.map((result) => result.vectorScore)).toEqual([
      0.95, 0.87,
    ]);

    // ---------------------------------------------------------
    // Context
    // ---------------------------------------------------------

    expect(response.context.documents).toHaveLength(2);

    expect(
      response.context.documents.map((document) => document.citationId),
    ).toEqual(["[1]", "[2]"]);

    expect(
      response.context.documents.map((document) => document.chunkId),
    ).toEqual([firstChunk.id, secondChunk.id]);

    expect(response.context.text).toContain("[1]");
    expect(response.context.text).toContain("[2]");
    expect(response.context.text).toContain(firstChunk.text);
    expect(response.context.text).toContain(secondChunk.text);

    // ---------------------------------------------------------
    // Generation
    // ---------------------------------------------------------

    expect(generator.generate).toHaveBeenCalledTimes(1);

    const generationRequest = vi.mocked(generator.generate).mock.calls[0]![0];

    expect(generationRequest.prompt).toContain(firstChunk.text);
    expect(generationRequest.prompt).toContain(secondChunk.text);

    // ---------------------------------------------------------
    // Citations
    // ---------------------------------------------------------

    expect(response.citations).toHaveLength(2);

    expect(response.citations.map((citation) => citation.id)).toEqual([
      "[1]",
      "[2]",
    ]);

    expect(response.citations.map((citation) => citation.chunkId)).toEqual([
      firstChunk.id,
      secondChunk.id,
    ]);
  });

  it("stops before generation when retrieval returns no chunks", async () => {
    const embeddingProvider = createEmbeddingProvider([1, 0, 0]);

    const vectorRetriever = createVectorRetriever([]);

    const ragRetriever = new DbRagRetriever(
      embeddingProvider,
      vectorRetriever as never,
    );

    const generator = createGenerator({
      answer: "هذه الإجابة يجب ألا تستخدم.",
      metadata: {
        model: "test-model",
        durationMs: 10,
      },
    });

    const service = createRagService(ragRetriever, generator);

    const response = await service.answer({
      query: "ما هي أحكام قانون العمل؟",
    });

    expect(response.answer).toBe(
      "المعلومات المتاحة لا تكفي للإجابة بشكل موثوق.",
    );

    expect(response.retrieved).toEqual([]);
    expect(response.citations).toEqual([]);
    expect(response.context.documents).toEqual([]);
    expect(response.context.text).toBe("");

    expect(generator.generate).not.toHaveBeenCalled();

    // Retrieval still happened, including query embedding.
    expect(embeddingProvider.embed).toHaveBeenCalledTimes(1);
    expect(vectorRetriever.search).toHaveBeenCalledTimes(1);
  });
});
