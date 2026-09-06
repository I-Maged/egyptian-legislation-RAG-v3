import type { CanonicalCorpus } from "@egyptian-law/core";

import type {
  RetrievalGoldDataset,
  RetrievalGoldItem,
} from "./retrieval-dataset";
import {
  financialLawGoldDraft,
  type FinancialLawGoldDraft,
} from "./financial-law-gold";

/**
 * Additive corrections overlay for the Financial Law gold dataset.
 *
 * The base `financialLawGoldDraft` file is left untouched; this module
 * maps it 1:1 to a corrected draft (still 65 items) that fixes
 * faithfulness problems found against
 * `data/canonical/financial-law-6-2022.json` (78 chunks, articles 1..78).
 *
 * - `financial-035`: query on باب→باب transfers matches BOTH Art 36
 *   (clean: `موافقة مجلس النواب ... 10% / 1%`) and Art 37 (near-duplicate
 *   OCR: `مجلس الوزراء ... 10% / 10%`). Single-label `["37"]` leaves Art 36
 *   with zero coverage and punishes retrieval of either. Fixed to
 *   multi-relevant `["36", "37"]`.
 * - `financial-065`: original asked `خلال كم شهر ...؟` but Art 67's month
 *   count is OCR-destroyed (`في عصر مضاعاً أقسام ميزانه أشهر`) so the item
 *   was unanswerable. Rephrased to ask about the required procedure while
 *   keeping the same article `["67"]`.
 *
 * Known accepted gap (documented, count locked at 65): Art 47
 * (`تمويل العجز / الفوائض`) and tails `1, 68-78` remain uncovered.
 * Art 66 is intentionally double-covered by `financial-063` (who prepares)
 * and `financial-064` (what it includes).
 */
export const financialLawGoldCorrections: Record<
  string,
  Partial<FinancialLawGoldDraft>
> = {
  "financial-035": {
    relevantArticleNumbers: ["36", "37"],
  },
  "financial-065": {
    query:
      "ما الإجراء المطلوب بشأن الحسابات الختامية للموازنة العامة والوحدات الاقتصادية بعد إجراء التسويات اللازمة؟",
    relevantArticleNumbers: ["67"],
  },
};

export const financialLawGoldCorrectedDraft: FinancialLawGoldDraft[] =
  financialLawGoldDraft.map((draft) => {
    const correction = financialLawGoldCorrections[draft.id];

    if (!correction) {
      return draft;
    }

    return { ...draft, ...correction };
  });

export function buildFinancialLawGoldDatasetCorrected(
  corpus: CanonicalCorpus,
): RetrievalGoldDataset {
  const articleMap = new Map<string, string[]>();

  for (const chunk of corpus.chunks) {
    const chunkIds = articleMap.get(chunk.article_number) ?? [];

    chunkIds.push(chunk.id);

    articleMap.set(chunk.article_number, chunkIds);
  }

  const items: RetrievalGoldItem[] = financialLawGoldCorrectedDraft.map(
    (draft) => {
      const relevantChunkIds: string[] = [];

      for (const articleNumber of draft.relevantArticleNumbers) {
        const chunkIds = articleMap.get(articleNumber);

        if (!chunkIds || chunkIds.length === 0) {
          throw new Error(
            `Financial Law article ${articleNumber} was not found in the canonical corpus.`,
          );
        }

        relevantChunkIds.push(...chunkIds);
      }

      const uniqueChunkIds = [...new Set(relevantChunkIds)];

      return {
        id: draft.id,
        query: draft.query,
        relevantChunkIds: uniqueChunkIds,
        ...(draft.relevance !== undefined
          ? { relevance: draft.relevance }
          : {}),
      };
    },
  );

  return {
    schema_version: "1.0",
    name: "financial-law-retrieval-v1-corrected",
    description:
      "Corrected overlay of the retrieval benchmark for Egyptian Financial Law No. 6 of 2022 (multi-relevant 36/37, answerable Art 67).",
    language: "ar",
    jurisdiction: "EG",
    items,
  };
}
