import type { LawChunk } from "@egyptian-law/core";

export interface GenerationContextChunk {
  citationId: string;
  chunk: LawChunk;
}

export function buildGenerationContext(
  chunks: LawChunk[],
): GenerationContextChunk[] {
  return chunks.map((chunk, index) => ({
    citationId: `[${index + 1}]`,
    chunk,
  }));
}

export function formatGenerationContext(chunks: LawChunk[]): string {
  const context = buildGenerationContext(chunks);

  return context
    .map(({ citationId, chunk }) => {
      const hierarchy =
        chunk.hierarchy.length > 0
          ? chunk.hierarchy
              .map((node) =>
                node.title ? `${node.label}: ${node.title}` : node.label,
              )
              .join(" > ")
          : null;

      const pages =
        chunk.provenance.page_start === null
          ? null
          : chunk.provenance.page_end === null ||
              chunk.provenance.page_end === chunk.provenance.page_start
            ? `صفحة ${chunk.provenance.page_start}`
            : `الصفحات ${chunk.provenance.page_start}-${chunk.provenance.page_end}`;

      return [
        citationId,
        `القانون: ${chunk.law_name}`,
        chunk.law_number !== null ? `رقم القانون: ${chunk.law_number}` : null,
        chunk.year !== null ? `السنة: ${chunk.year}` : null,
        `المادة: ${chunk.article_number}`,
        chunk.article_title !== null
          ? `عنوان المادة: ${chunk.article_title}`
          : null,
        hierarchy !== null ? `التصنيف: ${hierarchy}` : null,
        pages !== null
          ? `المصدر: ${chunk.provenance.source_file}، ${pages}`
          : `المصدر: ${chunk.provenance.source_file}`,
        `النص:\n${chunk.text}`,
      ]
        .filter((value): value is string => value !== null)
        .join("\n");
    })
    .join("\n\n------------------------------\n\n");
}
