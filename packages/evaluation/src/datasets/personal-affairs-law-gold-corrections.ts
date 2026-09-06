import type { CanonicalCorpus } from "@egyptian-law/core";

import type {
  RetrievalGoldDataset,
  RetrievalGoldItem,
} from "./retrieval-dataset";
import {
  personalAffairsLawGoldDraft,
  type PersonalAffairsLawGoldDraft,
} from "./personal-affairs-law-gold";

/**
 * Additive corrections overlay for the Personal Affairs gold dataset.
 *
 * Base `personalAffairsLawGoldDraft` is untouched; this maps it 1:1 to a
 * corrected draft (still 70 items) verified against
 * `data/canonical/personal-affairs/*.json` (14 instruments).
 *
 * Fixes:
 * - ID typo: `personal--59` → `personal-059` (output ID only).
 * - 6 exact-duplicate queries replaced with new distinct questions
 *   targeting zero-coverage instruments (Law 1/2000, guardianship
 *   118/1952, ministerial decisions 1086/1087/1089, inheritance
 *   application 35/1944). Each replacement was written from the actual
 *   chunk text quoted below.
 * - 3 semantic mismatches rewritten to describe what the labeled chunk
 *   actually says (fix questions, never the corpus):
 *   - `personal-012` asked about إخفاء الطلاق/الميراث vs chunk `b82aea|5|5`
 *     (الزوج الغائب/النفقة) → rewritten to بعيد الغيبة facet.
 *   - `personal-026` asked about حساب السنة vs chunk `ecde|13|29`
 *     (ضرب أجل للغائب) → rewritten to match the chunk.
 *   - `personal-060` asked about نوع طلاق العيب (answer lives in
 *     `b82aea|10|10` as in `personal-054`) vs chunk `ecde|10|24`
 *     (اقتراح الحكمان) → rewritten to الإساءة المشتركة facet.
 *
 * Residual accepted gap (count locked at 70): ministerial decision
 * 1090/2000 (`lawdoc_4900629b37816aa3`, سجل الولاية) still uncovered;
 * 7/14 instruments were at zero before, 6 are now covered.
 */
export interface PersonalAffairsLawGoldCorrection {
  id?: string;
  query?: string;
  relevantSources?: PersonalAffairsLawGoldDraft["relevantSources"];
}

export const personalAffairsLawGoldCorrections: Record<
  string,
  PersonalAffairsLawGoldCorrection
