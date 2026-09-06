import type { CanonicalCorpus } from "@egyptian-law/core";

import type {
  RetrievalGoldDataset,
  RetrievalGoldItem,
} from "./retrieval-dataset";
import {
  labourLawGoldDraft,
  type LabourLawGoldDraft,
} from "./labour-law-gold";

/**
 * Additive corrections overlay for the Labour Law gold dataset.
 *
 * Base `labourLawGoldDraft` is untouched; this maps it 1:1 to a corrected
 * draft (still 65 items). All 65 article references were verified to exist
 * in `data/canonical/labour-law-14-2025.json` (298 chunks, 1..298) and all
 * queries matched except one:
 *
 * - `labour-015`: generic `ما العقوبات المقررة لمخالفة أحكام قانون العمل؟`
 *   over-claimed against the penalty chain `288-298` while only labeling
 *   `["288", "289"]`. Any retrieval of Art 290+ would score as a miss even
 *   though it answers the generic query. Narrowed to the topics actually
 *   covered by Arts 288-289 (العلاوة السنوية، اتفاق التدرج، إجازات المرأة
 *   العاملة، عقود العمل وملفاتها، ساعات العمل وفترات الراحة، تشغيل الأطفال)
 *   so the label is faithful without changing the article set.
 *
 * Paraphrase pairs sharing an article (`90×2`, `117×2`, `118×2`, `119×2`,
 * `89×2`, `54×2`, `55×2`) are intentional distinct facets and are kept.
 */
export const labourLawGoldCorrections: Record<
  string,
  Partial<LabourLawGoldDraft>
> = {
  "labour-015": {
    query:
      "ما عقوبة مخالفة أحكام العلاوة السنوية واتفاق التدرج وإجازات المرأة العاملة وعقود العمل وساعات العمل وفترات الراحة وتشغيل الأطفال؟",
    relevantArticleNumbers: ["288", "289"],
  },
};

export const labourLawGoldCorrectedDraft: LabourLawGoldDraft[] =
  labourLawGoldDraft.map((draft) => {
    const correction = labourLawGoldCorrections[draft.id];

    if (!correction) {
      return draft;
    }

    return { ...draft, ...correction };
  });

export function buildLabourLawGoldDatasetCorrected(
  corpus: CanonicalCorpus,
): RetrievalGoldDataset {
  const articleMap = new Map<string, string[]>();

  for (const chunk of corpus.chunks) {
    const chunkIds = articleMap.get(chunk.article_number) ?? [];

    chunkIds.push(chunk.id);

    articleMap.set(chunk.article_number, chunkIds);
  }

  const items: RetrievalGoldItem[] = labourLawGoldCorrectedDraft.map(
    (draft) => {
      const relevantChunkIds: string[] = [];

      for (const articleNumber of draft.relevantArticleNumbers) {
        const chunkIds = articleMap.get(articleNumber);

        if (!chunkIds || chunkIds.length === 0) {
          throw new Error(
            `Labour Law article ${articleNumber} was not found in the canonical corpus.`,
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
    name: "labour-law-retrieval-v1-corrected",
    description:
      "Corrected overlay of the retrieval benchmark for Egyptian Labour Law No. 14 of 2025 (faithful penalty query for Arts 288-289).",
    language: "ar",
    jurisdiction: "EG",
    items,
  };
}
