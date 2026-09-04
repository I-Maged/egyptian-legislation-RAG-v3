import type { LawChunk } from "@egyptian-law/core";

import type { GenerationCitation } from "./types";

const CITATION_PATTERN = /\[(\d+)\]/g;

export function extractCitationIds(answer: string): string[] {
  const citationIds = new Set<string>();

  for (const match of answer.matchAll(CITATION_PATTERN)) {
    const citationNumber = Number(match[1]);

    if (Number.isInteger(citationNumber) && citationNumber >= 1) {
      citationIds.add(`[${citationNumber}]`);
    }
  }

  return [...citationIds];
}

export function buildCitations(
  answer: string,
  chunks: LawChunk[],
): GenerationCitation[] {
  const referencedIndexes = new Set<number>();

  for (const match of answer.matchAll(CITATION_PATTERN)) {
    const citationNumber = Number(match[1]);

    if (
      Number.isInteger(citationNumber) &&
      citationNumber >= 1 &&
      citationNumber <= chunks.length
    ) {
      referencedIndexes.add(citationNumber);
    }
  }

  return [...referencedIndexes]
    .sort((a, b) => a - b)
    .map((citationNumber) => {
      const chunk = chunks[citationNumber - 1];

      if (!chunk) {
        throw new Error(
          `Citation [${citationNumber}] references an unavailable chunk.`,
        );
      }

      return {
        citationId: `[${citationNumber}]`,

        chunkId: chunk.id,

        lawName: chunk.law_name,
        lawNumber: chunk.law_number,
        year: chunk.year,

        articleNumber: chunk.article_number,
        articleTitle: chunk.article_title,

        sourceFile: chunk.provenance.source_file,

        pageStart: chunk.provenance.page_start,
        pageEnd: chunk.provenance.page_end,
      };
    });
}
