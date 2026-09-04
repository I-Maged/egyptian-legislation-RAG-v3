// packages/evaluation/src/benchmarks/labour-law-benchmark.test.ts
//
// Run:
//
//   $env:RUN_LABOUR_LAW_BENCHMARK="1"
//   npx vitest run packages/evaluation/src/benchmarks/labour-law-benchmark.test.ts
//   $env:RUN_LABOUR_LAW_BENCHMARK="1"; $env:LABOUR_LAW_GENERATION_MODEL="gemma4:cloud"; $env:LABOUR_LAW_JUDGE_MODEL="gemma4:cloud"; $env:LABOUR_LAW_GENERATION_CONCURRENCY="3"; $env:LABOUR_LAW_JUDGE_CONCURRENCY="3"; npx vitest run packages/evaluation/src/benchmarks/labour-law-benchmark.test.ts
//
//
//
// Optional:
//
//   $env:LABOUR_LAW_GENERATION_MODEL="gemma4:cloud"
//   $env:LABOUR_LAW_JUDGE_MODEL="gemma4:cloud"
//   $env:LABOUR_LAW_GENERATION_CONCURRENCY="3"
//   $env:LABOUR_LAW_JUDGE_CONCURRENCY="3"
//
// This is an integration benchmark.
// It requires:
//   - PostgreSQL + pgvector
//   - Labour Law canonical corpus
//   - Labour Law embedding artifact
//   - Ollama generation access
//   - Ollama judge access

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import type {
  CanonicalCorpus,
  EmbeddingArtifact,
  LawChunk,
} from "@egyptian-law/core";

import { OllamaEmbeddingProvider } from "@egyptian-law/ingestion";

import { getChunksByIds } from "@egyptian-law/db";

import {
  OllamaGenerationProvider,
  generateAnswer,
} from "@egyptian-law/generation";

import { GenerationEvaluator, LlmGenerationJudge } from "../generation";

import { buildLabourLawGoldDataset } from "../datasets/labour-law-gold";

import {
  createDbVectorRerankedRetriever,
  createDbVectorRetriever,
} from "./db-retrieval-adapters";

import { runRetrievalBenchmark } from "./retrieval-benchmark";
import { runContextBenchmark } from "./context-benchmark";

const RUN_REAL_BENCHMARK = process.env.RUN_LABOUR_LAW_BENCHMARK === "1";

const CORPUS_PATH = resolve(
  process.cwd(),
  "data/canonical/labour-law-148-2019.json",
);

const EMBEDDING_ARTIFACT_PATH = resolve(
  process.cwd(),
  "data/embeddings/labour-law-148-2019.json",
);

const EXPERIMENT_RESULTS_PATH = resolve(
  process.cwd(),
  "data/evaluation/labour-law/experiment-results.json",
);

const GENERATION_MODEL =
  process.env.LABOUR_LAW_GENERATION_MODEL ?? "gemma4:cloud";

const JUDGE_MODEL = process.env.LABOUR_LAW_JUDGE_MODEL ?? "gemma4:cloud";

const GENERATION_CONCURRENCY = parsePositiveInteger(
  process.env.LABOUR_LAW_GENERATION_CONCURRENCY,
  3,
);

const JUDGE_CONCURRENCY = parsePositiveInteger(
  process.env.LABOUR_LAW_JUDGE_CONCURRENCY,
  3,
);

const PASS_THRESHOLD = 0.7;

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

async function readJsonFile<T>(path: string): Promise<T> {
  const json = await readFile(path, "utf8");

  return JSON.parse(json) as T;
}

async function loadLabourLawCorpus(): Promise<CanonicalCorpus> {
  return readJsonFile<CanonicalCorpus>(CORPUS_PATH);
}

async function loadLabourLawEmbeddingArtifact(): Promise<EmbeddingArtifact> {
  return readJsonFile<EmbeddingArtifact>(EMBEDDING_ARTIFACT_PATH);
}

