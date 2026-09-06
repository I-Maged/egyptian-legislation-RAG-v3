import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { CanonicalCorpus } from "@egyptian-law/core";
import { getRagService, serializeRagContextDocument } from "@egyptian-law/rag";

import { LAW_EVALUATIONS, parseLawId } from "../law-evaluation-config";
import type { RagasEvaluationDataset, RagasEvaluationRecord } from "./types";

const TOP_K = positive(process.env.RAGAS_TOP_K, 10);
const CANDIDATE_TOP_K = positive(process.env.RAGAS_CANDIDATE_TOP_K, Math.max(TOP_K * 4, TOP_K));
const GENERATION_MODEL = process.env.RAGAS_GENERATION_MODEL ?? "gemma4:cloud";

function positive(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function getArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function readJsonFile<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

async function main(): Promise<void> {
  const lawId = parseLawId(getArg("--law") ?? process.env.EVALUATION_LAW);
  const config = LAW_EVALUATIONS[lawId];
  const bundle = await config.load();
  const chunkById = new Map(bundle.corpus.chunks.map((chunk) => [chunk.id, chunk]));

  const outputPath = resolve(
    process.cwd(),
    process.env.RAGAS_DATASET_PATH ?? `data/evaluation/${lawId}-v3/ragas-dataset.json`,
  );

  const rag = getRagService({
    generationModel: GENERATION_MODEL,
    topK: TOP_K,
    candidateTopK: CANDIDATE_TOP_K,
  });

  const records: RagasEvaluationRecord[] = [];

  for (const item of bundle.gold.items) {
    console.log(`[RAGAS DATASET] ${lawId} ${item.id} starting`);

    const lawDocumentId = config.getScopeDocumentId(item, bundle);
    const response = await rag.answer({
      query: item.query,
      retrieval: {
        topK: TOP_K,
        candidateTopK: CANDIDATE_TOP_K,
        ...(lawDocumentId ? { lawDocumentId } : {}),
      },
    });

    if (response.context.documents.length === 0) {
      throw new Error(`No retrieved context for ${lawId} ${item.id}.`);
    }

    const referenceContexts = item.relevantChunkIds.map((chunkId) => {
      const chunk = chunkById.get(chunkId);
      if (!chunk) throw new Error(`Missing reference chunk ${chunkId} for ${item.id}.`);
      return chunk.text;
    });

    records.push({
      id: item.id,
      user_input: item.query,
      response: response.answer,
      // This is intentionally the same metadata-rich representation used by
      // the RAG service when constructing generation context.
      retrieved_contexts: response.context.documents.map(serializeRagContextDocument),
      retrieved_context_ids: response.retrieved.map((retrieved) => retrieved.chunk.id),
      reference_context_ids: [...item.relevantChunkIds],
      reference_contexts: referenceContexts,
      citations: response.citations.map((citation) => ({
        id: citation.id,
        chunkId: citation.chunkId,
        articleNumber: citation.articleNumber,
      })),
      generation: response.generation,
    });

    console.log(`[RAGAS DATASET] ${lawId} ${item.id} completed`);
  }

  const dataset: RagasEvaluationDataset = {
    schema_version: "1.0",
    evaluator: "ragas",
    dataset_name: `${lawId}-ragas-v3-context-aligned-top10`,
    language: "ar",
    jurisdiction: "EG",
    metrics: ["faithfulness", "answer_relevancy", "context_precision", "context_relevance"],
    records,
  };

  await mkdir(resolve(outputPath, ".."), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(dataset, null, 2)}\n`, "utf8");
  console.log(`\nWrote ${records.length} RAGAS records to ${outputPath}`);
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
