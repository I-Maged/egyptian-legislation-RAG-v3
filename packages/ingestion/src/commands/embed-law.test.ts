import { mkdtemp, readFile, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

import { describe, expect, it } from "vitest";

import type { CanonicalCorpus, EmbeddingProvider } from "@egyptian-law/core";

import { embedLaw } from "./embed-law";

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
        text: "النص الأول",
        text_for_embedding: "النص الأول",
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
        text: "النص الثاني",
        text_for_embedding: "النص الثاني",
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
    model: "fake-model",
    dimensions: 3,

    async embed(texts: string[]): Promise<number[][]> {
      return texts.map((_, index) => [index + 1, 0, 0]);
    },
  };
}

describe("embedLaw", () => {
  it("reads a canonical corpus, embeds it, and writes an artifact", async () => {
    const directory = await mkdtemp(join(tmpdir(), "egyptian-law-embedding-"));

    const inputPath = join(directory, "input.json");
    const outputPath = join(directory, "embeddings.json");

    await writeFile(inputPath, JSON.stringify(createCorpus()), "utf8");

    await embedLaw({
      inputPath,
      outputPath,
      provider: createFakeProvider(),
    });

    const output = JSON.parse(await readFile(outputPath, "utf8"));

    expect(output.schema_version).toBe("1.0");
    expect(output.model).toBe("fake-model");
    expect(output.dimensions).toBe(3);
    expect(output.records).toHaveLength(2);

    expect(
      output.records.map((record: { chunk_id: string }) => record.chunk_id),
    ).toEqual(["chunk_1", "chunk_2"]);
  });

  it("creates the output directory when necessary", async () => {
    const directory = await mkdtemp(join(tmpdir(), "egyptian-law-embedding-"));

    const inputPath = join(directory, "input.json");
    const outputPath = join(directory, "nested", "embeddings.json");

    await writeFile(inputPath, JSON.stringify(createCorpus()), "utf8");

    await embedLaw({
      inputPath,
      outputPath,
      provider: createFakeProvider(),
    });

    const output = JSON.parse(await readFile(outputPath, "utf8"));

    expect(output.records).toHaveLength(2);
  });

  it("requires an input path", async () => {
    await expect(
      embedLaw({
        inputPath: "",
        outputPath: "output.json",
        provider: createFakeProvider(),
      }),
    ).rejects.toThrow(/inputPath is required/);
  });

  it("requires an output path", async () => {
    await expect(
      embedLaw({
        inputPath: "input.json",
        outputPath: "",
        provider: createFakeProvider(),
      }),
    ).rejects.toThrow(/outputPath is required/);
  });
});
