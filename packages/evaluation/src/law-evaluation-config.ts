import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { CanonicalCorpus, EmbeddingArtifact } from "@egyptian-law/core";
import { loadCanonicalCorpora } from "@egyptian-law/ingestion";

import { buildFinancialLawGoldDatasetCorrected } from "./datasets/financial-law-gold-corrections";
import { buildLabourLawGoldDatasetCorrected } from "./datasets/labour-law-gold-corrections";
import { buildPersonalAffairsLawGoldDatasetCorrected } from "./datasets/personal-affairs-law-gold-corrections";
import type { RetrievalGoldDataset } from "./datasets/retrieval-dataset";

export type LawId = "labour" | "financial" | "personal-affairs";

export interface LawEvaluationBundle {
  corpora: CanonicalCorpus[];
  corpus: CanonicalCorpus;
  embeddingArtifact: EmbeddingArtifact;
  gold: RetrievalGoldDataset;
}

export interface LawEvaluationConfig {
  id: LawId;
  label: string;
  corpusPath?: string;
  corpusDirectory?: string;
  embeddingPath?: string;
  embeddingDirectory?: string;
  documentId?: string;
  load(): Promise<LawEvaluationBundle>;
  getScopeDocumentId(item: RetrievalGoldDataset["items"][number], bundle: LawEvaluationBundle): string | undefined;
}

async function readJsonFile<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

async function loadSingleCorpus(
  corpusPath: string,
  embeddingPath: string,
  goldBuilder: (corpus: CanonicalCorpus) => RetrievalGoldDataset,
): Promise<LawEvaluationBundle> {
  const corpus = await readJsonFile<CanonicalCorpus>(corpusPath);
  const embeddingArtifact = await readJsonFile<EmbeddingArtifact>(embeddingPath);

  if (embeddingArtifact.records.length !== corpus.chunks.length) {
    throw new Error(
      `Embedding count ${embeddingArtifact.records.length} does not match corpus chunk count ${corpus.chunks.length}.`,
    );
  }

  return {
    corpora: [corpus],
    corpus,
    embeddingArtifact,
    gold: goldBuilder(corpus),
  };
}

async function loadPersonalAffairs(): Promise<LawEvaluationBundle> {
  const corpusDirectory = resolve(
    process.cwd(),
    "data/canonical/personal-affairs",
  );
  const embeddingDirectory = resolve(
    process.cwd(),
    "data/embeddings/reindex-v3.3.0/personal-affairs",
  );

  const loaded = await loadCanonicalCorpora(corpusDirectory);
  const corpora = loaded.corpora.map((entry) => entry.corpus);

  const artifacts = await Promise.all(
    loaded.corpora.map(async (entry) =>
      readJsonFile<EmbeddingArtifact>(resolve(embeddingDirectory, entry.relativePath)),
    ),
  );

  const first = corpora[0];
  const firstArtifact = artifacts[0];
  if (!first || !firstArtifact) {
    throw new Error("Personal Affairs corpus is empty.");
  }

  for (const artifact of artifacts) {
    if (artifact.model !== firstArtifact.model || artifact.dimensions !== firstArtifact.dimensions) {
      throw new Error("Personal Affairs embedding artifacts use inconsistent models or dimensions.");
    }
  }

  const corpus: CanonicalCorpus = {
    schema_version: "1.0",
    document: first.document,
    chunks: corpora.flatMap((entry) => entry.chunks),
  };

  const embeddingArtifact: EmbeddingArtifact = {
    schema_version: "1.0",
    model: firstArtifact.model,
    dimensions: firstArtifact.dimensions,
    records: artifacts.flatMap((artifact) => artifact.records),
  };

  if (embeddingArtifact.records.length !== corpus.chunks.length) {
    throw new Error(
      `Personal Affairs embedding count ${embeddingArtifact.records.length} does not match corpus chunk count ${corpus.chunks.length}.`,
    );
  }

  return {
    corpora,
    corpus,
    embeddingArtifact,
    gold: buildPersonalAffairsLawGoldDatasetCorrected(corpora),
  };
}

export const LAW_EVALUATIONS: Record<LawId, LawEvaluationConfig> = {
  labour: {
    id: "labour",
    label: "Labour Law",
    corpusPath: "data/canonical/labour-law-14-2025.json",
    embeddingPath: "data/embeddings/reindex-v3.3.0/labour-law-14-2025.json",
    documentId: "lawdoc_04ec12b4c4f7e3a6",
    load: () =>
      loadSingleCorpus(
        resolve(process.cwd(), "data/canonical/labour-law-14-2025.json"),
        resolve(process.cwd(), "data/embeddings/reindex-v3.3.0/labour-law-14-2025.json"),
        buildLabourLawGoldDatasetCorrected,
      ),
    getScopeDocumentId: () => "lawdoc_04ec12b4c4f7e3a6",
  },

  financial: {
    id: "financial",
    label: "Financial Law",
    corpusPath: "data/canonical/financial-law-6-2022.json",
    embeddingPath: "data/embeddings/reindex-v3.3.0/financial-law-6-2022.json",
    documentId: "lawdoc_bdcbef44f3a8e375",
    load: () =>
      loadSingleCorpus(
        resolve(process.cwd(), "data/canonical/financial-law-6-2022.json"),
        resolve(process.cwd(), "data/embeddings/reindex-v3.3.0/financial-law-6-2022.json"),
        buildFinancialLawGoldDatasetCorrected,
      ),
    getScopeDocumentId: () => "lawdoc_bdcbef44f3a8e375",
  },

  "personal-affairs": {
    id: "personal-affairs",
    label: "Personal Affairs Law",
    corpusDirectory: "data/canonical/personal-affairs",
    embeddingDirectory: "data/embeddings/reindex-v3.3.0/personal-affairs",
    load: loadPersonalAffairs,
    getScopeDocumentId: (item, bundle) => {
      const chunkIds = new Set(item.relevantChunkIds);
      const documentIds = new Set(
        bundle.corpora.flatMap((corpus) =>
          corpus.chunks
            .filter((chunk) => chunkIds.has(chunk.id))
            .map((chunk) => chunk.document_id),
        ),
      );

      if (documentIds.size === 0) {
        throw new Error(`No source document found for ${item.id}.`);
      }

      if (documentIds.size > 1) {
        throw new Error(
          `Personal Affairs item ${item.id} spans multiple source documents (${[...documentIds].join(", ")}); the current RagRequest supports one lawDocumentId per request.`,
        );
      }

      return [...documentIds][0];
    },
  },
};

export function parseLawId(value: string | undefined): LawId {
  const normalized = value?.trim().toLowerCase() ?? "";
  if (normalized === "labour" || normalized === "financial" || normalized === "personal-affairs") {
    return normalized;
  }

  throw new Error(
    `Unknown law "${value ?? ""}". Expected labour, financial, or personal-affairs.`,
  );
}

