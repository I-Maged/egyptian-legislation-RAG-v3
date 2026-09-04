import { describe, expect, it } from "vitest";

import type { LawChunk } from "@egyptian-law/core";

import { buildGenerationContext, formatGenerationContext } from "./context";

function createChunk(id: string): LawChunk {
  return {
    id,
    document_id: "labour-law-148-2019",
    law_name: "قانون العمل",
    law_number: "148",
    year: "2019",
    article_number: id === "chunk-1" ? "1" : "2",
    article_title: null,
    source_order: 1,
    hierarchy: [],
    text: `نص المادة ${id}.`,
    text_for_embedding: `نص المادة ${id}.`,
    provenance: {
      source_file: "labour-law.pdf",
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

describe("generation context", () => {
  it("assigns stable citation IDs", () => {
    const result = buildGenerationContext([
      createChunk("chunk-1"),
      createChunk("chunk-2"),
    ]);

    expect(result).toEqual([
      {
        citationId: "[1]",
        chunk: expect.objectContaining({
          id: "chunk-1",
        }),
      },
      {
        citationId: "[2]",
        chunk: expect.objectContaining({
          id: "chunk-2",
        }),
      },
    ]);
  });

  it("formats legal chunks with citation IDs", () => {
    const result = formatGenerationContext([
      createChunk("chunk-1"),
      createChunk("chunk-2"),
    ]);

    expect(result).toContain("[1]");
    expect(result).toContain("[2]");
    expect(result).toContain("قانون العمل");
    expect(result).toContain("المادة: 1");
    expect(result).toContain("المادة: 2");
    expect(result).toContain("نص المادة chunk-1.");
  });
});
