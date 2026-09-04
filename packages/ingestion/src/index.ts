export { PostgresVectorRetriever } from "./retrieval/db-vector-retriever";

export * from "./retrieval/reranker";

// Re-export retrieval classes
export { InMemoryBm25Retriever } from "./retrieval/bm25-retriever";
export { InMemoryVectorRetriever } from "./retrieval/vector-retriever";
export { HybridRetriever } from "./retrieval/hybrid-retriever";

// Re-export embedding provider
export { OllamaEmbeddingProvider } from "./embeddings/ollama-provider";
export type { DbVectorRetrievalResult } from "./retrieval/db-vector-retriever";

export { loadCanonicalCorpora } from "./corpus/load-canonical";
export type { CanonicalCorpusSet, LoadedCanonicalCorpus } from "./corpus/load-canonical";
