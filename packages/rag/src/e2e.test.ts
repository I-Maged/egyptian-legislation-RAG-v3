import { describe, expect, it, vi } from "vitest";

import type { LawChunk } from "@egyptian-law/core";
import type {
  GenerationProvider,
  GenerationProviderResponse,
} from "@egyptian-law/generation";

import type { RagRetrievalResult, RagRetriever } from "./types";

import { createRagService } from "./service";

function createChunk(
  id: string,
  articleNumber: string,
  text: string,
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
    source_order: 1,
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

function createRetrievalResult(
  chunk: LawChunk,
  score: number,
): RagRetrievalResult {
  return {
    chunk,
    vectorScore: score,
    retrievalScore: score,
    rerankScore: score,
    matchedTerms: 0,
    termCoverage: 0,
    exactPhraseMatch: false,
  };
}

function createRetriever(results: RagRetrievalResult[]): RagRetriever {
  return {
    retrieve: vi.fn().mockResolvedValue(results),
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

describe("End-to-end RAG pipeline", () => {
  it("retrieves legal context, sends it to generation, and returns citations", async () => {
    const chunk = createChunk(
      "labour-148-2019-article-1",
      "1",
      "يهدف هذا القانون إلى تنظيم علاقات العمل وحماية حقوق العمال وأصحاب الأعمال.",
    );

    const retrievalResult = createRetrievalResult(chunk, 0.92);

    const retriever = createRetriever([retrievalResult]);

    const generatorResponse: GenerationProviderResponse = {
      answer:
        "ينظم القانون علاقات العمل ويهدف إلى حماية حقوق العمال وأصحاب الأعمال. [1]",
      metadata: {
        model: "test-model",
        durationMs: 42,
      },
    };

    const generator = createGenerator(generatorResponse);

    const service = createRagService(retriever, generator, {
      topK: 5,
      candidateTopK: 20,
    });

    const response = await service.answer({
      query: "ما الهدف من قانون العمل؟",
    });

    // ---------------------------------------------------------
    // Final answer
    // ---------------------------------------------------------

    expect(response.answer).toContain("ينظم القانون علاقات العمل");

    // ---------------------------------------------------------
    // Retrieval
    // ---------------------------------------------------------

    expect(response.retrieved).toHaveLength(1);

    expect(response.retrieved[0]).toMatchObject({
      chunk: chunk,
      vectorScore: 0.92,
      retrievalScore: 0.92,
      rerankScore: 0.92,
    });

    // ---------------------------------------------------------
    // Context
    // ---------------------------------------------------------

    expect(response.context.documents).toHaveLength(1);

    expect(response.context.documents[0]).toMatchObject({
      citationId: "[1]",
      chunkId: chunk.id,
      lawName: "قانون العمل",
      lawNumber: "148",
      year: "2019",
      articleNumber: "1",
      sourceFile: "labour-law-148-2019.pdf",
      pageStart: 10,
      pageEnd: 10,
    });

    expect(response.context.text).toContain("[1]");
    expect(response.context.text).toContain("قانون العمل");
    expect(response.context.text).toContain("المادة: 1");
    expect(response.context.text).toContain(chunk.text);

    // ---------------------------------------------------------
    // Generation
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
    // Citations
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
    // Generation metadata
    // ---------------------------------------------------------

    expect(response.generation).toEqual({
      model: "test-model",
      durationMs: 42,
    });
  });

  it("preserves multiple retrieved sources and their citation mapping", async () => {
    const firstChunk = createChunk(
      "labour-148-2019-article-1",
      "1",
      "ينظم القانون علاقات العمل ويحمي حقوق العمال.",
    );

    const secondChunk = createChunk(
      "labour-148-2019-article-2",
      "2",
      "تسري أحكام القانون على علاقات العمل التي تحددها مواده.",
    );

    const results = [
      createRetrievalResult(firstChunk, 0.95),
      createRetrievalResult(secondChunk, 0.87),
    ];

    const retriever = createRetriever(results);

    const generator = createGenerator({
      answer:
        "ينظم القانون علاقات العمل ويحمي حقوق العمال [1]، كما تحدد المادة الثانية نطاق تطبيقه [2].",
      metadata: {
        model: "test-model",
        durationMs: 50,
      },
    });

    const service = createRagService(retriever, generator);

    const response = await service.answer({
      query: "ما الذي ينظمه القانون وما نطاق تطبيقه؟",
    });

    expect(response.retrieved).toHaveLength(2);
    expect(response.context.documents).toHaveLength(2);
    expect(response.citations).toHaveLength(2);

    expect(response.citations.map((citation) => citation.id)).toEqual([
      "[1]",
      "[2]",
    ]);

    expect(response.citations.map((citation) => citation.chunkId)).toEqual([
      firstChunk.id,
      secondChunk.id,
    ]);

    expect(response.context.text).toContain("[1]");
    expect(response.context.text).toContain("[2]");
    expect(response.context.text).toContain(firstChunk.text);
    expect(response.context.text).toContain(secondChunk.text);

    const generationRequest = vi.mocked(generator.generate).mock.calls[0]![0];

    expect(generationRequest.prompt).toContain(firstChunk.text);
    expect(generationRequest.prompt).toContain(secondChunk.text);
  });

  it("does not call generation when retrieval returns no results", async () => {
    const retriever = createRetriever([]);

    const generator = createGenerator({
      answer: "لن يتم استخدام هذه الإجابة.",
      metadata: {
        model: "test-model",
        durationMs: 10,
      },
    });

    const service = createRagService(retriever, generator);

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
  });
});
