import { mkdir, mkdtemp, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

import { describe, expect, it } from "vitest";

import { loadCanonicalCorpora } from "./load-canonical";

function corpus(documentId: string, chunkId: string) {
  return {
    schema_version: "1.0",
    document: {
      id: documentId,
      law_name: "test",
      law_number: "1",
      year: "2020",
      jurisdiction: "EG",
      language: "ar",
      source_file: "test.pdf",
      metadata: {
        parser_version: "parser-v3.3.0",
        normalization_version: "parser-v3.3.0",
      },
    },
    chunks: [
      {
        id: chunkId,
        document_id: documentId,
        law_name: "test",
        law_number: "1",
        year: "2020",
        article_number: "1",
        article_title: null,
        source_order: 1,
        hierarchy: [],
        text: "نص",
        text_for_embedding: "نص",
        provenance: {
          source_file: "test.pdf",
          page_start: 1,
          page_end: 1,
        },
        metadata: {
          parser_version: "parser-v3.3.0",
          normalization_version: "parser-v3.3.0",
          ocr_confidence: null,
        },
      },
    ],
  };
}

describe("loadCanonicalCorpora", () => {
  it("recursively loads and validates canonical JSON files", async () => {
    const root = await mkdtemp(join(tmpdir(), "egyptian-law-corpus-"));
    await mkdir(join(root, "personal-affairs"));

    await writeFile(
      join(root, "labour.json"),
      JSON.stringify(corpus("doc-1", "chunk-1")),
      "utf8",
    );
    await writeFile(
      join(root, "personal-affairs", "law.json"),
      JSON.stringify(corpus("doc-2", "chunk-2")),
      "utf8",
    );

    const result = await loadCanonicalCorpora(root);

    expect(result.documentCount).toBe(2);
    expect(result.chunkCount).toBe(2);
    expect(result.corpora.map((item) => item.relativePath)).toEqual([
      "labour.json",
      "personal-affairs/law.json",
    ]);
  });

  it("rejects duplicate document IDs", async () => {
    const root = await mkdtemp(join(tmpdir(), "egyptian-law-corpus-"));
    await writeFile(
      join(root, "one.json"),
      JSON.stringify(corpus("doc-1", "chunk-1")),
      "utf8",
    );
    await writeFile(
      join(root, "two.json"),
      JSON.stringify(corpus("doc-1", "chunk-2")),
      "utf8",
    );

    await expect(loadCanonicalCorpora(root)).rejects.toThrow(
      /Duplicate canonical document ID/,
    );
  });

  it("rejects duplicate chunk IDs across corpora", async () => {
    const root = await mkdtemp(join(tmpdir(), "egyptian-law-corpus-"));
    await writeFile(
      join(root, "one.json"),
      JSON.stringify(corpus("doc-1", "chunk-1")),
      "utf8",
    );
    await writeFile(
      join(root, "two.json"),
      JSON.stringify(corpus("doc-2", "chunk-1")),
      "utf8",
    );

    await expect(loadCanonicalCorpora(root)).rejects.toThrow(
      /Duplicate canonical chunk ID/,
    );
  });
});
