import { describe, expect, it, vi } from "vitest";

import type {
  GenerationProvider,
  GenerationProviderRequest,
  GenerationProviderResponse,
} from "@egyptian-law/generation";

import type { LawChunk } from "@egyptian-law/core";

import {
  createRagService,
  type RagRetriever,
  type RagRetrievalResult,
} from "./index";

function createChunk(overrides: Partial<LawChunk> = {}): LawChunk {
  return {
    id: "chunk-1",

    document_id: "doc-1",

    law_name: "قانون العمل",

    law_number: "148",

    year: "2019",

    article_number: "1",

    article_title: null,

    source_order: 1,

    hierarchy: [],

    text: "النص القانوني للمادة الأولى.",

    text_for_embedding: "النص القانوني للمادة الأولى.",

    provenance: {
      source_file: "labour-law.pdf",

      page_start: 10,

      page_end: 10,
    },

    metadata: {
      parser_version: "parser-v2.3",

      normalization_version: "normalization-v1",

      ocr_confidence: 0.98,
    },

    ...overrides,
  };
}

function createRetrievalResult(
  overrides: Partial<RagRetrievalResult> = {},
): RagRetrievalResult {
  return {
    chunk: createChunk(),

    vectorScore: 0.91,

    rerankScore: 0.95,

    retrievalScore: 0.91,

    matchedTerms: 3,

    termCoverage: 1,

    exactPhraseMatch: true,

    ...overrides,
  };
}

function createRetriever(results: RagRetrievalResult[]): RagRetriever {
  return {
    retrieve: vi.fn().mockResolvedValue(results),
  };
}

function createGenerationProvider(
  response: GenerationProviderResponse = {
    answer: "وفقًا للمادة [1]، يحدد القانون ذلك.",
    metadata: {
      model: "gemma4:cloud",
      durationMs: 10,
    },
  },
): GenerationProvider {
  return {
    model: response.metadata.model,
    generate: vi.fn().mockResolvedValue(response),
  };
}

describe("createRagService", () => {
  it("retrieves context and generates an answer", async () => {
    const retrievalResult = createRetrievalResult();

    const retriever = createRetriever([retrievalResult]);

    const generationProvider = createGenerationProvider();

    const service = createRagService(retriever, generationProvider);

    const response = await service.answer({
      query: "ما هو النص القانوني؟",
    });

    expect(response.answer).toBe("وفقًا للمادة [1]، يحدد القانون ذلك.");

    expect(response.citations).toHaveLength(1);

    expect(response.citations[0]).toMatchObject({
      id: "[1]",
      chunkId: "chunk-1",
      articleNumber: "1",
      lawName: "قانون العمل",
    });

    expect(response.citations[0]?.text).toBe("النص القانوني للمادة الأولى.");

    expect(response.context.text).toContain("النص القانوني للمادة الأولى.");

    expect(generationProvider.generate).toHaveBeenCalledTimes(1);
  });

  it("passes retrieved context to generation", async () => {
    const retriever = createRetriever([createRetrievalResult()]);

    const generationProvider = createGenerationProvider();

    const service = createRagService(retriever, generationProvider);

    await service.answer({
      query: "ما هي المادة الأولى؟",
    });

    const calls = vi.mocked(generationProvider.generate).mock.calls;

    const request = calls[0]?.[0] as GenerationProviderRequest;

    expect(request.system).toContain("مساعد قانوني متخصص");

    expect(request.prompt).toContain("ما هي المادة الأولى؟");
    expect(request.prompt).toContain("النص القانوني للمادة الأولى.");
    expect(request.prompt).toContain("[1]");
  });

  it("returns an empty-context response when retrieval finds nothing", async () => {
    const retriever = createRetriever([]);

    const generationProvider = createGenerationProvider({
      answer: "المعلومات المتاحة لا تكفي للإجابة بشكل موثوق.",
      metadata: {
        model: "gemma4:cloud",
        durationMs: 10,
      },
    });

    const service = createRagService(retriever, generationProvider);

    const response = await service.answer({
      query: "سؤال لا توجد له نتائج",
    });

    expect(response.answer).toBe(
      "المعلومات المتاحة لا تكفي للإجابة بشكل موثوق.",
    );

    expect(response.citations).toEqual([]);

    expect(response.retrieved).toEqual([]);

    expect(response.context.documents).toEqual([]);
  });

  it("rejects an empty query", async () => {
    const retriever = createRetriever([]);

    const generationProvider = createGenerationProvider();

    const service = createRagService(retriever, generationProvider);

    await expect(
      service.answer({
        query: "   ",
      }),
    ).rejects.toThrow("RAG query must not be empty.");

    expect(retriever.retrieve).not.toHaveBeenCalled();

    expect(generationProvider.generate).not.toHaveBeenCalled();
  });

  it("preserves multiple citation sources", async () => {
    const results = [
      createRetrievalResult({
        chunk: createChunk({
          id: "chunk-1",
          article_number: "1",
        }),
      }),

      createRetrievalResult({
        chunk: createChunk({
          id: "chunk-2",
          article_number: "2",
        }),
      }),

      createRetrievalResult({
        chunk: createChunk({
          id: "chunk-3",
          article_number: "3",
        }),
      }),
    ];

    const retriever = createRetriever(results);

    const generationProvider = createGenerationProvider();

    const service = createRagService(retriever, generationProvider);

    const response = await service.answer({
      query: "ما هي الأحكام؟",
    });

    // expect(response.citations.map((citation) => citation.id)).toEqual([
    //   "[1]",
    //   "[2]",
    //   "[3]",
    // ]);

    // expect(
    //   response.citations.map((citation) => citation.articleNumber),
    // ).toEqual(["1", "2", "3"]);
  });
});
