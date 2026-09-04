import { beforeEach, describe, expect, it, vi } from "vitest";

import { getChunksByIds, searchSimilarEmbeddings } from "@egyptian-law/db";

import {
  createDbVectorRerankedRetriever,
  createDbVectorRetriever,
  type EmbeddingProviderLike,
} from "./db-retrieval-adapters";

vi.mock("@egyptian-law/db", () => ({
  getChunksByIds: vi.fn(),
  searchSimilarEmbeddings: vi.fn(),
}));

const mockedSearchSimilarEmbeddings = vi.mocked(searchSimilarEmbeddings);
const mockedGetChunksByIds = vi.mocked(getChunksByIds);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DB vector retrieval adapters", () => {
  describe("createDbVectorRetriever", () => {
    it("embeds the query and maps vector results to chunk IDs", async () => {
      const embeddingProvider: EmbeddingProviderLike = {
        embed: vi.fn().mockResolvedValue([[0.1, 0.2, 0.3]]),
      };

      mockedSearchSimilarEmbeddings.mockResolvedValue([
        {
          chunkId: "chunk-7",
          score: 0.95,
        },
        {
          chunkId: "chunk-3",
          score: 0.88,
        },
      ]);

      const retrieve = createDbVectorRetriever(embeddingProvider, {
        topK: 10,
      });

      const result = await retrieve("حقوق العامل");

      expect(result).toEqual(["chunk-7", "chunk-3"]);

      expect(embeddingProvider.embed).toHaveBeenCalledWith(["حقوق العامل"]);

      expect(mockedSearchSimilarEmbeddings).toHaveBeenCalledWith({
        queryEmbedding: [0.1, 0.2, 0.3],
        topK: 10,
      });
    });

    it("passes law document filtering", async () => {
      const embeddingProvider: EmbeddingProviderLike = {
        embed: vi.fn().mockResolvedValue([[0.4, 0.5]]),
      };

      mockedSearchSimilarEmbeddings.mockResolvedValue([]);

      const retrieve = createDbVectorRetriever(embeddingProvider, {
        topK: 5,
        lawDocumentId: "labour-law-148-2019",
      });

      await retrieve("الفصل في المنازعات");

      expect(mockedSearchSimilarEmbeddings).toHaveBeenCalledWith({
        queryEmbedding: [0.4, 0.5],
        topK: 5,
        lawDocumentId: "labour-law-148-2019",
      });
    });

    it("throws when the embedding provider returns no embedding", async () => {
      const embeddingProvider: EmbeddingProviderLike = {
        embed: vi.fn().mockResolvedValue([]),
      };

      const retrieve = createDbVectorRetriever(embeddingProvider, {
        topK: 10,
      });

      await expect(retrieve("حقوق العامل")).rejects.toThrow(
        "Embedding provider returned no query embedding.",
      );

      expect(mockedSearchSimilarEmbeddings).not.toHaveBeenCalled();
    });
  });
});