/**
 * Bounded-concurrency worker pool.
 *
 * Important:
 *
 * With noUncheckedIndexedAccess enabled, items[index] has the type
 * T | undefined. We explicitly guard it before passing it to worker.
 */
async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) {
    return [];
  }

  const workerCount = Math.min(Math.max(1, concurrency), items.length);

  const results = new Array<R>(items.length);

  let nextIndex = 0;

  async function runWorker(): Promise<void> {
    while (true) {
      const index = nextIndex++;

      if (index >= items.length) {
        return;
      }

      const item = items[index];

      if (item === undefined) {
        throw new Error(
          `Internal benchmark error: missing item at index ${index}.`,
        );
      }

      results[index] = await worker(item, index);
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => runWorker()));

  return results;
}

interface DiagnosticResult {
  rank: number;
  chunkId: string;
  articleNumber: string;
  relevant: boolean;
}

interface QueryDiagnostics {
  queryId: string;
  query: string;
  goldArticles: string[];
  goldChunkIds: string[];

  vector: DiagnosticResult[];
  vectorReranked: DiagnosticResult[];

  vectorFirstRelevantRank: number | null;
  vectorRerankedFirstRelevantRank: number | null;
}

function firstRelevantRank(results: DiagnosticResult[]): number | null {
  const result = results.find((candidate) => candidate.relevant);

  return result?.rank ?? null;
}

function formatRank(rank: number | null): string {
  return rank === null ? "MISS" : String(rank);
}

interface GenerationBenchmarkItem {
  id: string;
  query: string;

  contextChunkIds: string[];
  context: string[];

  referenceChunkIds: string[];

  referenceAnswer: string;
}

interface GeneratedAnswer {
  answer: string;

  citations: Array<{
    citationId: string;
    chunkId: string;
  }>;
}

interface GenerationSystemResult {
  name: string;

  result: Awaited<ReturnType<GenerationEvaluator["evaluate"]>>;
}

function printRetrievalBenchmark(
  benchmark: Awaited<ReturnType<typeof runRetrievalBenchmark>>,
): void {
  console.log(
    "\n\n============================================================",
  );

  console.log("LABOUR LAW VECTOR RETRIEVAL BENCHMARK");

  console.log("============================================================\n");

  console.table(
    benchmark.systems.map((system) => ({
      system: system.name,

      "R@1": system.result.recall["1"]?.toFixed(4),
      "R@3": system.result.recall["3"]?.toFixed(4),
      "R@5": system.result.recall["5"]?.toFixed(4),
      "R@10": system.result.recall["10"]?.toFixed(4),

      "P@5": system.result.precision["5"]?.toFixed(4),
      "P@10": system.result.precision["10"]?.toFixed(4),

      "Hit@1": system.result.hitRate["1"]?.toFixed(4),
      "Hit@3": system.result.hitRate["3"]?.toFixed(4),
      "Hit@5": system.result.hitRate["5"]?.toFixed(4),
      "Hit@10": system.result.hitRate["10"]?.toFixed(4),

      MRR: system.result.mrr.toFixed(4),

      "nDCG@5": system.result.ndcg["5"]?.toFixed(4),
      "nDCG@10": system.result.ndcg["10"]?.toFixed(4),
    })),
  );
}

function printContextBenchmark(
  contextBenchmark: Awaited<ReturnType<typeof runContextBenchmark>>,
): void {
  console.log(
    "\n\n============================================================",
  );

  console.log("LABOUR LAW CONTEXT EVALUATION");

  console.log("============================================================\n");

  console.table(
    contextBenchmark.systems.map((system) => ({
      system: system.name,

      "C-Recall": system.result.contextRecall.toFixed(4),

      "C-Precision": system.result.contextPrecision.toFixed(4),

      "C-HitRate": system.result.contextHitRate.toFixed(4),
    })),
  );
}

