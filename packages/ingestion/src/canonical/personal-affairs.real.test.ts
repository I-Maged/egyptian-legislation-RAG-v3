import { readFile } from "fs/promises";
import { resolve } from "path";

import { describe, expect, it } from "vitest";
import { validateCanonicalCorpus } from "@egyptian-law/core";
import type { ParserOutput } from "../parser/types";
import { canonicalizePersonalAffairsLaw } from "./personal-affairs";

describe("canonicalizePersonalAffairsLaw - real V3.3 output", () => {
  it("canonicalizes a real Personal Affairs instrument from the complete V3.3 compilation", async () => {
    const inputPath = resolve(
      process.cwd(),
      "data/output/personal-bundle-v3.json",
    );
    const parserOutput = JSON.parse(
      await readFile(inputPath, "utf8"),
    ) as ParserOutput;

    const instrument = parserOutput.instruments.find(
      (item) => item.id === "personal-law-25-1920",
    );

    expect(instrument).toBeDefined();

    const articles = parserOutput.articles.filter(
      (article) => article.instrumentId === "personal-law-25-1920",
    );

    expect(articles).toHaveLength(13);

    const result = canonicalizePersonalAffairsLaw({
      metadataResolved: {
        lawName: instrument!.lawName,
        lawNumber: instrument!.lawNumber,
        year: instrument!.year,
      },
      articles,
    });

    expect(validateCanonicalCorpus(result)).toEqual(result);
    expect(result.schema_version).toBe("1.0");
    expect(result.document.law_name).toBe("personal_affairs");
    expect(result.document.law_number).toBe("25");
    expect(result.document.year).toBe("1920");
    expect(result.document.jurisdiction).toBe("EG");
    expect(result.document.language).toBe("ar");
    expect(result.document.source_file).toBe("personal_affair_law.pdf");

    expect(result.chunks).toHaveLength(13);
    expect(new Set(result.chunks.map((chunk) => chunk.id)).size).toBe(13);

    for (let i = 0; i < articles.length; i++) {
      const source = articles[i]!;
      const chunk = result.chunks[i]!;

      expect(chunk.document_id).toBe(result.document.id);
      expect(chunk.law_name).toBe(source.lawName);
      expect(chunk.law_number).toBe(source.lawNumber);
      expect(chunk.year).toBe(source.year);
      expect(chunk.article_number).toBe(source.articleNumber);
      expect(chunk.text).toBe(source.text);
      expect(chunk.text_for_embedding).toBe(source.textForEmbedding);
      expect(chunk.source_order).toBe(source.sourceOrder);
      expect(chunk.provenance.page_start).toBe(source.pageStart);
      expect(chunk.provenance.page_end).toBe(source.pageEnd);
    }

    expect(result.chunks.every((chunk) => chunk.text.trim().length > 0)).toBe(
      true,
    );
    expect(
      result.chunks.every(
        (chunk) => chunk.text_for_embedding.trim().length > 0,
      ),
    ).toBe(true);
    expect(
      result.chunks.every(
        (chunk) =>
          chunk.metadata.parser_version === "parser-v3.3.0" &&
          chunk.metadata.normalization_version === "parser-v3.3.0",
      ),
    ).toBe(true);
  });
});
