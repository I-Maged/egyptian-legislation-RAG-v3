import { readFile } from "fs/promises";
import { resolve } from "path";

import { describe, expect, it } from "vitest";
import type { ParserOutput } from "../parser/types";
import { validateCanonicalCorpus } from "@egyptian-law/core";
import { canonicalizePersonalAffairsBundle } from "./personal-affairs";

describe("canonicalizePersonalAffairsBundle", () => {
  it("splits the complete V3 Personal Affairs compilation into one corpus per instrument", async () => {
    const inputPath = resolve(
      process.cwd(),
      "data/output/personal-bundle-v3.json",
    );
    const parserOutput = JSON.parse(
      await readFile(inputPath, "utf8"),
    ) as ParserOutput;

    const corpora = canonicalizePersonalAffairsBundle(parserOutput);

    expect(corpora).toHaveLength(14);
    expect(
      corpora.every((corpus) => {
        const validated = validateCanonicalCorpus(corpus);
        return JSON.stringify(validated) === JSON.stringify(corpus);
      }),
    ).toBe(true);
    expect(new Set(corpora.map((corpus) => corpus.document.id)).size).toBe(14);
    expect(
      corpora.reduce((total, corpus) => total + corpus.chunks.length, 0),
    ).toBe(426);

    for (const corpus of corpora) {
      expect(corpus.document.law_name).toBeTruthy();
      expect(corpus.document.law_number).not.toBeNull();
      expect(corpus.document.year).not.toBeNull();
      expect(corpus.chunks.length).toBeGreaterThan(0);
      expect(
        corpus.chunks.every(
          (chunk) => chunk.document_id === corpus.document.id,
        ),
      ).toBe(true);
      expect(new Set(corpus.chunks.map((chunk) => chunk.id)).size).toBe(
        corpus.chunks.length,
      );
    }
  });

  it("is deterministic", async () => {
    const inputPath = resolve(
      process.cwd(),
      "data/output/personal-bundle-v3.json",
    );
    const parserOutput = JSON.parse(
      await readFile(inputPath, "utf8"),
    ) as ParserOutput;

    const first = canonicalizePersonalAffairsBundle(parserOutput);
    const second = canonicalizePersonalAffairsBundle(parserOutput);

    expect(second).toEqual(first);
  });
});
