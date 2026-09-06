import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import type { CanonicalCorpus, LawChunk } from "@egyptian-law/core";
import {
  OllamaGenerationProvider,
  generateAnswer,
} from "@egyptian-law/generation";

import { formatGenerationContext } from "@egyptian-law/generation";
import { createDbVectorRetriever } from "./db-retrieval-adapters";
import { GenerationEvaluator, LlmGenerationJudge } from "../generation";
import {
  LAW_EVALUATIONS,
  parseLawId,
  type LawId,
} from "../law-evaluation-config";
import { runRetrievalBenchmark } from "./retrieval-benchmark";
import { describe, it } from "vitest";

const RUN = process.env.RUN_LAW_GENERATION_BENCHMARK === "1";
const LAW_ID = parseLawId(process.env.EVALUATION_LAW ?? "financial");
const GENERATION_MODEL =
  process.env.EVALUATION_GENERATION_MODEL ?? "gemma4:cloud";
const JUDGE_MODEL = process.env.EVALUATION_JUDGE_MODEL ?? "gemma4:cloud";
const GENERATION_CONCURRENCY = positive(
  process.env.EVALUATION_GENERATION_CONCURRENCY,
  3,
);
const JUDGE_CONCURRENCY = positive(process.env.EVALUATION_JUDGE_CONCURRENCY, 3);
const TOP_K = positive(process.env.EVALUATION_TOP_K, 10);
const PASS_THRESHOLD = 0.7;

function positive(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function runWorker() {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      const item = items[index];
      if (item === undefined) throw new Error(`Missing item ${index}.`);
      results[index] = await worker(item);
    }
  }
  await Promise.all(
    Array.from(
      { length: Math.min(concurrency, Math.max(items.length, 1)) },
      runWorker,
    ),
  );
  return results;
}

function passRate(
  result: Awaited<ReturnType<GenerationEvaluator["evaluate"]>>,
): number {
  return result.queryCount === 0
    ? 0
    : result.perQuery.filter((item) => item.passed).length / result.queryCount;
}

function chunkMap(bundle: { corpus: CanonicalCorpus }): Map<string, LawChunk> {
  return new Map(bundle.corpus.chunks.map((chunk) => [chunk.id, chunk]));
}