function printGenerationBenchmark(results: GenerationSystemResult[]): void {
  console.log(
    "\n\n============================================================",
  );

  console.log("LABOUR LAW GENERATION EVALUATION");

  console.log("============================================================\n");

  console.table(
    results.map((system) => {
      const result = system.result;

      const passRate =
        result.queryCount === 0
          ? 0
          : result.perQuery.filter((query) => query.passed).length /
            result.queryCount;

      return {
        system: system.name,

        queries: result.queryCount,

        correctness: result.correctness.toFixed(4),

        faithfulness: result.faithfulness.toFixed(4),

        citationCorrectness: result.citationCorrectness.toFixed(4),

        passRate: passRate.toFixed(4),
      };
    }),
  );
}

function extractCitationChunkIds(
  citations: Array<{
    citationId: string;
    chunkId: string;
  }>,
): string[] {
  return citations.map((citation) => citation.chunkId);
}

async function writeExperimentResults(
  benchmark: Awaited<ReturnType<typeof runRetrievalBenchmark>>,
  contextBenchmark: Awaited<ReturnType<typeof runContextBenchmark>>,
  generationSystems: GenerationSystemResult[],
  diagnostics: QueryDiagnostics[],
  corpus: CanonicalCorpus,
  embeddingArtifact: EmbeddingArtifact,
): Promise<void> {
  const generationEvaluation = Object.fromEntries(
    generationSystems.map((system) => {
      const result = system.result;

      const passRate =
        result.queryCount === 0
          ? 0
          : result.perQuery.filter((query) => query.passed).length /
            result.queryCount;

      return [
        system.name,
        {
          queryCount: result.queryCount,
          correctness: result.correctness,
          faithfulness: result.faithfulness,
          citationCorrectness: result.citationCorrectness,
          passRate,
        },
      ];
    }),
  );

  const retrieval = Object.fromEntries(
    benchmark.systems.map((system) => [
      system.name,
      {
        queryCount: system.result.queryCount,
        recall: system.result.recall,
        precision: system.result.precision,
        hitRate: system.result.hitRate,
        mrr: system.result.mrr,
        ndcg: system.result.ndcg,
      },
    ]),
  );

  const context = Object.fromEntries(
    contextBenchmark.systems.map((system) => [
      system.name,
      {
        queryCount: system.result.queryCount,
        contextRecall: system.result.contextRecall,
        contextPrecision: system.result.contextPrecision,
        contextHitRate: system.result.contextHitRate,
      },
    ]),
  );

  const results = {
    schemaVersion: "1.0",
    experiment: {
      name: "labour-law-retrieval-generation-v1",
      timestamp: new Date().toISOString(),
      dataset: "labour-law-retrieval-v1",
      queryCount: benchmark.queryCount,
    },

    corpus: {
      documentId: corpus.document.id,
      sourceFile: corpus.document.source_file,
      chunkCount: corpus.chunks.length,
    },

    embedding: {
      model: embeddingArtifact.model,
      dimensions: embeddingArtifact.dimensions,
    },

    generation: {
      model: GENERATION_MODEL,
      concurrency: GENERATION_CONCURRENCY,
    },

    judge: {
      model: JUDGE_MODEL,
      concurrency: JUDGE_CONCURRENCY,
      passThreshold: PASS_THRESHOLD,
    },

    retrieval,
    context,
    generationEvaluation,

    diagnostics: diagnostics.map((diagnostic) => ({
      queryId: diagnostic.queryId,
      query: diagnostic.query,
      goldArticles: diagnostic.goldArticles,
      goldChunkIds: diagnostic.goldChunkIds,

      vector: diagnostic.vector,
      vectorReranked: diagnostic.vectorReranked,

      vectorFirstRelevantRank: diagnostic.vectorFirstRelevantRank,
      vectorRerankedFirstRelevantRank:
        diagnostic.vectorRerankedFirstRelevantRank,
    })),
  };

  await mkdir(resolve(process.cwd(), "data/evaluation/labour-law"), {
    recursive: true,
  });

  await writeFile(
    EXPERIMENT_RESULTS_PATH,
    JSON.stringify(results, null, 2),
    "utf8",
  );

  console.log(`\nExperiment results written to: ${EXPERIMENT_RESULTS_PATH}`);
}

