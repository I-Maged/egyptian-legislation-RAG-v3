// npm run financial-law-benchmark-comparison --workspace @egyptian-law/evaluation

import { readFile } from "fs/promises";
import { resolve } from "path";

import { describe, expect, it } from "vitest";

import type { CanonicalCorpus, EmbeddingArtifact } from "@egyptian-law/core";

import {
  InMemoryBm25Retriever,
  InMemoryVectorRetriever,
  HybridRetriever,
  OllamaEmbeddingProvider,
} from "@egyptian-law/ingestion";

import { buildFinancialLawGoldDataset } from "../datasets/financial-law-gold";

import { runRetrievalBenchmark } from "./retrieval-benchmark";

const RUN_REAL_BENCHMARK = process.env.RUN_FINANCIAL_LAW_BENCHMARK === "1";

const CORPUS_PATH = resolve(
  process.cwd(),
  "data/canonical/financial-law-18-2019.json",
);

const EMBEDDING_ARTIFACT_PATH = resolve(
  process.cwd(),
  "data/embeddings/financial-law-18-2019.json",
);

async function readJsonFile<T>(path: string): Promise<T> {
  const json = await readFile(path, "utf8");

  return JSON.parse(json) as T;
}

async function loadfINANCIALLawCorpus(): Promise<CanonicalCorpus> {
  return readJsonFile<CanonicalCorpus>(CORPUS_PATH);
}

async function loadfINANCIALLawEmbeddingArtifact(): Promise<EmbeddingArtifact> {
  return readJsonFile<EmbeddingArtifact>(EMBEDDING_ARTIFACT_PATH);
}

interface DiagnosticResult {
  rank: number;
  chunkId: string;
  articleNumber: string;
  score: number;
  relevant: boolean;
}

interface QueryDiagnostics {
  queryId: string;
  query: string;
  goldArticles: string[];
  goldChunkIds: string[];

  bm25: DiagnosticResult[];
  vector: DiagnosticResult[];
  hybrid: DiagnosticResult[];

  bm25FirstRelevantRank: number | null;
  vectorFirstRelevantRank: number | null;
  hybridFirstRelevantRank: number | null;
}

function firstRelevantRank(results: DiagnosticResult[]): number | null {
  const result = results.find((result) => result.relevant);

  return result?.rank ?? null;
}

function formatRank(rank: number | null): string {
  return rank === null ? "MISS" : String(rank);
}

