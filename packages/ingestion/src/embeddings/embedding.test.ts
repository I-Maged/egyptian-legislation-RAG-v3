import { describe, expect, it } from "vitest";

import type { CanonicalCorpus, EmbeddingProvider } from "@egyptian-law/core";

import { embedCorpus } from "./embed-corpus";

function createCorpus(): CanonicalCorpus {
  return {
    schema_version: "1.0",

    document: {
      id: "lawdoc_test",
      law_name: "test_law",
      law_number: "1",
      year: "2020",
      jurisdiction: "EG",
      language: "ar",
      source_file: "test.pdf",
      metadata: {
        parser_version: "test",
        normalization_version: "test",
      },
    },

    chunks: [
      {
        id: "chunk_1",
        document_id: "lawdoc_test",
        law_name: "test_law",
        law_number: "1",
        year: "2020",
        article_number: "1",
        article_title: null,
        hierarchy: [],
        text: "النص القانوني الأول",
        text_for_embedding: "النص القانوني الأول",
        provenance: {
          source_file: "test.pdf",
          page_start: 1,
          page_end: 1,
        },
        metadata: {
          parser_version: "test",
          normalization_version: "test",
          ocr_confidence: null,
        },
        source_order: 1,
      },

      {
        id: "chunk_2",
        document_id: "lawdoc_test",
        law_name: "test_law",
        law_number: "1",
        year: "2020",
        article_number: "2",
        article_title: null,
        hierarchy: [],
        text: "النص القانوني الثاني",
        text_for_embedding: "النص القانوني الثاني",
        provenance: {
          source_file: "test.pdf",
          page_start: 2,
          page_end: 2,
        },
        metadata: {
          parser_version: "test",
          normalization_version: "test",
          ocr_confidence: null,
        },
        source_order: 2,
      },
    ],
  };
}

function createFakeProvider(): EmbeddingProvider {
  return {
    model: "fake-embedding-model",
    dimensions: 4,

    async embed(texts: string[]): Promise<number[][]> {
      return texts.map((_, index) => [index + 1, 0, 0, 0]);
    },
  };
}

describe("embedCorpus", () => {
  it("creates one embedding record per canonical chunk", async () => {
    const result = await embedCorpus(createCorpus(), createFakeProvider());

    expect(result.records).toHaveLength(2);
  });

  it("preserves canonical chunk IDs", async () => {
    const result = await embedCorpus(createCorpus(), createFakeProvider());

    expect(result.records.map((record) => record.chunk_id)).toEqual([
      "chunk_1",
      "chunk_2",
    ]);
  });

  it("records the embedding model and dimensions", async () => {
    const result = await embedCorpus(createCorpus(), createFakeProvider());

    expect(result.model).toBe("fake-embedding-model");
    expect(result.dimensions).toBe(4);

    for (const record of result.records) {
      expect(record.model).toBe("fake-embedding-model");
      expect(record.dimensions).toBe(4);
      expect(record.embedding).toHaveLength(4);
    }
  });

  it("supports batching", async () => {
    let calls = 0;

    const provider: EmbeddingProvider = {
      model: "fake",
      dimensions: 2,

      async embed(texts: string[]): Promise<number[][]> {
        calls++;

        return texts.map(() => [1, 2]);
      },
    };

    const result = await embedCorpus(createCorpus(), provider, {
      batch_size: 1,
    });

    expect(calls).toBe(2);
    expect(result.records).toHaveLength(2);
  });

  it("rejects empty text_for_embedding", async () => {
    const corpus = createCorpus();

    corpus.chunks[0]!.text_for_embedding = "   ";

    await expect(embedCorpus(corpus, createFakeProvider())).rejects.toThrow(
      /empty text_for_embedding/,
    );
  });

  it("rejects a provider that returns the wrong number of vectors", async () => {
    const provider: EmbeddingProvider = {
      model: "fake",
      dimensions: 4,

      async embed(): Promise<number[][]> {
        return [[1, 2, 3, 4]];
      },
    };

    await expect(embedCorpus(createCorpus(), provider)).rejects.toThrow(
      /vectors/,
    );
  });

  it("rejects vectors with incorrect dimensions", async () => {
    const provider: EmbeddingProvider = {
      model: "fake",
      dimensions: 4,

      async embed(texts: string[]): Promise<number[][]> {
        return texts.map(() => [1, 2]);
      },
    };

    await expect(embedCorpus(createCorpus(), provider)).rejects.toThrow(
      /dimensions/,
    );
  });

  it("rejects non-finite embedding values", async () => {
    const provider: EmbeddingProvider = {
      model: "fake",
      dimensions: 2,

      async embed(texts: string[]): Promise<number[][]> {
        return texts.map(() => [1, Number.NaN]);
      },
    };

    await expect(embedCorpus(createCorpus(), provider)).rejects.toThrow(
      /non-finite/,
    );
  });

  it("rejects an empty corpus", async () => {
    const corpus = createCorpus();
    corpus.chunks = [];

    await expect(embedCorpus(corpus, createFakeProvider())).rejects.toThrow(
      /empty corpus/,
    );
  });
});