describe.skipIf(!RUN_REAL_BENCHMARK)(
  "Labour Law retrieval and generation benchmark",
  () => {
    it("evaluates retrieval, context, and generation on the real Labour Law corpus", async () => {
      /*
       * ============================================================
       * Load corpus and embeddings
       * ============================================================
       */

      const corpus = await loadLabourLawCorpus();

      const embeddingArtifact = await loadLabourLawEmbeddingArtifact();

      expect(corpus.chunks.length).toBeGreaterThan(0);

      expect(embeddingArtifact.records.length).toBe(corpus.chunks.length);

      expect(embeddingArtifact.dimensions).toBeGreaterThan(0);

      const gold = buildLabourLawGoldDataset(corpus);

      expect(gold.items).toHaveLength(15);

      /*
       * ============================================================
       * Query embedding provider
       * ============================================================
       */

      const embeddingProvider = new OllamaEmbeddingProvider({
        model: embeddingArtifact.model,
        dimensions: embeddingArtifact.dimensions,
      });

      const lawDocumentId = corpus.document.id;

      /*
       * ============================================================
       * Retrieval systems
       * ============================================================
       */

      const dbVectorRetrieve = createDbVectorRetriever(embeddingProvider, {
        topK: 10,
        lawDocumentId,
      });

      const dbVectorRerankedRetrieve = createDbVectorRerankedRetriever(
        embeddingProvider,
        {
          topK: 10,
          rerankTopK: 20,
          lawDocumentId,

          rerank: {
            topK: 10,
            phraseWeight: 0.45,
            coverageWeight: 0.35,
            retrievalWeight: 0.2,
          },
        },
      );

      /*
       * ============================================================
       * Retrieval benchmark
       * ============================================================
       */

      const benchmark = await runRetrievalBenchmark(gold, {
        systems: [
          {
            name: "db-vector",
            retrieve: dbVectorRetrieve,
          },
          {
            name: "db-vector-reranked",
            retrieve: dbVectorRerankedRetrieve,
          },
        ],

        recallAt: [1, 3, 5, 10],

        precisionAt: [5, 10],

        hitRateAt: [1, 3, 5, 10],

        ndcgAt: [5, 10],

        includeMrr: true,
      });

      expect(benchmark.datasetName).toBe("labour-law-retrieval-v1");

      expect(benchmark.queryCount).toBe(15);

      expect(benchmark.systems).toHaveLength(2);

      for (const system of benchmark.systems) {
        const result = system.result;

        expect(result.queryCount).toBe(15);

        expect(Object.keys(result.recall)).toEqual(["1", "3", "5", "10"]);

        expect(Object.keys(result.precision)).toEqual(["5", "10"]);

        expect(Object.keys(result.ndcg)).toEqual(["5", "10"]);

        expect(Object.keys(result.hitRate)).toEqual(["1", "3", "5", "10"]);

        expect(Number.isFinite(result.mrr)).toBe(true);

        expect(result.mrr).toBeGreaterThanOrEqual(0);

        expect(result.mrr).toBeLessThanOrEqual(1);

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

        for (const value of Object.values(result.hitRate)) {
          expect(Number.isFinite(value)).toBe(true);

          expect(value).toBeGreaterThanOrEqual(0);

          expect(value).toBeLessThanOrEqual(1);
        }

        expect(result.predictions).toHaveLength(15);
      }

      printRetrievalBenchmark(benchmark);

      /*
       * ============================================================
       * Context benchmark
       * ============================================================
       *
       * IMPORTANT:
       *
       * We reuse the retrieval predictions.
       * No second retrieval pass.
       */

      const contextBenchmark = await runContextBenchmark(gold, {
        systems: benchmark.systems.map((system) => ({
          name: system.name,

          retrievalResult: system.result,
        })),
      });

      expect(contextBenchmark.datasetName).toBe("labour-law-retrieval-v1");

      expect(contextBenchmark.queryCount).toBe(15);

      expect(contextBenchmark.systems).toHaveLength(2);

      for (const system of contextBenchmark.systems) {
        const result = system.result;

        expect(result.queryCount).toBe(15);

        expect(Number.isFinite(result.contextRecall)).toBe(true);

        expect(Number.isFinite(result.contextPrecision)).toBe(true);

        expect(Number.isFinite(result.contextHitRate)).toBe(true);

        expect(result.contextRecall).toBeGreaterThanOrEqual(0);

        expect(result.contextRecall).toBeLessThanOrEqual(1);

        expect(result.contextPrecision).toBeGreaterThanOrEqual(0);

        expect(result.contextPrecision).toBeLessThanOrEqual(1);

        expect(result.contextHitRate).toBeGreaterThanOrEqual(0);

        expect(result.contextHitRate).toBeLessThanOrEqual(1);

        expect(result.predictions).toHaveLength(15);

        expect(result.perQuery).toHaveLength(15);
      }

      printContextBenchmark(contextBenchmark);

      /*
       * ============================================================
       * Build a single chunk lookup
       * ============================================================
       *
       * Retrieval has already completed.
       *
       * We now collect every chunk ID returned by either
       * retrieval system and fetch them from PostgreSQL once.
       */

      const allRetrievedChunkIds = [
        ...new Set(
          benchmark.systems.flatMap((system) =>
            system.result.predictions.flatMap(
              (prediction) => prediction.retrievedChunkIds,
            ),
          ),
        ),
      ];

      const retrievedChunks =
        allRetrievedChunkIds.length > 0
          ? await getChunksByIds(allRetrievedChunkIds)
          : [];

      const chunkById = new Map<string, LawChunk>();

      for (const chunk of retrievedChunks) {
        chunkById.set(chunk.id, chunk);
      }

      /*
       * Corpus fallback.
       *
       * This also makes the benchmark robust if a gold chunk
       * happens not to appear in the DB retrieval result.
       */

      for (const chunk of corpus.chunks) {
        if (!chunkById.has(chunk.id)) {
          chunkById.set(chunk.id, chunk);
        }
      }

      /*
       * ============================================================
       * Retrieval diagnostics
       * ============================================================
       */

      const diagnostics: QueryDiagnostics[] = [];

      const systemResults = new Map(
        benchmark.systems.map((system) => [system.name, system.result]),
      );

      for (const item of gold.items) {
        const goldChunkIds = new Set(item.relevantChunkIds);

        const buildDiagnostics = (
          retrievedChunkIds: string[],
        ): DiagnosticResult[] => {
          return retrievedChunkIds.map((chunkId, index) => {
            const chunk = chunkById.get(chunkId);

            if (!chunk) {
              throw new Error(
                `Benchmark retrieved unknown chunk ID: ${chunkId}`,
              );
            }

            return {
              rank: index + 1,
              chunkId,
              articleNumber: chunk.article_number,
              relevant: goldChunkIds.has(chunkId),
            };
          });
        };

        const getPrediction = (systemName: string): string[] => {
          const result = systemResults.get(systemName);

          if (!result) {
            throw new Error(`Missing benchmark system: ${systemName}`);
          }

          const prediction = result.predictions.find(
            (candidate) => candidate.queryId === item.id,
          );

          if (!prediction) {
            throw new Error(
              `Missing prediction for query ${item.id} in system ${systemName}`,
            );
          }

          return prediction.retrievedChunkIds;
        };

        const vector = buildDiagnostics(getPrediction("db-vector"));

        const vectorReranked = buildDiagnostics(
          getPrediction("db-vector-reranked"),
        );

        const goldArticles = [
          ...new Set(
            item.relevantChunkIds
              .map((chunkId) => chunkById.get(chunkId)?.article_number)
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

          vector,
          vectorReranked,

          vectorFirstRelevantRank: firstRelevantRank(vector),

          vectorRerankedFirstRelevantRank: firstRelevantRank(vectorReranked),
        });
      }

      console.log(
        "\n\n============================================================",
      );

      console.log("LABOUR LAW VECTOR RETRIEVAL DIAGNOSTICS");

      console.log(
        "============================================================\n",
      );

      console.table(
        diagnostics.map((diagnostic) => ({
          id: diagnostic.queryId,

          query: diagnostic.query,

          gold: diagnostic.goldArticles.join(", "),

          Vector: formatRank(diagnostic.vectorFirstRelevantRank),

          "Vector+Rerank": formatRank(
            diagnostic.vectorRerankedFirstRelevantRank,
          ),
        })),
      );

      /*
       * ============================================================
       * Generation + LLM evaluation
       * ============================================================
       *
       * IMPORTANT:
       *
       * We intentionally do NOT pass expectedAnswer to the judge.
       *
       * GenerationJudgeInput currently supports:
       *
       *   query
       *   answer
       *   context
       *   expectedChunkIds
       *   citedChunkIds
       *
       * but not expectedAnswer.
       */

      const generationProvider = new OllamaGenerationProvider({
        model: GENERATION_MODEL,
      });

      const judgeProvider = new OllamaGenerationProvider({
        model: JUDGE_MODEL,
      });

      const generationSystems: GenerationSystemResult[] = [];

      for (const system of benchmark.systems) {
        const predictions = system.result.predictions;

        const chunkIds = [
          ...new Set(
            predictions.flatMap((prediction) => prediction.retrievedChunkIds),
          ),
        ];

        /*
         * We already loaded all retrieved chunks above.
         *
         * No additional DB query is necessary.
         */

        const systemChunkById = new Map<string, LawChunk>();

        for (const chunkId of chunkIds) {
          const chunk = chunkById.get(chunkId);

          if (!chunk) {
            throw new Error(
              `Missing retrieved chunk ${chunkId} for system ${system.name}`,
            );
          }

          systemChunkById.set(chunkId, chunk);
        }

        const dataset: GenerationBenchmarkItem[] = [];

        for (const item of gold.items) {
          const prediction = predictions.find(
            (candidate) => candidate.queryId === item.id,
          );

          if (!prediction) {
            throw new Error(
              `Missing retrieval prediction for query ${item.id} in system ${system.name}`,
            );
          }

          const retrievedChunks = prediction.retrievedChunkIds.map(
            (chunkId) => {
              const chunk = systemChunkById.get(chunkId);

              if (!chunk) {
                throw new Error(
                  `Missing retrieved chunk ${chunkId} for query ${item.id}`,
                );
              }

              return chunk;
            },
          );

          if (retrievedChunks.length === 0) {
            throw new Error(
              `No retrieved chunks available for query ${item.id}`,
            );
          }

          dataset.push({
            id: item.id,

            query: item.query,

            contextChunkIds: retrievedChunks.map((chunk) => chunk.id),

            context: retrievedChunks.map((chunk) => chunk.text),

            referenceAnswer: "",

            referenceChunkIds: item.relevantChunkIds,
          });
        }

        /*
         * ========================================================
         * Generation phase
         * ========================================================
         *
         * Bounded concurrency prevents the benchmark from
         * spending minutes waiting for sequential cloud calls.
         */

        const generatedEntries = await mapWithConcurrency(
          dataset,
          GENERATION_CONCURRENCY,
          async (item) => {
            console.log(`[GEN] ${system.name} ${item.id} starting`);

            const chunksForQuery = item.contextChunkIds.map((chunkId) => {
              const chunk = systemChunkById.get(chunkId);

              if (!chunk) {
                throw new Error(`Missing chunk ${chunkId} during generation`);
              }

              return chunk;
            });

            const generated = await generateAnswer(generationProvider, {
              query: item.query,

              chunks: chunksForQuery,
            });

            console.log(`[GEN] ${system.name} ${item.id} completed`);

            return {
              id: item.id,

              generated: {
                answer: generated.answer,

                citations: generated.citations.map((citation) => ({
                  citationId: citation.citationId,

                  chunkId: citation.chunkId,
                })),
              },
            };
          },
        );

        const generatedAnswers = new Map<string, GeneratedAnswer>();

        for (const entry of generatedEntries) {
          generatedAnswers.set(entry.id, entry.generated);
        }

        /*
         * ========================================================
         * LLM judge
         * ========================================================
         */

        const generationJudge = new LlmGenerationJudge({
          provider: judgeProvider,

          passThreshold: PASS_THRESHOLD,
        });

        const evaluator = new GenerationEvaluator({
          concurrency: JUDGE_CONCURRENCY,
          judge: async (input) => {
            /*
             * Find the dataset item by query.
             *
             * The benchmark queries are unique, so this is
             * sufficient for the current gold dataset.
             */

            const item = dataset.find(
              (candidate) => candidate.query === input.query,
            );

            if (!item) {
              throw new Error(
                `Missing generation dataset item for query: ${input.query}`,
              );
            }

            const generated = generatedAnswers.get(item.id);

            if (!generated) {
              throw new Error(`Missing generated answer for query: ${item.id}`);
            }

            console.log(`[JUDGE] ${system.name} ${item.id} starting`);

            const result = await generationJudge.judge({
              query: input.query,

              answer: input.answer,

              context: input.context,

              contextChunkIds: input.contextChunkIds,

              referenceAnswer: input.referenceAnswer,

              referenceChunkIds: input.referenceChunkIds,

              citedChunkIds: extractCitationChunkIds(generated.citations),
            });

            console.log(`[JUDGE] ${system.name} ${item.id} completed`);

            return {
              correctness: result.scores.correctness,

              faithfulness: result.scores.faithfulness,

              citationCorrectness: result.scores.citationCorrectness,
            };
          },

          passThreshold: PASS_THRESHOLD,
        });

        /*
         * ========================================================
         * Evaluate with bounded LLM concurrency
         * ========================================================
         *
         * GenerationEvaluator itself may evaluate sequentially.
         *
         * We therefore provide a cached answer function, while
         * the evaluator remains the owner of the evaluation
         * contract.
         *
         * If the evaluator performs judges sequentially, this is
         * still correct; the benchmark timeout below is generous.
         */

        const result = await evaluator.evaluate(dataset, async (query) => {
          const item = dataset.find((candidate) => candidate.query === query);

          if (!item) {
            throw new Error(
              `Missing generation dataset item for query: ${query}`,
            );
          }

          const generated = generatedAnswers.get(item.id);

          if (!generated) {
            throw new Error(`Missing generated answer for query: ${item.id}`);
          }

          return generated.answer;
        });

        generationSystems.push({
          name: system.name,

          result,
        });
      }

      /*
       * ============================================================
       * Generation output
       * ============================================================
       */

      printGenerationBenchmark(generationSystems);

      /*
       * ============================================================
       * Detailed generation diagnostics
       * ============================================================
       */

      console.log(
        "\n\n============================================================",
      );

      console.log("LABOUR LAW GENERATION CONFIGURATION");

      console.log(
        "============================================================\n",
      );

      console.table([
        {
          generationModel: GENERATION_MODEL,

          judgeModel: JUDGE_MODEL,

          generationConcurrency: GENERATION_CONCURRENCY,

          judgeConcurrency: JUDGE_CONCURRENCY,

          passThreshold: PASS_THRESHOLD,
        },
      ]);

      /*
       * ============================================================
       * Retrieval diagnostics: detailed rankings
       * ============================================================
       */

      for (const diagnostic of diagnostics) {
        console.log(
          "\n------------------------------------------------------------",
        );

        console.log(`${diagnostic.queryId}: ${diagnostic.query}`);

        console.log(`Gold articles: ${diagnostic.goldArticles.join(", ")}`);

        console.log(`Gold chunks: ${diagnostic.goldChunkIds.join(", ")}`);

        console.log("\nVector:");

        console.table(
          diagnostic.vector.map((result) => ({
            rank: result.rank,

            article: result.articleNumber,

            relevant: result.relevant ? "✓" : "✗",

            chunk: result.chunkId,
          })),
        );

        console.log("Vector + Reranker:");

        console.table(
          diagnostic.vectorReranked.map((result) => ({
            rank: result.rank,

            article: result.articleNumber,

            relevant: result.relevant ? "✓" : "✗",

            chunk: result.chunkId,
          })),
        );
      }

      /*
       * ============================================================
       * Aggregate diagnostic summary
       * ============================================================
       */

      const countHits = (
        key: "vectorFirstRelevantRank" | "vectorRerankedFirstRelevantRank",
      ): number => {
        return diagnostics.filter((diagnostic) => diagnostic[key] !== null)
          .length;
      };

      const vectorHits = countHits("vectorFirstRelevantRank");

      const rerankedHits = countHits("vectorRerankedFirstRelevantRank");

      console.log(
        "\n\n============================================================",
      );

      console.log("LABOUR LAW RETRIEVAL DIAGNOSTIC SUMMARY");

      console.log(
        "============================================================\n",
      );

      console.table([
        {
          system: "db-vector",

          queriesWithRelevantTop10: vectorHits,

          queriesMissed: gold.items.length - vectorHits,
        },

        {
          system: "db-vector-reranked",

          queriesWithRelevantTop10: rerankedHits,

          queriesMissed: gold.items.length - rerankedHits,
        },
      ]);

      /*
       * ============================================================
       * Final sanity assertions
       * ============================================================
       */

      expect(generationSystems).toHaveLength(2);

      for (const system of generationSystems) {
        const result = system.result;

        expect(result.queryCount).toBe(15);

        expect(Number.isFinite(result.correctness)).toBe(true);

        expect(Number.isFinite(result.faithfulness)).toBe(true);

        expect(Number.isFinite(result.citationCorrectness)).toBe(true);

        const passRate =
          result.queryCount === 0
            ? 0
            : result.perQuery.filter((query) => query.passed).length /
              result.queryCount;

        expect(Number.isFinite(passRate)).toBe(true);

        expect(result.correctness).toBeGreaterThanOrEqual(0);

        expect(result.correctness).toBeLessThanOrEqual(1);

        expect(result.faithfulness).toBeGreaterThanOrEqual(0);

        expect(result.faithfulness).toBeLessThanOrEqual(1);

        expect(result.citationCorrectness).toBeGreaterThanOrEqual(0);

        expect(result.citationCorrectness).toBeLessThanOrEqual(1);

        expect(passRate).toBeGreaterThanOrEqual(0);

        expect(passRate).toBeLessThanOrEqual(1);

        expect(result.predictions).toHaveLength(15);

        expect(result.perQuery).toHaveLength(15);
      }

      /*
       * ============================================================
       * Persist experiment results
       * ============================================================
       *
       * The benchmark output is now reproducible and available as
       * a machine-readable experiment artifact.
       */

      await writeExperimentResults(
        benchmark,
        contextBenchmark,
        generationSystems,
        diagnostics,
        corpus,
        embeddingArtifact,
      );
    }, /*
     * 15 queries × generation + 15 queries × judging can easily
     * exceed two minutes when using a cloud Ollama model.
     *
     * This timeout belongs to the integration benchmark only;
     * it does not change Vitest's global test timeout.
     */ 600_000);
  },
);