describe("createDbVectorRerankedRetriever", () => {
  it("hydrates vector candidates and reranks them", async () => {
    const embeddingProvider: EmbeddingProviderLike = {
      embed: vi.fn().mockResolvedValue([[0.1, 0.2, 0.3]]),
    };

    mockedSearchSimilarEmbeddings.mockResolvedValue([
      {
        chunkId: "chunk-1",
        score: 0.95,
      },
      {
        chunkId: "chunk-2",
        score: 0.85,
      },
    ]);

    mockedGetChunksByIds.mockResolvedValue([
      {
        id: "chunk-1",
        document_id: "doc-1",
        law_name: "قانون العمل",
        law_number: "148",
        year: "2019",
        article_number: "1",
        article_title: null,
        hierarchy: [],
        text: "النص الخاص بحقوق العامل والتعويضات.",
        text_for_embedding: "النص الخاص بحقوق العامل والتعويضات.",
        source_order: 1,
        provenance: {
          source_file: "labour-law.pdf",
          page_start: 1,
          page_end: 1,
        },
        metadata: {
          parser_version: "test",
          normalization_version: "test",
          ocr_confidence: 1,
        },
      },
      {
        id: "chunk-2",
        document_id: "doc-1",
        law_name: "قانون العمل",
        law_number: "148",
        year: "2019",
        article_number: "2",
        article_title: null,
        hierarchy: [],
        text: "الأجر والإجازات المقررة للعامل.",
        text_for_embedding: "الأجر والإجازات المقررة للعامل.",
        source_order: 2,
        provenance: {
          source_file: "labour-law.pdf",
          page_start: 2,
          page_end: 2,
        },
        metadata: {
          parser_version: "test",
          normalization_version: "test",
          ocr_confidence: 1,
        },
      },
    ]);

    const retrieve = createDbVectorRerankedRetriever(
      embeddingProvider,
      {
        topK: 1,
        rerankTopK: 2,
      },
      {
        phraseWeight: 0.45,
        coverageWeight: 0.35,
        retrievalWeight: 0.2,
      },
    );

    const result = await retrieve("حقوق العامل");

    expect(result).toHaveLength(1);

    /*
     * rerankTopK controls the candidate pool.
     */
    expect(mockedSearchSimilarEmbeddings).toHaveBeenCalledWith({
      queryEmbedding: [0.1, 0.2, 0.3],
      topK: 2,
    });

    expect(mockedGetChunksByIds).toHaveBeenCalledWith(["chunk-1", "chunk-2"]);

    /*
     * chunk-1 contains the exact phrase and should therefore
     * win the baseline reranker.
     */
    expect(result[0]).toBe("chunk-1");
  });

  it("passes law document filtering", async () => {
    const embeddingProvider: EmbeddingProviderLike = {
      embed: vi.fn().mockResolvedValue([[0.1, 0.2]]),
    };

    mockedSearchSimilarEmbeddings.mockResolvedValue([]);

    const retrieve = createDbVectorRerankedRetriever(embeddingProvider, {
      topK: 5,
      rerankTopK: 20,
      lawDocumentId: "labour-law-148-2019",
    });

    const result = await retrieve("حقوق العامل");

    expect(result).toEqual([]);

    expect(mockedSearchSimilarEmbeddings).toHaveBeenCalledWith({
      queryEmbedding: [0.1, 0.2],
      topK: 20,
      lawDocumentId: "labour-law-148-2019",
    });

    expect(mockedGetChunksByIds).not.toHaveBeenCalled();
  });

  it("returns an empty result when vector retrieval returns no candidates", async () => {
    const embeddingProvider: EmbeddingProviderLike = {
      embed: vi.fn().mockResolvedValue([[0.1, 0.2]]),
    };

    mockedSearchSimilarEmbeddings.mockResolvedValue([]);

    const retrieve = createDbVectorRerankedRetriever(embeddingProvider, {
      topK: 5,
      rerankTopK: 20,
    });

    const result = await retrieve("حقوق العامل");

    expect(result).toEqual([]);

    expect(mockedGetChunksByIds).not.toHaveBeenCalled();
  });

  it("throws when the embedding provider returns no embedding", async () => {
    const embeddingProvider: EmbeddingProviderLike = {
      embed: vi.fn().mockResolvedValue([]),
    };

    const retrieve = createDbVectorRerankedRetriever(embeddingProvider, {
      topK: 5,
    });

    await expect(retrieve("حقوق العامل")).rejects.toThrow(
      "Embedding provider returned no query embedding.",
    );

    expect(mockedSearchSimilarEmbeddings).not.toHaveBeenCalled();

    expect(mockedGetChunksByIds).not.toHaveBeenCalled();
  });

  it("throws when a vector result cannot be hydrated", async () => {
    const embeddingProvider: EmbeddingProviderLike = {
      embed: vi.fn().mockResolvedValue([[0.1, 0.2]]),
    };

    mockedSearchSimilarEmbeddings.mockResolvedValue([
      {
        chunkId: "missing-chunk",
        score: 0.9,
      },
    ]);

    mockedGetChunksByIds.mockResolvedValue([]);

    const retrieve = createDbVectorRerankedRetriever(embeddingProvider, {
      topK: 5,
    });

    await expect(retrieve("حقوق العامل")).rejects.toThrow(
      "Vector retrieval returned unknown chunk ID: missing-chunk",
    );
  });

  it("respects rerankTopK", async () => {
    const embeddingProvider: EmbeddingProviderLike = {
      embed: vi.fn().mockResolvedValue([[0.1, 0.2]]),
    };

    mockedSearchSimilarEmbeddings.mockResolvedValue([
      {
        chunkId: "chunk-1",
        score: 0.9,
      },
      {
        chunkId: "chunk-2",
        score: 0.8,
      },
    ]);

    mockedGetChunksByIds.mockResolvedValue([
      {
        id: "chunk-1",
        document_id: "doc-1",
        law_name: "قانون العمل",
        law_number: "148",
        year: "2019",
        article_number: "1",
        article_title: null,
        hierarchy: [],
        text: "حقوق العامل",
        text_for_embedding: "حقوق العامل",
        source_order: 1,
        provenance: {
          source_file: "test.pdf",
          page_start: 1,
          page_end: 1,
        },
        metadata: {
          parser_version: "test",
          normalization_version: "test",
          ocr_confidence: 1,
        },
      },
      {
        id: "chunk-2",
        document_id: "doc-1",
        law_name: "قانون العمل",
        law_number: "148",
        year: "2019",
        article_number: "2",
        article_title: null,
        hierarchy: [],
        text: "واجبات العامل",
        text_for_embedding: "واجبات العامل",
        source_order: 2,
        provenance: {
          source_file: "test.pdf",
          page_start: 2,
          page_end: 2,
        },
        metadata: {
          parser_version: "test",
          normalization_version: "test",
          ocr_confidence: 1,
        },
      },
    ]);

    const retrieve = createDbVectorRerankedRetriever(embeddingProvider, {
      topK: 1,
      rerankTopK: 2,
    });

    const result = await retrieve("حقوق العامل");

    expect(result).toHaveLength(1);

    expect(mockedSearchSimilarEmbeddings).toHaveBeenCalledWith({
      queryEmbedding: [0.1, 0.2],
      topK: 2,
    });
  });
});
