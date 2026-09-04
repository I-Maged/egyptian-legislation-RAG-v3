import { z } from "zod";

export const LawDocumentSchema = z.object({
  id: z.string(),

  law_name: z.string(),
  law_number: z.string().nullable(),
  year: z.string().nullable(),

  jurisdiction: z.literal("EG"),
  language: z.literal("ar"),

  source_file: z.string(),

  metadata: z.object({
    parser_version: z.string(),
    normalization_version: z.string(),
  }),
});

export const LawHierarchyNodeSchema = z.object({
  type: z.string(),
  label: z.string(),
  title: z.string().nullable(),
});

export const LawChunkSchema = z.object({
  id: z.string(),

  document_id: z.string(),

  law_name: z.string(),
  law_number: z.string().nullable(),
  year: z.string().nullable(),

  article_number: z.string(),
  article_title: z.string().nullable(),

  source_order: z.number().int().nonnegative().nullable(),

  hierarchy: z.array(LawHierarchyNodeSchema),

  text: z.string(),
  text_for_embedding: z.string(),

  provenance: z.object({
    source_file: z.string(),
    page_start: z.number().int().positive().nullable(),
    page_end: z.number().int().positive().nullable(),
  }),

  metadata: z.object({
    parser_version: z.string(),
    normalization_version: z.string(),
    ocr_confidence: z.number().min(0).max(1).nullable(),
  }),
});