> = {
  // Duplicate of personal-016 → repurposed to Law 1/2000 (أهلية التقاضي 15 سنة).
  // Chunk lawdoc_f1634b36a2edb8e5|2|294: `تثبت اهلية التقاضي في مسايل
  // الاحوال الشخصيه ... خمس عشره سنة ميلاديا كامله ...`
  "personal-045": {
    query: "متى تثبت أهلية التقاضي في مسائل الأحوال الشخصية وما سنها؟",
    relevantSources: [
      {
        documentId: "lawdoc_f1634b36a2edb8e5",
        articleNumber: "2",
        sourceOrder: 294,
      },
    ],
  },
  // Duplicate of personal-018 → repurposed to guardianship 118/1952 (سلب الولاية).
  // Chunk lawdoc_cc7f5358e6f50741|2|184: `تسلب الولاية ... من حكم عليه في
  // جريمة الاغتصاب او هتك العرض ... اذا وقعت الجريمة علي احد من تشملهم الولاية`
  "personal-030": {
    query: "متى تسلب الولاية على النفس بسبب جرائم الاغتصاب أو هتك العرض؟",
    relevantSources: [
      {
        documentId: "lawdoc_cc7f5358e6f50741",
        articleNumber: "2",
        sourceOrder: 184,
      },
    ],
  },
  // Mismatch: query asked about حساب السنة vs chunk ضرب أجل للغائب.
  // Chunk lawdoc_ecde51a89e480e6f|13|29: `ان تكون الوصول الرسايل الي الغايب
  // ضرب لسرة له القاضي اجلا ... فاذا انقضي الاجل ... فرق القاضي بينهما ...`
  "personal-026": {
    query: "ماذا يفعل القاضي إذا تعذر وصول الرسائل إلى الزوج الغائب؟",
  },
  // Duplicate of personal-027 → repurposed to ministerial decision 1087/2000 (الرؤية).
  // Chunk lawdoc_7dec8242be0a45d0|5|392: `يجب ان لا تقل مدة الروية عن ثلاث
  // ساعات اسبوعيا فيما بين الساعة التاسة صباحا والساعة السابعة مساء`
  "personal-065": {
    query: "ما الحد الأدنى لمدة رؤية الصغير أسبوعياً وما وقتها؟",
    relevantSources: [
      {
        documentId: "lawdoc_7dec8242be0a45d0",
        articleNumber: "5",
        sourceOrder: 392,
      },
    ],
  },
  // Duplicate of personal-031 → repurposed to inheritance application 35/1944.
  // Chunk lawdoc_c6f9a8b9f1625847|1|96: `قوانين الميراث والوصية واحكام
  // الشريعة الاسلامية ... هي قانون البلد ... اذا كان المورث غير مسلم جاز
  // لورثته ... ان يكون التوريث طبقا لشريعة المتوفي`
  "personal-066": {
    query: "ما القانون الواجب التطبيق على المواريث والوصايا إذا كان المورث غير مسلم؟",
    relevantSources: [
      {
        documentId: "lawdoc_c6f9a8b9f1625847",
        articleNumber: "1",
        sourceOrder: 96,
      },
    ],
  },
  // Mismatch: asked about إخفاء الطلاق/الميراث vs chunk الزوج الغائب/النفقة.
  // Chunk lawdoc_9a396852aeb82aea|5|5: `... فان كان بعيد الغيبة لا يسهل
  // الوصول اليه، ان كان مجهول المحل او كان مفقودا و ثبت لا مال له ... طلق
  // عليه القاضي ...` — distinct بعيد الغيبة facet vs personal-010/068/069.
  "personal-012": {
    query: "كيف يتصرف القاضي مع الزوج الغائب بعيد الغيبة الذي يتعذر الوصول إليه في نفقة زوجته؟",
  },
  // Mismatch: asked about نوع طلاق العيب (answer in b82aea|10|10) vs chunk
  // اقتراح الحكمان. Chunk lawdoc_ecde51a89e480e6f|10|24: `... واذا كانت
  // الاساءة مشتركة اقترحا التطليق دون بدل او بديل يتناسب مع نسبة الاساءة`
  // — distinct facet vs personal-055 (الزوج) / personal-062 (الزوجة).
  "personal-060": {
    query: "ماذا يقترح الحكمان إذا عجزا عن الإصلاح وكانت الإساءة مشتركة؟",
  },
  // Duplicate of personal-055 → repurposed to ministerial decision 1089/2000.
  // Chunk lawdoc_564e9a4543479401|1|420: `ينشا بمقر كل محكمة مكتب
  // للاخصاييين الاجتماعيين يخضع للاشراف المباشر لرييسها`
  "personal-061": {
    query: "أين ينشأ مكتب الأخصائيين الاجتماعيين ومن يشرف عليه؟",
    relevantSources: [
      {
        documentId: "lawdoc_564e9a4543479401",
        articleNumber: "1",
        sourceOrder: 420,
      },
    ],
  },
  // Duplicate of personal-026 (after its rewrite above, this slot is freed)
  // → repurposed to ministerial decision 1086/2000 (الضبطية القضائية).
  // Chunk lawdoc_89f9d0f223a55d6d|1|386: `يكون للمعاونين العاملين حاليا
  // بنيابات الاحوال الشخصية صفة الضبطية القضايية ...`
  "personal-064": {
    query: "من من العاملين بنيابات الأحوال الشخصية له صفة الضبطية القضائية؟",
    relevantSources: [
      {
        documentId: "lawdoc_89f9d0f223a55d6d",
        articleNumber: "1",
        sourceOrder: 386,
      },
    ],
  },
  // Typo fix: `personal--59` → `personal-059`. Query itself is faithful to
  // chunk lawdoc_9a396852aeb82aea|9|9 (`... سواء كان تزوجته عالمة بالعيب ...
  // ورضيت به ...`) so only the ID changes.
  "personal--59": {
    id: "personal-059",
  },
};

export const personalAffairsLawGoldCorrectedDraft: PersonalAffairsLawGoldDraft[] =
  personalAffairsLawGoldDraft.map((draft) => {
    const correction = personalAffairsLawGoldCorrections[draft.id];

    if (!correction) {
      return draft;
    }

    return { ...draft, ...correction };
  });

export function buildPersonalAffairsLawGoldDatasetCorrected(
  corpora: CanonicalCorpus[],
): RetrievalGoldDataset {
  const chunksByDocument = new Map<string, CanonicalCorpus["chunks"]>();

  for (const corpus of corpora) {
    chunksByDocument.set(corpus.document.id, corpus.chunks);
  }

  const items: RetrievalGoldItem[] =
    personalAffairsLawGoldCorrectedDraft.map((draft) => {
      const relevantChunkIds: string[] = [];

      for (const source of draft.relevantSources) {
        const chunks = chunksByDocument.get(source.documentId);

        if (!chunks) {
          throw new Error(
            `Personal Affairs document ${source.documentId} was not found in the canonical corpora.`,
          );
        }

        const matchingChunks = chunks.filter(
          (chunk) =>
            chunk.article_number === source.articleNumber &&
            (source.sourceOrder === undefined ||
              chunk.source_order === source.sourceOrder),
        );

        if (matchingChunks.length === 0) {
          throw new Error(
            `Personal Affairs document ${source.documentId} article ${source.articleNumber} (source order ${source.sourceOrder ?? "any"}) was not found in the canonical corpus.`,
          );
        }

        relevantChunkIds.push(...matchingChunks.map((chunk) => chunk.id));
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
    });

  return {
    schema_version: "1.0",
    name: "personal-affairs-retrieval-v1-corrected",
    description:
      "Corrected overlay of the retrieval benchmark across the Egyptian Personal Affairs corpus (ID typo fixed, duplicates replaced, mismatches rewritten).",
    language: "ar",
    jurisdiction: "EG",
    items,
  };
}
