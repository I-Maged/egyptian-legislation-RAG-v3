import { CanonicalCorpusSchema, type CanonicalCorpus } from "../schemas/corpus";

export function validateCanonicalCorpus(corpus: unknown): CanonicalCorpus {
  const parsed = CanonicalCorpusSchema.parse(corpus);

  const chunkIds = new Set<string>();

  for (const chunk of parsed.chunks) {
    if (chunk.document_id !== parsed.document.id) {
      throw new Error(
        `Chunk ${chunk.id} references document ` +
          `${chunk.document_id}, expected ${parsed.document.id}.`,
      );
    }

    if (chunkIds.has(chunk.id)) {
      throw new Error(`Duplicate chunk ID: ${chunk.id}`);
    }

    chunkIds.add(chunk.id);
  }

  return parsed;
}
