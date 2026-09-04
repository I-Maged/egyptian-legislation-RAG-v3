import type { CanonicalCorpus } from "@egyptian-law/core";

import type {
  RetrievalGoldDataset,
  RetrievalGoldItem,
} from "./retrieval-dataset";

export interface LabourLawGoldDraft {
  id: string;
  query: string;
  relevantArticleNumbers: string[];
  relevance?: Record<string, number>;
}

/**
 * Initial manually curated Labour Law retrieval questions.
 *
 * Article numbers are resolved against the canonical corpus at runtime.
 * This keeps the benchmark independent of generated chunk IDs.
 */
export const labourLawGoldDraft: LabourLawGoldDraft[] = [
  {
    id: "labour-001",
    query: "ما هي مدة فترة الاختبار في عقد العمل؟",
    relevantArticleNumbers: ["90"],
  },

  {
    id: "labour-002",
    query: "كم مرة يجوز تعيين العامل تحت الاختبار لدى صاحب عمل واحد؟",
    relevantArticleNumbers: ["90"],
  },

  {
    id: "labour-003",
    query: "ما الحد الأقصى لساعات العمل الفعلية للعامل في اليوم والأسبوع؟",
    relevantArticleNumbers: ["117"],
  },

  {
    id: "labour-004",
    query: "هل تدخل فترات تناول الطعام والراحة ضمن ساعات العمل الفعلية؟",
    relevantArticleNumbers: ["117"],
  },

  {
    id: "labour-005",
    query: "ما الحد الأدنى لمجموع فترات تناول الطعام والراحة أثناء العمل؟",
    relevantArticleNumbers: ["118"],
  },

  {
    id: "labour-006",
    query: "ما أقصى مدة يمكن أن يعملها العامل متصلة دون فترة راحة؟",
    relevantArticleNumbers: ["118"],
  },

  {
    id: "labour-007",
    query: "ما الحد الأقصى للفترة بين بداية ساعات العمل ونهايتها في اليوم؟",
    relevantArticleNumbers: ["119"],
  },

  {
    id: "labour-008",
    query:
      "ما مدة تواجد العامل في المنشأة بالنسبة للأعمال المتقطعة أو ذات الطبيعة الخاصة؟",
    relevantArticleNumbers: ["119"],
  },

  {
    id: "labour-009",
    query: "ما البيانات التي يجب أن يتضمنها عقد العمل؟",
    relevantArticleNumbers: ["89"],
  },

  {
    id: "labour-010",
    query: "كم نسخة يجب تحريرها من عقد العمل؟",
    relevantArticleNumbers: ["89"],
  },

  {
    id: "labour-011",
    query:
      "ما المدة التي يلتزم فيها صاحب العمل بإعادة العامل إلى الجهة التي تم التعاقد معه فيها بعد انتهاء عقد العمل؟",
    relevantArticleNumbers: ["93"],
  },

  {
    id: "labour-012",
    query: "ما مدة الاحتفاظ بملف العامل بعد انتهاء علاقة العمل؟",
    relevantArticleNumbers: ["92"],
  },

  {
    id: "labour-013",
    query: "ما حقوق العاملة المتعلقة بإجازة الوضع؟",
    relevantArticleNumbers: ["54"],
  },

  {
    id: "labour-014",
    query: "ما حقوق العاملة بعد انتهاء إجازة الوضع؟",
    relevantArticleNumbers: ["55"],
  },

  {
    id: "labour-015",
    query: "ما العقوبات المقررة لمخالفة أحكام قانون العمل؟",
    relevantArticleNumbers: ["288", "289"],
  },

  {
    id: "labour-016",
    query: "من هو العامل وفقاً لتعريفات قانون العمل؟",
    relevantArticleNumbers: ["1"],
  },
  {
    id: "labour-017",
    query: "كيف يعرّف قانون العمل صاحب العمل؟",
    relevantArticleNumbers: ["1"],
  },
  {
    id: "labour-018",
    query: "ما المقصود بالأجر الأساسي في قانون العمل؟",
    relevantArticleNumbers: ["1"],
  },
  {
    id: "labour-019",
    query: "ما المقصود بالعمل المؤقت؟",
    relevantArticleNumbers: ["1"],
  },
  {
    id: "labour-020",
    query: "ما المقصود بالعامل غير المنتظم؟",
    relevantArticleNumbers: ["1"],
  },
  {
    id: "labour-021",
    query: "كيف تُحسب السنة والشهر في تطبيق أحكام قانون العمل؟",
    relevantArticleNumbers: ["2"],
  },
  {
    id: "labour-022",
    query: "ما طبيعة قانون العمل بالنسبة إلى القوانين المنظمة لعلاقات العمل؟",
    relevantArticleNumbers: ["3"],
  },
  {
    id: "labour-023",
    query: "ما الأفعال المحظورة عند تشغيل العامل وفقاً لقانون العمل؟",
    relevantArticleNumbers: ["4"],
  },
  {
    id: "labour-024",
    query: "ما أسباب التمييز المحظور في التدريب أو التوظيف أو ظروف العمل؟",
    relevantArticleNumbers: ["5"],
  },
  {
    id: "labour-025",
    query: "متى يُعد الشرط أو الاتفاق المخالف لقانون العمل باطلاً؟",
    relevantArticleNumbers: ["6"],
  },
  {
    id: "labour-026",
    query: "هل تُعفى الدعاوى العمالية من الرسوم والمصاريف القضائية؟",
    relevantArticleNumbers: ["7"],
  },
  {
    id: "labour-027",
    query: "ما الامتياز المقرر للمبالغ المستحقة للعامل؟",
    relevantArticleNumbers: ["8"],
  },
  {
    id: "labour-028",
    query:
      "هل تنقضي الالتزامات المستحقة للعامل بحل المنشأة أو تصفيتها أو إفلاسها؟",
    relevantArticleNumbers: ["9"],
  },
  {
    id: "labour-029",
    query:
      "كيف تكون مسؤولية أصحاب العمل المتعددين عن الالتزامات الناشئة عن قانون العمل؟",
    relevantArticleNumbers: ["10"],
  },
  {
    id: "labour-030",
    query:
      "هل يؤدي انتقال ملكية المنشأة أو إدماجها إلى إنهاء عقود عمل العاملين بها؟",
    relevantArticleNumbers: ["11"],
  },
  {
    id: "labour-031",
    query: "ما الحد الأدنى للعلاوة السنوية الدورية للعامل؟",
    relevantArticleNumbers: ["12"],
  },
  {
    id: "labour-032",
    query: "على من تسري أحكام باب التدريب والتشغيل؟",
    relevantArticleNumbers: ["16"],
  },
  {
    id: "labour-033",
    query: "ما دور الجهة الإدارية المختصة في التوجيه المهني لراغبي التدريب؟",
    relevantArticleNumbers: ["17"],
  },
  {
    id: "labour-034",
    query: "ما أبرز اختصاصات صندوق تمويل التدريب والتأهيل؟",
    relevantArticleNumbers: ["20"],
  },
  {
    id: "labour-035",
    query:
      "ما نسبة مساهمة المنشآت التي يعمل بها ثلاثون عاملاً فأكثر في موارد صندوق تمويل التدريب والتأهيل؟",
    relevantArticleNumbers: ["21"],
  },
  {
    id: "labour-036",
    query:
      "ما الأشكال القانونية التي يجوز أن تتخذها الجهة التي تزاول عمليات التدريب؟",
    relevantArticleNumbers: ["22"],
  },
  {
    id: "labour-037",
    query:
      "هل يلزم الحصول على ترخيص من الوزارة المختصة لمزاولة عمليات التدريب؟",
    relevantArticleNumbers: ["23"],
  },
  {
    id: "labour-038",
    query:
      "ما البيانات التي يجب أن تتضمنها البرامج التدريبية المقدمة لاعتمادها؟",
    relevantArticleNumbers: ["24"],
  },
  {
    id: "labour-039",
    query: "ما شرط مزاولة المدربين لأعمال التدريب؟",
    relevantArticleNumbers: ["25"],
  },
  {
    id: "labour-040",
    query: "ما الشهادة التي تلتزم جهة التدريب بمنحها للمتدرب؟",
    relevantArticleNumbers: ["26"],
  },
  {
    id: "labour-041",
    query: "متى يلزم الحصول على ترخيص لمزاولة مهنة أو حرفة؟",
    relevantArticleNumbers: ["27"],
  },
  {
    id: "labour-042",
    query: "ما الحد الأدنى لسن المتدرج؟",
    relevantArticleNumbers: ["28"],
  },
  {
    id: "labour-043",
    query: "ما البيانات الأساسية التي يجب أن يتضمنها اتفاق التدرج؟",
    relevantArticleNumbers: ["29"],
  },
  {
    id: "labour-044",
    query: "متى يجوز لصاحب العمل أو المتدرج إنهاء اتفاق التدرج؟",
    relevantArticleNumbers: ["30"],
  },
  {
    id: "labour-045",
    query:
      "ما الأحكام التي تسري على المتدرجين بشأن الإجازات وساعات العمل وفترات الراحة؟",
    relevantArticleNumbers: ["31"],
  },
  {
    id: "labour-046",
    query:
      "ما البيانات التي يجب على راغب العمل تقديمها عند طلب قيد اسمه لدى الجهة الإدارية المختصة؟",
    relevantArticleNumbers: ["33"],
  },
  {
    id: "labour-047",
    query:
      "ما المستندات الإضافية المطلوبة من راغب العمل الذي يمارس مهنة أو حرفة محددة بقرار من الوزير؟",
    relevantArticleNumbers: ["34"],
  },
  {
    id: "labour-048",
    query:
      "خلال كم يوماً تلتزم المنشأة بإعادة شهادة قيد العامل إلى الجهة الإدارية المختصة؟",
    relevantArticleNumbers: ["35"],
  },
  {
    id: "labour-049",
    query:
      "خلال كم يوماً يجب على المنشأة إرسال بيان تفصيلي بعدد العمال وبياناتهم إلى الجهة الإدارية المختصة؟",
    relevantArticleNumbers: ["36"],
  },
  {
    id: "labour-050",
    query:
      "ما السجل الذي تلتزم المنشأة بإمساكه لقيد الأشخاص ذوي الإعاقة والأقزام؟",
    relevantArticleNumbers: ["37"],
  },
  {
    id: "labour-051",
    query:
      "خلال كم يوماً يجب على المنشأة موافاة الوزارة بالبيانات اللازمة لقواعد بيانات العمالة عند طلبها؟",
    relevantArticleNumbers: ["38"],
  },
  {
    id: "labour-052",
    query: "ما الأعمال والوظائف المستثناة من أحكام فصل سياسات التشغيل؟",
    relevantArticleNumbers: ["39"],
  },
  {
    id: "labour-053",
    query: "ما الجهات التي يجوز لها إلحاق المصريين بالعمل في الداخل أو الخارج؟",
    relevantArticleNumbers: ["40"],
  },
  {
    id: "labour-054",
    query:
      "هل يجوز للجهات التي تلحق العمالة بالعمل تقاضي مبالغ مالية من العامل مقابل إلحاقه بالعمل؟",
    relevantArticleNumbers: ["43"],
  },
  {
    id: "labour-055",
    query: "هل يجوز للمنشأة تشغيل عمال عن طريق متعهد أو مقاول توريد عمال؟",
    relevantArticleNumbers: ["45"],
  },
  {
    id: "labour-056",
    query:
      "ما التزام صاحب العمل أو وكالة التشغيل الخاصة عند الإعلان عن وظيفة شاغرة؟",
    relevantArticleNumbers: ["47"],
  },
  {
    id: "labour-057",
    query:
      "كل كم مدة يجب على الجهات التي تزاول عمليات التشغيل موافاة الوزارة ببيانات ونتائج أعمالها؟",
    relevantArticleNumbers: ["51"],
  },
  {
    id: "labour-058",
    query: "هل يجوز ممارسة إلحاق المصريين بالعمل إلكترونياً دون ترخيص؟",
    relevantArticleNumbers: ["52"],
  },
  {
    id: "labour-059",
    query:
      "هل يضمن قانون العمل المساواة في الأجر بين الذكور والإناث عن العمل ذي القيمة المتساوية؟",
    relevantArticleNumbers: ["53"],
  },
  {
    id: "labour-060",
    query: "ما مدة إجازة الوضع المقررة للعاملة؟",
    relevantArticleNumbers: ["54"],
  },
  {
    id: "labour-061",
    query: "ما حق العاملة في العودة إلى العمل بعد انتهاء إجازة الوضع؟",
    relevantArticleNumbers: ["55"],
  },
  {
    id: "labour-062",
    query: "ما مدة فترتي الرضاعة الإضافيتين المقررتين للعاملة المرضعة؟",
    relevantArticleNumbers: ["56"],
  },
  {
    id: "labour-063",
    query: "ما الحد الأقصى لمدة الإجازة دون أجر لرعاية طفل العاملة؟",
    relevantArticleNumbers: ["57"],
  },
  {
    id: "labour-064",
    query: "متى يجوز للعاملة إنهاء عقد العمل بسبب الزواج أو الحمل أو الإنجاب؟",
    relevantArticleNumbers: ["58"],
  },
  {
    id: "labour-065",
    query: "ما الحد الأقصى لساعات تشغيل الطفل يومياً؟",
    relevantArticleNumbers: ["65"],
  },
];

export function buildLabourLawGoldDataset(
  corpus: CanonicalCorpus,
): RetrievalGoldDataset {
  const articleMap = new Map<string, string[]>();

  for (const chunk of corpus.chunks) {
    const chunkIds = articleMap.get(chunk.article_number) ?? [];

    chunkIds.push(chunk.id);

    articleMap.set(chunk.article_number, chunkIds);
  }

  const items: RetrievalGoldItem[] = labourLawGoldDraft.map((draft) => {
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
      ...(draft.relevance !== undefined ? { relevance: draft.relevance } : {}),
    };
  });

  return {
    schema_version: "1.0",
    name: "labour-law-retrieval-v1",
    description:
      "Initial manually curated retrieval benchmark for Egyptian Labour Law No. 148 of 2019.",
    language: "ar",
    jurisdiction: "EG",
    items,
  };
}
