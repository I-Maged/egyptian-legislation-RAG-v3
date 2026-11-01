import { z } from "zod";

export const EmbeddingRecordSchema = z.object({
  chunk_id: z.string().min(1),
  embedding: z.array(z.number().finite()),
  model: z.string().min(1),
  dimensions: z.number().int().positive(),
});

export const EmbeddingArtifactSchema = z.object({
  schema_version: z.literal("1.0"),

  model: z.string().min(1),
  dimensions: z.number().int().positive(),

  records: z.array(EmbeddingRecordSchema),
});

export type EmbeddingRecordSchemaType = z.infer<typeof EmbeddingRecordSchema>;
export type EmbeddingArtifactSchemaType = z.infer<
  typeof EmbeddingArtifactSchema
>;