import { describe, expect, it } from "vitest";

import type { LawChunk } from "@egyptian-law/core";

import { LEGAL_SYSTEM_PROMPT, buildGenerationPrompt } from "./prompt";

function createChunk(): LawChunk {
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
    text: "يحدد القانون نطاق تطبيقه.",
    text_for_embedding: "يحدد القانون نطاق تطبيقه.",
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
  };
}

describe("generation prompt", () => {
  it("contains grounding instructions", () => {
    expect(LEGAL_SYSTEM_PROMPT).toContain("لا تخترع أي معلومة قانونية");

    expect(LEGAL_SYSTEM_PROMPT).toContain("[1]");
  });

  it("contains the query and legal context", () => {
    const prompt = buildGenerationPrompt("ما هو نطاق تطبيق القانون؟", [
      createChunk(),
    ]);

    expect(prompt).toContain("ما هو نطاق تطبيق القانون؟");

    expect(prompt).toContain("[1]");
    expect(prompt).toContain("قانون العمل");
    expect(prompt).toContain("يحدد القانون نطاق تطبيقه.");
  });

  it("rejects an empty query", () => {
    expect(() => buildGenerationPrompt("   ", [createChunk()])).toThrow(
      "Generation query cannot be empty.",
    );
  });

  it("rejects an empty context", () => {
    expect(() => buildGenerationPrompt("ما هو القانون؟", [])).toThrow(
      "Generation requires at least one context chunk.",
    );
  });
});
