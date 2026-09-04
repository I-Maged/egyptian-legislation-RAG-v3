import type { LawChunk, LawDocument } from "@egyptian-law/core";

export interface CanonicalCorpus {
  schema_version: "1.0";
  document: LawDocument;
  chunks: LawChunk[];
}