async function runLaw(lawId: LawId): Promise<void> {
  const config = LAW_EVALUATIONS[lawId];
  const bundle = await config.load();
  const { gold } = bundle;
  const chunks = chunkMap(bundle);

  const embeddingProvider = new (
    await import("@egyptian-law/ingestion")
  ).OllamaEmbeddingProvider({
    model: bundle.embeddingArtifact.model,
    dimensions: bundle.embeddingArtifact.dimensions,
  });

  const scopedRetrieve = async (query: string): Promise<string[]> => {
    const item = gold.items.find((candidate) => candidate.query === query);
    if (!item) throw new Error(`Missing gold item for query: ${query}`);
    const lawDocumentId = config.getScopeDocumentId(item, bundle);
    return createDbVectorRetriever(embeddingProvider, {
      topK: TOP_K,
      ...(lawDocumentId ? { lawDocumentId } : {}),
    })(query);
  };

  const benchmark = await runRetrievalBenchmark(gold, {
    systems: [{ name: "db-vector", retrieve: scopedRetrieve }],
    recallAt: [1, 3, 5, 10],
    precisionAt: [5, 10],
    hitRateAt: [1, 3, 5, 10],
    ndcgAt: [5, 10],
    includeMrr: true,
  });

  console.log(`\n=== ${config.label} RETRIEVAL + GENERATION BENCHMARK ===`);
  console.table(
    benchmark.systems.map((system) => ({
      system: system.name,
      queries: system.result.queryCount,
      R1: system.result.recall["1"]?.toFixed(4),
      R3: system.result.recall["3"]?.toFixed(4),
      R5: system.result.recall["5"]?.toFixed(4),
      R10: system.result.recall["10"]?.toFixed(4),
      P5: system.result.precision["5"]?.toFixed(4),
      P10: system.result.precision["10"]?.toFixed(4),
      MRR: system.result.mrr.toFixed(4),
      nDCG5: system.result.ndcg["5"]?.toFixed(4),
      nDCG10: system.result.ndcg["10"]?.toFixed(4),
    })),
  );

  const predictions = benchmark.systems[0]?.result.predictions ?? [];
  const generationProvider = new OllamaGenerationProvider({
    model: GENERATION_MODEL,
  });
  const judgeProvider = new OllamaGenerationProvider({ model: JUDGE_MODEL });

  const datasets = predictions.map((prediction) => {
    const item = gold.items.find(
      (candidate) => candidate.id === prediction.queryId,
    );
    if (!item) throw new Error(`Missing gold item ${prediction.queryId}.`);
    const retrievedChunks = prediction.retrievedChunkIds.map((id) =>
      chunks.get(id),
    );
    if (retrievedChunks.some((chunk) => !chunk))
      throw new Error(`Missing retrieved chunk for ${prediction.queryId}.`);
    const resolved = retrievedChunks as LawChunk[];
    return {
      id: item.id,
      query: item.query,
      chunks: resolved,
      contextChunkIds: resolved.map((chunk) => chunk.id),
      context: formatGenerationContext(resolved),
      referenceChunkIds: item.relevantChunkIds,
    };
  });

  const generated = await mapWithConcurrency(
    datasets,
    GENERATION_CONCURRENCY,
    async (item) => {
      console.log(`[GEN] ${lawId} ${item.id}`);
      const answer = await generateAnswer(generationProvider, {
        query: item.query,
        chunks: item.chunks,
      });
      return {
        id: item.id,
        answer: answer.answer,
        citedChunkIds: answer.citations.map((citation) => citation.chunkId),
      };
    },
  );
  const generatedById = new Map(generated.map((item) => [item.id, item]));

  const judge = new LlmGenerationJudge({
    provider: judgeProvider,
    passThreshold: PASS_THRESHOLD,
  });
  const evaluator = new GenerationEvaluator({
    concurrency: JUDGE_CONCURRENCY,
    judge: async (input) => {
      const datasetItem = datasets.find(
        (candidate) => candidate.query === input.query,
      );
      if (!datasetItem)
        throw new Error(
          `Cannot associate judge input with ${lawId}: ${input.query}`,
        );
      const generatedAnswer = generatedById.get(datasetItem.id);
      if (!generatedAnswer)
        throw new Error(`Missing generated answer ${datasetItem.id}.`);
      const result = await judge.judge({
        query: input.query,
        answer: input.answer,
        context: input.context,
        contextChunkIds: input.contextChunkIds,
        referenceAnswer: "",
        referenceChunkIds: input.referenceChunkIds,
        citedChunkIds: generatedAnswer.citedChunkIds,
      });
      return result.scores;
    },
  });

  const result = await evaluator.evaluate(
    datasets.map((item) => ({
      id: item.id,
      query: item.query,
      contextChunkIds: item.contextChunkIds,
      context: item.context.split("\n\n------------------------------\n\n"),
      referenceAnswer: "",
      referenceChunkIds: item.referenceChunkIds,
      citedChunkIds: generatedById.get(item.id)?.citedChunkIds ?? [],
    })),
    async (query) => {
      const item = datasets.find((candidate) => candidate.query === query);
      if (!item) throw new Error(`Missing dataset item for ${query}.`);
      const generatedItem = generatedById.get(item.id);
      if (!generatedItem)
        throw new Error(`Missing generated answer for ${item.id}.`);
      return generatedItem.answer;
    },
  );

  console.log(`\n=== ${config.label} GENERATION EVALUATION ===`);
  console.table([
    {
      queries: result.queryCount,
      correctness: result.correctness.toFixed(4),
      faithfulness: result.faithfulness.toFixed(4),
      citationCorrectness: result.citationCorrectness.toFixed(4),
      passRate: passRate(result).toFixed(4),
    },
  ]);

  const outputPath = resolve(
    process.cwd(),
    `data/evaluation/${lawId}-v3/experiment-results.json`,
  );
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    `${JSON.stringify(
      {
        schema_version: "1.0",
        experiment: `${lawId}-retrieval-generation-v3`,
        law: lawId,
        gold_dataset: gold.name,
        top_k: TOP_K,
        generation_model: GENERATION_MODEL,
        judge_model: JUDGE_MODEL,
        generation_concurrency: GENERATION_CONCURRENCY,
        judge_concurrency: JUDGE_CONCURRENCY,
        retrieval: Object.fromEntries(
          benchmark.systems.map((system) => [system.name, system.result]),
        ),
        generation: {
          queryCount: result.queryCount,
          correctness: result.correctness,
          faithfulness: result.faithfulness,
          citationCorrectness: result.citationCorrectness,
          passRate: passRate(result),
        },
        perQuery: result.perQuery,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  console.log(`Wrote ${outputPath}`);
}

describe.skipIf(!RUN)(
  `${LAW_EVALUATIONS[LAW_ID].label} retrieval + generation benchmark`,
  () => {
    it(
      "uses the corrected gold dataset and evaluates the DB vector path",
      async () => {
        await runLaw(LAW_ID);
      },
      30 * 60 * 1000,
    );
  },
);
