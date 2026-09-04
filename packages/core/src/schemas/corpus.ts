import { z } from "zod";

import { LawChunkSchema, LawDocumentSchema } from "./law";

export const CanonicalCorpusSchema = z.object({
  schema_version: z.literal("1.0"),

  document: LawDocumentSchema,

  chunks: z.array(LawChunkSchema).min(1),
});

export type CanonicalCorpus = z.infer<typeof CanonicalCorpusSchema>;