describe.skipIf(!RUN_REAL_BENCHMARK)(
  "Financial Law retrieval benchmark",
  () => {
    it("evaluates BM25, vector, and hybrid retrieval on the real corpus", async () => {
      const corpus = await loadfINANCIALLawCorpus();

      const embeddingArtifact = await loadfINANCIALLawEmbeddingArtifact();

      expect(corpus.chunks.length).toBeGreaterThan(0);

      expect(embeddingArtifact.records.length).toBe(corpus.chunks.length);

      expect(embeddingArtifact.dimensions).toBeGreaterThan(0);

      const gold = buildFinancialLawGoldDataset(corpus);

      expect(gold.items).toHaveLength(65);

      /*
       * The query embedding model must match the model
       * used to create the corpus embeddings.
       */
      const embeddingProvider = new OllamaEmbeddingProvider({
        model: embeddingArtifact.model,
        dimensions: embeddingArtifact.dimensions,
      });

      const bm25Retriever = new InMemoryBm25Retriever(corpus);

      const vectorRetriever = new InMemoryVectorRetriever(
        corpus,
        embeddingArtifact,
      );

      const hybridRetriever = new HybridRetriever(corpus, embeddingArtifact);

      /*
       * ------------------------------------------------------------
       * Normal benchmark retrieval functions
       * ------------------------------------------------------------
       */

      const bm25Retrieve = async (query: string): Promise<string[]> => {
        return bm25Retriever
          .search(query, {
            topK: 10,
          })
          .map((result) => result.chunk.id);
      };

      const vectorRetrieve = async (query: string): Promise<string[]> => {
        const [queryEmbedding] = await embeddingProvider.embed([query]);

        if (!queryEmbedding) {
          throw new Error("Ollama returned no query embedding.");
        }

        return vectorRetriever
          .search(queryEmbedding, {
            topK: 10,
          })
          .map((result) => result.chunk.id);
      };

      const hybridRetrieve = async (query: string): Promise<string[]> => {
        const [queryEmbedding] = await embeddingProvider.embed([query]);

        if (!queryEmbedding) {
          throw new Error("Ollama returned no query embedding.");
        }

        return hybridRetriever
          .search(query, queryEmbedding, {
            topK: 10,
            vectorTopK: 20,
            bm25TopK: 20,
          })
          .map((result) => result.chunk.id);
      };

      /*
       * ------------------------------------------------------------
       * Aggregate benchmark
       * ------------------------------------------------------------
       */

      const benchmark = await runRetrievalBenchmark(gold, {
        systems: [
          {
            name: "bm25",
            retrieve: bm25Retrieve,
          },
          {
            name: "vector",
            retrieve: vectorRetrieve,
          },
          {
            name: "hybrid",
            retrieve: hybridRetrieve,
          },
        ],
        recallAt: [1, 3, 5, 10],
        precisionAt: [5, 10],
        ndcgAt: [5, 10],
        includeMrr: true,
      });

      expect(benchmark.datasetName).toBe("financial-law-retrieval-v1");

      expect(benchmark.queryCount).toBe(65);

      expect(benchmark.systems).toHaveLength(3);

      for (const system of benchmark.systems) {
        const result = system.result;

        expect(result.queryCount).toBe(65);

        expect(Object.keys(result.recall)).toEqual(["1", "3", "5", "10"]);

        expect(Object.keys(result.precision)).toEqual(["5", "10"]);

        expect(Object.keys(result.ndcg)).toEqual(["5", "10"]);

        expect(Number.isFinite(result.mrr)).toBe(true);

        for (const value of Object.values(result.recall)) {
          expect(Number.isFinite(value)).toBe(true);
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(1);
        }

        for (const value of Object.values(result.precision)) {
          expect(Number.isFinite(value)).toBe(true);
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(1);
        }

        for (const value of Object.values(result.ndcg)) {
          expect(Number.isFinite(value)).toBe(true);
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(1);
        }
      }

      console.table(
        benchmark.systems.map((system) => ({
          system: system.name,
          "R@1": system.result.recall["1"]?.toFixed(4),
          "R@3": system.result.recall["3"]?.toFixed(4),
          "R@5": system.result.recall["5"]?.toFixed(4),
          "R@10": system.result.recall["10"]?.toFixed(4),
          "P@5": system.result.precision["5"]?.toFixed(4),
          "P@10": system.result.precision["10"]?.toFixed(4),
          MRR: system.result.mrr.toFixed(4),
          "nDCG@5": system.result.ndcg["5"]?.toFixed(4),
          "nDCG@10": system.result.ndcg["10"]?.toFixed(4),
        })),
      );

      /*
       * ------------------------------------------------------------
       * Detailed per-query diagnostics
       * ------------------------------------------------------------
       */

      const diagnostics: QueryDiagnostics[] = [];

      for (const item of gold.items) {
        const goldChunkIds = new Set(item.relevantChunkIds);

        const corpusChunkById = new Map(
          corpus.chunks.map((chunk) => [chunk.id, chunk]),
        );

        const bm25Results = bm25Retriever.search(item.query, {
          topK: 10,
        });

        const [queryEmbedding] = await embeddingProvider.embed([item.query]);

        if (!queryEmbedding) {
          throw new Error(`Ollama returned no query embedding for ${item.id}.`);
        }

        const vectorResults = vectorRetriever.search(queryEmbedding, {
          topK: 10,
        });

        const hybridResults = hybridRetriever.search(
          item.query,
          queryEmbedding,
          {
            topK: 10,
            vectorTopK: 20,
            bm25TopK: 20,
          },
        );

        const bm25 = bm25Results.map(
          (result, index): DiagnosticResult => ({
            rank: index + 1,
            chunkId: result.chunk.id,
            articleNumber: result.chunk.article_number,
            score: result.score,
            relevant: goldChunkIds.has(result.chunk.id),
          }),
        );

        const vector = vectorResults.map(
          (result, index): DiagnosticResult => ({
            rank: index + 1,
            chunkId: result.chunk.id,
            articleNumber: result.chunk.article_number,
            score: result.score,
            relevant: goldChunkIds.has(result.chunk.id),
          }),
        );

        const hybrid = hybridResults.map(
          (result, index): DiagnosticResult => ({
            rank: index + 1,
            chunkId: result.chunk.id,
            articleNumber: result.chunk.article_number,
            score: result.score,
            relevant: goldChunkIds.has(result.chunk.id),
          }),
        );

        const goldArticles = [
          ...new Set(
            item.relevantChunkIds
              .map((chunkId) => corpusChunkById.get(chunkId)?.article_number)
              .filter(
                (articleNumber): articleNumber is string =>
                  articleNumber !== undefined,
              ),
          ),
        ];

        diagnostics.push({
          queryId: item.id,
          query: item.query,
          goldArticles,
          goldChunkIds: item.relevantChunkIds,

          bm25,
          vector,
          hybrid,

          bm25FirstRelevantRank: firstRelevantRank(bm25),
          vectorFirstRelevantRank: firstRelevantRank(vector),
          hybridFirstRelevantRank: firstRelevantRank(hybrid),
        });
      }

      /*
       * ------------------------------------------------------------
       * Print compact diagnostic summary
       * ------------------------------------------------------------
       */

      console.log(
        "\n\n============================================================",
      );

      console.log("FINANCIAL LAW RETRIEVAL DIAGNOSTICS");

      console.log(
        "============================================================\n",
      );

      console.table(
        diagnostics.map((diagnostic) => ({
          id: diagnostic.queryId,
          query: diagnostic.query,

          gold: diagnostic.goldArticles.join(", "),

          BM25: formatRank(diagnostic.bm25FirstRelevantRank),

          Vector: formatRank(diagnostic.vectorFirstRelevantRank),

          Hybrid: formatRank(diagnostic.hybridFirstRelevantRank),
        })),
      );

      /*
       * ------------------------------------------------------------
       * Print detailed rankings
       * ------------------------------------------------------------
       */

      // for (const diagnostic of diagnostics) {
      //   console.log(
      //     "\n------------------------------------------------------------",
      //   );

      //   console.log(`${diagnostic.queryId}: ${diagnostic.query}`);

      //   console.log(`Gold articles: ${diagnostic.goldArticles.join(", ")}`);

      //   console.log(`Gold chunks: ${diagnostic.goldChunkIds.join(", ")}`);

      //   console.log("\nBM25:");

      //   console.table(
      //     diagnostic.bm25.map((result) => ({
      //       rank: result.rank,
      //       article: result.articleNumber,
      //       score: result.score.toFixed(6),
      //       relevant: result.relevant ? "✓" : "✗",
      //       chunk: result.chunkId,
      //     })),
      //   );

      //   console.log("Vector:");

      //   console.table(
      //     diagnostic.vector.map((result) => ({
      //       rank: result.rank,
      //       article: result.articleNumber,
      //       score: result.score.toFixed(6),
      //       relevant: result.relevant ? "✓" : "✗",
      //       chunk: result.chunkId,
      //     })),
      //   );

      //   console.log("Hybrid:");

      //   console.table(
      //     diagnostic.hybrid.map((result) => ({
      //       rank: result.rank,
      //       article: result.articleNumber,
      //       score: result.score.toFixed(6),
      //       relevant: result.relevant ? "✓" : "✗",
      //       chunk: result.chunkId,
      //     })),
      //   );
      // }

      /*
       * ------------------------------------------------------------
       * Aggregate diagnostic statistics
       * ------------------------------------------------------------
       */

      const countHits = (key: "bm25" | "vector" | "hybrid"): number => {
        return diagnostics.filter(
          (diagnostic) => diagnostic[`${key}FirstRelevantRank`] !== null,
        ).length;
      };

      console.log(
        "\n\n============================================================",
      );

      console.log("DIAGNOSTIC SUMMARY");

      console.log(
        "============================================================",
      );

      console.table([
        {
          system: "bm25",
          queriesWithRelevantTop10: countHits("bm25"),
          queriesMissed: 65 - countHits("bm25"),
        },
        {
          system: "vector",
          queriesWithRelevantTop10: countHits("vector"),
          queriesMissed: 65 - countHits("vector"),
        },
        {
          system: "hybrid",
          queriesWithRelevantTop10: countHits("hybrid"),
          queriesMissed: 65 - countHits("hybrid"),
        },
      ]);
    }, 120_000);
  },
);
