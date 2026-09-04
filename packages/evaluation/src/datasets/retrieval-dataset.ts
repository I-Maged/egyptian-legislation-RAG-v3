import type { CanonicalCorpus } from "@egyptian-law/core";

export interface RetrievalGoldItem {
  id: string;
  query: string;

  /**
   * Chunk IDs that are relevant to answering the query.
   */
  relevantChunkIds: string[];

  /**
   * Optional graded relevance.
   *
   * 3 = highly relevant
   * 2 = relevant
   * 1 = marginally relevant
   */
  relevance?: Record<string, number>;
}

export interface RetrievalGoldDataset {
  schema_version: "1.0";
  name: string;
  description: string;
  language: "ar";
  jurisdiction: "EG";
  items: RetrievalGoldItem[];
}

export function validateRetrievalGoldDataset(
  dataset: RetrievalGoldDataset,
  corpus?: CanonicalCorpus,
): void {
  if (dataset.schema_version !== "1.0") {
    throw new Error(
      `Unsupported retrieval dataset schema version: ${dataset.schema_version}`,
    );
  }

  if (dataset.language !== "ar") {
    throw new Error(`Invalid dataset language: ${dataset.language}`);
  }

  if (dataset.jurisdiction !== "EG") {
    throw new Error(`Invalid dataset jurisdiction: ${dataset.jurisdiction}`);
  }

  if (!dataset.name.trim()) {
    throw new Error("Dataset name cannot be empty.");
  }

  if (dataset.items.length === 0) {
    throw new Error("Retrieval dataset cannot be empty.");
  }

  const queryIds = new Set<string>();

  const corpusChunkIds = corpus
    ? new Set(corpus.chunks.map((chunk) => chunk.id))
    : null;

  for (const item of dataset.items) {
    if (!item.id.trim()) {
      throw new Error("Retrieval query ID cannot be empty.");
    }

    if (queryIds.has(item.id)) {
      throw new Error(`Duplicate retrieval query ID: ${item.id}`);
    }

    queryIds.add(item.id);

    if (!item.query.trim()) {
      throw new Error(`Empty query for retrieval item: ${item.id}`);
    }

    if (item.relevantChunkIds.length === 0) {
      throw new Error(`No relevant chunks for retrieval item: ${item.id}`);
    }

    const relevantIds = new Set<string>();

    for (const chunkId of item.relevantChunkIds) {
      if (!chunkId.trim()) {
        throw new Error(`Empty relevant chunk ID in item: ${item.id}`);
      }

      if (relevantIds.has(chunkId)) {
        throw new Error(
          `Duplicate relevant chunk ID "${chunkId}" in item: ${item.id}`,
        );
      }

      relevantIds.add(chunkId);

      if (corpusChunkIds && !corpusChunkIds.has(chunkId)) {
        throw new Error(`Unknown chunk ID "${chunkId}" in item: ${item.id}`);
      }
    }

    if (item.relevance) {
      for (const [chunkId, score] of Object.entries(item.relevance)) {
        if (!relevantIds.has(chunkId)) {
          throw new Error(
            `Relevance entry "${chunkId}" is not in relevantChunkIds for item: ${item.id}`,
          );
        }

        if (!Number.isInteger(score) || score < 1 || score > 3) {
          throw new Error(
            `Invalid relevance score for "${chunkId}" in item: ${item.id}`,
          );
        }
      }
    }
  }
}
