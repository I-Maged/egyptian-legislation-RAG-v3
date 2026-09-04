export {
  getChunksByIds,
} from "./repositories/corpus.repository";

export { prisma } from "./client";

export {
  upsertEmbedding,
  upsertEmbeddings,
  replaceEmbeddingIndex,
} from "./repositories/embedding.repository";

export type { UpsertEmbeddingInput } from "./repositories/embedding.repository";

export { upsertCorpus } from "./repositories/corpus.repository";

export { searchSimilarEmbeddings } from "./repositories/vector.repository";

export type {
  VectorSearchInput,
  VectorSearchResult,
} from "./repositories/vector.repository";

export { searchBm25 } from "./repositories/bm25.repository";

export type {
  Bm25SearchInput,
  Bm25SearchResult,
} from "./repositories/bm25.repository";

export { searchHybrid } from "./repositories/hybrid.repository";

export type {
  HybridSearchInput,
  HybridSearchResult,
} from "./repositories/hybrid.repository";

export * from "./repositories/conversation.repository";

export * from "./repositories/law.repository";

export * from "./repositories/analytics.repository";

export * from "./repositories/feedback.repository";

export * from "./repositories/admin-stats.repository";
