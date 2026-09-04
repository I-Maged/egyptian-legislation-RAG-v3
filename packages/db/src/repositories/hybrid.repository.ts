import {
  searchSimilarEmbeddings,
  type VectorSearchResult,
} from "./vector.repository";

export interface HybridSearchInput {
  query: string;
  queryEmbedding: number[];

  topK?: number;
  vectorTopK?: number;

  lawDocumentId?: string;
}

export interface HybridSearchResult {
  chunkId: string;

  score: number;

  vectorScore: number;

  vectorRank: number;
}

const DEFAULT_TOP_K = 10;

export async function searchHybrid(
  input: HybridSearchInput,
): Promise<HybridSearchResult[]> {
  const query = input.query.trim();

  if (!query) {
    return [];
  }

  const topK = input.topK ?? DEFAULT_TOP_K;
  const vectorTopK = input.vectorTopK ?? topK;

  validateOptions({
    topK,
    vectorTopK,
  });

  const vectorSearchInput = {
    queryEmbedding: input.queryEmbedding,
    topK: vectorTopK,
    ...(input.lawDocumentId !== undefined
      ? { lawDocumentId: input.lawDocumentId }
      : {}),
  };

  const vectorResults = await searchSimilarEmbeddings(vectorSearchInput);

  return vectorResults
    .map(
      (result: VectorSearchResult, index): HybridSearchResult => ({
        chunkId: result.chunkId,
        score: result.score,
        vectorScore: result.score,
        vectorRank: index + 1,
      }),
    )
    .slice(0, topK);
}

function validateOptions(options: { topK: number; vectorTopK: number }): void {
  const { topK, vectorTopK } = options;

  if (!Number.isInteger(topK) || topK <= 0) {
    throw new Error(`Invalid topK: ${topK}`);
  }

  if (!Number.isInteger(vectorTopK) || vectorTopK <= 0) {
    throw new Error(`Invalid vectorTopK: ${vectorTopK}`);
  }
}
