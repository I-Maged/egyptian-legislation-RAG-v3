import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import type { CanonicalCorpus } from "@egyptian-law/core";
import { loadCanonicalCorpora } from "@egyptian-law/ingestion";

import { financialLawGoldDraft } from "./financial-law-gold";
import {
  buildFinancialLawGoldDatasetCorrected,
  financialLawGoldCorrectedDraft,
} from "./financial-law-gold-corrections";
import { labourLawGoldDraft } from "./labour-law-gold";
import {
  buildLabourLawGoldDatasetCorrected,
  labourLawGoldCorrectedDraft,
} from "./labour-law-gold-corrections";
import { personalAffairsLawGoldDraft } from "./personal-affairs-law-gold";
import {
  buildPersonalAffairsLawGoldDatasetCorrected,
  personalAffairsLawGoldCorrectedDraft,
} from "./personal-affairs-law-gold-corrections";

function normalizeQuery(query: string): string {
  return query.replace(/\s+/g, " ").trim();
}

function expectUniqueIds(ids: string[], prefix: string): void {
  expect(new Set(ids).size).toBe(ids.length);

  for (const id of ids) {
    expect(id).toMatch(
      new RegExp(`^${prefix}-\\d{3}$`),
    );
  }
}

function expectUniqueQueries(queries: string[]): void {
  const normalized = queries.map(normalizeQuery);

  expect(new Set(normalized).size).toBe(normalized.length);
}

async function readCorpus(path: string): Promise<CanonicalCorpus> {
  return JSON.parse(
    await readFile(resolve(process.cwd(), path), "utf8"),
  ) as CanonicalCorpus;
}

describe("gold corrections overlays", () => {
  it("keeps counts at 65/65/70 without touching base drafts", () => {
    expect(financialLawGoldDraft).toHaveLength(65);
    expect(financialLawGoldCorrectedDraft).toHaveLength(65);

    expect(labourLawGoldDraft).toHaveLength(65);
    expect(labourLawGoldCorrectedDraft).toHaveLength(65);

    expect(personalAffairsLawGoldDraft).toHaveLength(70);
    expect(personalAffairsLawGoldCorrectedDraft).toHaveLength(70);
  });

  it("has valid unique IDs (typo personal--59 fixed)", () => {
    expectUniqueIds(
      financialLawGoldCorrectedDraft.map((item) => item.id),
      "financial",
    );
    expectUniqueIds(
      labourLawGoldCorrectedDraft.map((item) => item.id),
      "labour",
    );
    expectUniqueIds(
      personalAffairsLawGoldCorrectedDraft.map((item) => item.id),
      "personal",
    );

    expect(
      personalAffairsLawGoldCorrectedDraft.some((item) =>
        item.id.includes("--"),
      ),
    ).toBe(false);
    expect(
      personalAffairsLawGoldCorrectedDraft.some(
        (item) => item.id === "personal-059",
      ),
    ).toBe(true);
  });

  it("has no exact-duplicate queries after replacement", () => {
    expectUniqueQueries(
      financialLawGoldCorrectedDraft.map((item) => item.query),
    );
    expectUniqueQueries(
      labourLawGoldCorrectedDraft.map((item) => item.query),
    );
    expectUniqueQueries(
      personalAffairsLawGoldCorrectedDraft.map((item) => item.query),
    );
  });

  it("applies the faithful financial fixes", () => {
    const item035 = financialLawGoldCorrectedDraft.find(
      (item) => item.id === "financial-035",
    )!;

    // Multi-relevant: both near-duplicate OCR articles answer the query.
    expect(item035.relevantArticleNumbers).toEqual(["36", "37"]);

    const item065 = financialLawGoldCorrectedDraft.find(
      (item) => item.id === "financial-065",
    )!;

    // Rephrased away from the unanswerable month count; same article.
    expect(item065.relevantArticleNumbers).toEqual(["67"]);
    expect(item065.query).not.toMatch(/كم شهر/);
  });

  it("applies the faithful labour fix", () => {
    const item015 = labourLawGoldCorrectedDraft.find(
      (item) => item.id === "labour-015",
    )!;

    expect(item015.relevantArticleNumbers).toEqual(["288", "289"]);
    expect(item015.query).not.toBe(
      labourLawGoldDraft.find((item) => item.id === "labour-015")!.query,
    );
  });

  it("resolves financial/labour corrections against the real canonical files", async () => {
    const financial = await readCorpus(
      "data/canonical/financial-law-6-2022.json",
    );
    const labour = await readCorpus("data/canonical/labour-law-14-2025.json");

    const financialDataset =
      buildFinancialLawGoldDatasetCorrected(financial);
    const labourDataset = buildLabourLawGoldDatasetCorrected(labour);

    expect(financialDataset.items).toHaveLength(65);
    expect(labourDataset.items).toHaveLength(65);
    expect(
      financialDataset.items.every(
        (item) => item.relevantChunkIds.length > 0,
      ),
    ).toBe(true);
    expect(
      labourDataset.items.every((item) => item.relevantChunkIds.length > 0),
    ).toBe(true);
  });

  it("resolves all 70 personal corrections against the 14-document corpus", async () => {
    const loaded = await loadCanonicalCorpora(
      "data/canonical/personal-affairs",
    );
    const corpora = loaded.corpora.map((entry) => entry.corpus);
    const dataset = buildPersonalAffairsLawGoldDatasetCorrected(corpora);

    expect(dataset.items).toHaveLength(70);
    expect(new Set(dataset.items.map((item) => item.id)).size).toBe(70);
    expect(
      dataset.items.every((item) => item.relevantChunkIds.length > 0),
    ).toBe(true);
  }, 120_000);
});
