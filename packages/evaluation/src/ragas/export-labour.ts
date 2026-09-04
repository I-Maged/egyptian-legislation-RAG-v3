import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { CanonicalCorpus } from "@egyptian-law/core";
import { getRagService } from "@egyptian-law/rag";

import { buildLabourLawGoldDataset } from "../datasets/labour-law-gold";
import type { RagasEvaluationDataset, RagasEvaluationRecord } from "./types";

const CORPUS_PATH = resolve(
  process.cwd(),
  "data/canonical/labour-law-148-2019.json",
);

const OUTPUT_PATH = resolve(
  process.cwd(),
  process.env.RAGAS_DATASET_PATH ??
    "data/evaluation/labour-law/ragas-dataset.json",
);

const LAW_DOCUMENT_ID =
  process.env.LABOUR_LAW_DOCUMENT_ID ?? "lawdoc_f1fd6f6338643087";

const TOP_K = parsePositiveInteger(process.env.RAGAS_TOP_K, 5);
const CANDIDATE_TOP_K = parsePositiveInteger(
  process.env.RAGAS_CANDIDATE_TOP_K,
  Math.max(TOP_K * 4, TOP_K),
);

const GENERATION_MODEL = process.env.RAGAS_GENERATION_MODEL ?? "gemma4:cloud";

async function readJsonFile<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

async function main(): Promise<void> {
  const corpus = await readJsonFile<CanonicalCorpus>(CORPUS_PATH);
  const gold = buildLabourLawGoldDataset(corpus);

  const chunkById = new Map(corpus.chunks.map((chunk) => [chunk.id, chunk]));

  const rag = getRagService({
    generationModel: GENERATION_MODEL,
    topK: TOP_K,
    candidateTopK: CANDIDATE_TOP_K,
  });

  const records: RagasEvaluationRecord[] = [];

  for (const item of gold.items) {
    console.log(`[RAGAS DATASET] ${item.id} starting`);

    const response = await rag.answer({
      query: item.query,
      retrieval: {
        lawDocumentId: LAW_DOCUMENT_ID,
        topK: TOP_K,
        candidateTopK: CANDIDATE_TOP_K,
      },
    });

    const referenceContexts = item.relevantChunkIds.map((chunkId) => {
      const chunk = chunkById.get(chunkId);

      if (!chunk) {
        throw new Error(`Missing reference chunk ${chunkId} for ${item.id}.`);
      }

      return chunk.text;
    });

    const record: RagasEvaluationRecord = {
      id: item.id,
      user_input: item.query,
      response: response.answer,

      retrieved_contexts: response.context.documents.map(
        (document) => document.text,
      ),
      retrieved_context_ids: response.retrieved.map(
        (retrieved) => retrieved.chunk.id,
      ),

      reference_context_ids: [...item.relevantChunkIds],
      reference_contexts: referenceContexts,

      citations: response.citations.map((citation) => ({
        id: citation.id,
        chunkId: citation.chunkId,
        articleNumber: citation.articleNumber,
      })),

      generation: response.generation,
    };

    records.push(record);

    console.log(`[RAGAS DATASET] ${item.id} completed`);
  }

  const dataset: RagasEvaluationDataset = {
    schema_version: "1.0",
    evaluator: "ragas",
    dataset_name: "labour-law-ragas-v1",
    language: "ar",
    jurisdiction: "EG",
    metrics: [
      "faithfulness",
      "answer_relevancy",
      "context_precision",
      "context_relevance",
    ],
    records,
  };

  await mkdir(resolve(OUTPUT_PATH, ".."), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(dataset, null, 2)}\n`, "utf8");

  console.log(`\nWrote ${records.length} RAGAS records to ${OUTPUT_PATH}`);
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
