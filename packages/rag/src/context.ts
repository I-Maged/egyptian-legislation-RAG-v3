import type { LawChunk } from "@egyptian-law/core";

import type {
  RagContext,
  RagContextDocument,
  RagRetrievalResult,
} from "./types";

function formatHierarchy(chunk: LawChunk): string[] {
  return chunk.hierarchy
    .map((node) => {
      if (node.title) {
        return `${node.label}: ${node.title}`;
      }

      return node.label;
    })
    .filter((value) => value.trim().length > 0);
}

function formatPageRange(
  pageStart: number | null,
  pageEnd: number | null,
): string {
  if (pageStart === null && pageEnd === null) {
    return "غير محدد";
  }

  if (pageStart !== null && pageEnd !== null) {
    if (pageStart === pageEnd) {
      return String(pageStart);
    }

    return `${pageStart}-${pageEnd}`;
  }

  return String(pageStart ?? pageEnd);
}

function toContextDocument(
  result: RagRetrievalResult,
  index: number,
): RagContextDocument {
  const { chunk } = result;

  return {
    citationId: `[${index + 1}]`,

    chunkId: chunk.id,

    lawName: chunk.law_name,

    lawNumber: chunk.law_number,

    year: chunk.year,

    articleNumber: chunk.article_number,

    articleTitle: chunk.article_title,

    hierarchy: formatHierarchy(chunk),

    text: chunk.text,

    sourceFile: chunk.provenance.source_file,

    pageStart: chunk.provenance.page_start,

    pageEnd: chunk.provenance.page_end,

    vectorScore: result.vectorScore,

    rerankScore: result.rerankScore,
  };
}

export function buildRagContext(results: RagRetrievalResult[]): RagContext {
  const documents = results.map(toContextDocument);

  const sections = documents.map((document) => {
    const hierarchy =
      document.hierarchy.length > 0
        ? document.hierarchy.join(" > ")
        : "غير محدد";

    const articleTitle = document.articleTitle
      ? `\nعنوان المادة: ${document.articleTitle}`
      : "";

    const lawNumber = document.lawNumber
      ? `\nرقم القانون: ${document.lawNumber}`
      : "";

    const year = document.year ? `\nالسنة: ${document.year}` : "";

    const pages = formatPageRange(document.pageStart, document.pageEnd);

    return [
      `المصدر ${document.citationId}`,
      `القانون: ${document.lawName}${lawNumber}${year}`,
      `المادة: ${document.articleNumber}${articleTitle}`,
      `التسلسل الهرمي: ${hierarchy}`,
      `الصفحات: ${pages}`,
      `النص القانوني:`,
      document.text,
    ].join("\n");
  });

  return {
    documents,
    text: sections.join("\n\n--------------------\n\n"),
  };
}
