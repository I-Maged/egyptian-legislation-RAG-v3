import type { CanonicalCorpus } from "@egyptian-law/core";

import type {
  RetrievalGoldDataset,
  RetrievalGoldItem,
} from "./retrieval-dataset";

export interface FinancialLawGoldDraft {
  id: string;
  query: string;
  relevantArticleNumbers: string[];
  relevance?: Record<string, number>;
}

export const financialLawGoldDraft: FinancialLawGoldDraft[] = [
  {
    id: "financial-001",
    query: "على أي أساس زمني تصدر الموازنة العامة للدولة؟",
    relevantArticleNumbers: ["2"],
  },
  {
    id: "financial-002",
    query: "ما المكونات الرئيسية للموازنة العامة للدولة؟",
    relevantArticleNumbers: ["3"],
  },
  {
    id: "financial-003",
    query:
      "ما المبدأ الذي يجب على الجهة الإدارية تطبيقه خلال مراحل إعداد وتنفيذ الموازنة؟",
    relevantArticleNumbers: ["4"],
  },
  {
    id: "financial-004",
    query: "ما المعلومات المالية التي تلتزم الجهات الإدارية بالإفصاح عنها؟",
    relevantArticleNumbers: ["5"],
  },
  {
    id: "financial-005",
    query: "متى يجوز تخصيص مورد معين لاستخدام محدد في الموازنة؟",
    relevantArticleNumbers: ["6"],
  },
  {
    id: "financial-006",
    query: "هل يجوز إنشاء صناديق أو حسابات خاصة بغير قانون؟",
    relevantArticleNumbers: ["7"],
  },
  {
    id: "financial-007",
    query: "على أي أساس تُعد الموازنة العامة للدولة؟",
    relevantArticleNumbers: ["8"],
  },
  {
    id: "financial-008",
    query:
      "ما المجالات التي تلتزم وزارة المالية بتخصيص نسب من الإنفاق الحكومي لها وفقاً للدستور؟",
    relevantArticleNumbers: ["9"],
  },
  {
    id: "financial-009",
    query: "ما الأساس المحاسبي المستخدم في إعداد الموازنة العامة للدولة؟",
    relevantArticleNumbers: ["10"],
  },
  {
    id: "financial-010",
    query:
      "ما مدة الإطار متوسط المدى لموازنات الدولة والهيئات العامة الاقتصادية؟",
    relevantArticleNumbers: ["11"],
  },
  {
    id: "financial-011",
    query: "ما أبواب المصروفات الرئيسية في الموازنة العامة للدولة؟",
    relevantArticleNumbers: ["12"],
  },
  {
    id: "financial-012",
    query: "كيف تُصنف الحسابات الحكومية؟",
    relevantArticleNumbers: ["13"],
  },
  {
    id: "financial-013",
    query:
      "ما القانون الذي يحدد قواعد وبرامج واعتمادات الحسابات المالية المحلية في موازنة المحافظة؟",
    relevantArticleNumbers: ["14"],
  },
  {
    id: "financial-014",
    query:
      "ما الجهة التي تعد الخطة العامة للتنمية الاقتصادية والاجتماعية والأهداف الاستراتيجية للدولة؟",
    relevantArticleNumbers: ["15"],
  },
  {
    id: "financial-015",
    query: "من يتولى إقرار السياسة المالية العامة للدولة سنوياً؟",
    relevantArticleNumbers: ["16"],
  },
  {
    id: "financial-016",
    query:
      "ما دور وزير المالية في متابعة إعداد مشروعات موازنات الجهات الإدارية؟",
    relevantArticleNumbers: ["17"],
  },
  {
    id: "financial-017",
    query: "ما الالتزام الواقع على كل جهة إدارية بشأن إعداد مشروع موازنتها؟",
    relevantArticleNumbers: ["18"],
  },
  {
    id: "financial-018",
    query: "متى يقدم مشروع الإطار الموازني متوسط المدى؟",
    relevantArticleNumbers: ["19"],
  },
  {
    id: "financial-019",
    query: "من يتولى إعداد مشروع الموازنة العامة للدولة سنوياً؟",
    relevantArticleNumbers: ["20"],
  },
  {
    id: "financial-020",
    query:
      "متى يجوز إدراج اعتمادات إجمالية لبعض البنود أو الحسابات دون التقيد بالتفصيلات الاقتصادية؟",
    relevantArticleNumbers: ["21"],
  },
  {
    id: "financial-021",
    query:
      "ما البيانات المالية التي يجب أن يوضحها جدول الموازنة العامة المرافق لقانون ربط الموازنة؟",
    relevantArticleNumbers: ["22"],
  },
  {
    id: "financial-022",
    query: "إلى أي جهات يُعرض مشروع قانون ربط الموازنة العامة للدولة؟",
    relevantArticleNumbers: ["23"],
  },
  {
    id: "financial-023",
    query:
      "ما أثر اعتماد الإطار الموازني متوسط المدى على مشروع موازنة الوزارة أو الجهة؟",
    relevantArticleNumbers: ["24"],
  },
  {
    id: "financial-024",
    query: "ما الطبيعة القانونية للموازنة العامة للدولة؟",
    relevantArticleNumbers: ["25"],
  },
  {
    id: "financial-025",
    query: "ماذا يرخص قانون ربط الموازنة للجهات التنفيذية؟",
    relevantArticleNumbers: ["26"],
  },
  {
    id: "financial-026",
    query: "هل يجوز للتشريعات العامة أن تخالف قانون ربط الموازنة العامة؟",
    relevantArticleNumbers: ["27"],
  },
  {
    id: "financial-027",
    query:
      "كيف يتم الصرف إذا لم يصدر قانون ربط الموازنة قبل بداية السنة المالية؟",
    relevantArticleNumbers: ["28"],
  },
  {
    id: "financial-028",
    query:
      "ما القواعد التي تظل سارية بالنسبة إلى ربط الموازنات العامة المعتمدة؟",
    relevantArticleNumbers: ["29"],
  },
  {
    id: "financial-029",
    query:
      "ما الإجراء المطلوب قبل إصدار مشروع قانون أو قرار يترتب عليه عبء مالي إضافي على الموازنة العامة؟",
    relevantArticleNumbers: ["30"],
  },
  {
    id: "financial-030",
    query:
      "متى يجوز للجهة الإدارية إجراء صرف أو الحصول على تمويل أو الالتزام ببرنامج يترتب عليه عبء مالي؟",
    relevantArticleNumbers: ["31"],
  },
  {
    id: "financial-031",
    query:
      "متى تُنفذ القرارات الصادرة عن الجهات الإدارية التي يترتب عليها أعباء مالية؟",
    relevantArticleNumbers: ["32"],
  },
  {
    id: "financial-032",
    query: "ما الحساب الذي يُفتح لكل جهة مدرجة في الموازنة العامة للدولة؟",
    relevantArticleNumbers: ["33"],
  },
  {
    id: "financial-033",
    query:
      "ما القاعدة العامة لفتح الجهات الإدارية حسابات باسمها أو باسم الصناديق والحسابات الخاصة التابعة لها؟",
    relevantArticleNumbers: ["34"],
  },
  {
    id: "financial-034",
    query:
      "ما الذي يجب على الجهة الإدارية مراعاته عند الارتباط بمصروفات أو ديون أو إبرام عقد مالي؟",
    relevantArticleNumbers: ["35"],
  },
  {
    id: "financial-035",
    query:
      "ما القيود المفروضة على نقل مبالغ الاعتمادات من باب إلى باب آخر في الموازنة؟",
    relevantArticleNumbers: ["37"],
  },
  {
    id: "financial-036",
    query:
      "متى يجوز استخدام اعتمادات أو مبالغ من سنة مالية سابقة لتعزيز موازنة جهة إدارية؟",
    relevantArticleNumbers: ["38"],
  },
  {
    id: "financial-037",
    query: "ما حكم صرف أو تسوية مبالغ بعد استنفاد المخصصات اللازمة؟",
    relevantArticleNumbers: ["39"],
  },
  {
    id: "financial-038",
    query:
      "من يتحمل مسؤولية التوقيع على أوامر الصرف أو المستندات المالية المخالفة؟",
    relevantArticleNumbers: ["40"],
  },
  {
    id: "financial-039",
    query: "كيف يتم اعتماد أوامر الدفع الإلكترونية في الجهات الإدارية؟",
    relevantArticleNumbers: ["41"],
  },
  {
    id: "financial-040",
    query:
      "كيف تُرد المبالغ التي حُولت إلى حسابات المستفيدين بالخطأ من خلال وسائل الدفع الإلكتروني؟",
    relevantArticleNumbers: ["42"],
  },
  {
    id: "financial-041",
    query:
      "هل يجوز للجهة الإدارية قبول التبرعات أو الإعانات أو الهبات دون موافقات مسبقة؟",
    relevantArticleNumbers: ["43"],
  },
  {
    id: "financial-042",
    query: "على أي أساس تُحدد الدفعات التي تحصلها الجهة الإدارية مقدماً؟",
    relevantArticleNumbers: ["44"],
  },
  {
    id: "financial-043",
    query:
      "ما الإجراء المتعلق بالممتلكات المادية التي لا تسمح أرصدة الخزانة العامة بتمويلها؟",
    relevantArticleNumbers: ["45"],
  },
  {
    id: "financial-044",
    query:
      "ما المدة التي يجوز خلالها المطالبة بمستحقات العاملين من أجور ومكافآت وبدلات؟",
    relevantArticleNumbers: ["46"],
  },
  {
    id: "financial-045",
    query:
      "من المسؤول عن تنفيذ مواد الموازنة العامة للدولة وعرض التقارير المتعلقة بها؟",
    relevantArticleNumbers: ["48"],
  },
  {
    id: "financial-046",
    query:
      "ما السلع أو الأصول التي تُراعى عند إعداد الموازنة غير المتعلقة بالسلع الاستهلاكية؟",
    relevantArticleNumbers: ["49"],
  },
  {
    id: "financial-047",
    query:
      "ما القاعدة المتعلقة بالمجموعة المستندية والسجلات والنماذج المحاسبية المعتمدة؟",
    relevantArticleNumbers: ["50"],
  },
  {
    id: "financial-048",
    query: "ما دور وزارة المالية في حصر أرصدة الجهات الإدارية لدى البنوك؟",
    relevantArticleNumbers: ["51"],
  },
  {
    id: "financial-049",
    query:
      "ما اختصاص وزارة المالية في الرقابة على تنفيذ موازنات الجهات الإدارية؟",
    relevantArticleNumbers: ["52"],
  },
  {
    id: "financial-050",
    query: "ما طبيعة إشراف ممثلي وزارة المالية على العاملين بالوحدات الحسابية؟",
    relevantArticleNumbers: ["53"],
  },
  {
    id: "financial-051",
    query: "ما أهداف نظام الرقابة الداخلية في الجهة الإدارية؟",
    relevantArticleNumbers: ["54"],
  },
  {
    id: "financial-052",
    query: "ما السجلات التي تلتزم الجهة الإدارية بإعدادها وتحديثها دورياً؟",
    relevantArticleNumbers: ["55"],
  },
  {
    id: "financial-053",
    query: "من يتولى تفعيل لجنة الرقابة الداخلية في الجهة الإدارية؟",
    relevantArticleNumbers: ["56"],
  },
  {
    id: "financial-054",
    query: "ما مهام مكتب المراجعة في الجهات الإدارية؟",
    relevantArticleNumbers: ["57"],
  },
  {
    id: "financial-055",
    query:
      "ما اختصاص الجهات التفتيشية التابعة لوزارة المالية تجاه البيانات الحسابية للجهات الإدارية؟",
    relevantArticleNumbers: ["58"],
  },
  {
    id: "financial-056",
    query: "متى يجوز ترشيح أحد المختصين بالتفتيش المالي لفحص مسألة محددة؟",
    relevantArticleNumbers: ["59"],
  },
  {
    id: "financial-057",
    query:
      "ما الذي تلتزم به وزارة المالية بشأن نتائج التحقيقات والقرارات الصادرة عنها؟",
    relevantArticleNumbers: ["60"],
  },
  {
    id: "financial-058",
    query:
      "ما الحوادث التي يجب على الجهة الإدارية إخطار الوزارة والجهات الرقابية بها؟",
    relevantArticleNumbers: ["61"],
  },
  {
    id: "financial-059",
    query: "من يحدد سنوياً مواعيد تقديم القوائم المالية والحسابات الختامية؟",
    relevantArticleNumbers: ["62"],
  },
  {
    id: "financial-060",
    query: "ما المستندات المالية التي تلتزم كل جهة إدارية بإعدادها؟",
    relevantArticleNumbers: ["63"],
  },
  {
    id: "financial-061",
    query:
      "ما التقارير المتعلقة بالأداء التي يجب على الجهات الإدارية إعدادها وتقديمها؟",
    relevantArticleNumbers: ["64"],
  },
  {
    id: "financial-062",
    query:
      "خلال كم مدة يقدم الجهاز المركزي للمحاسبات تقرير نتائج مراجعة القوائم المالية والحسابات الختامية؟",
    relevantArticleNumbers: ["65"],
  },
  {
    id: "financial-063",
    query: "من يعد الحساب الختامي للدولة في نهاية السنة المالية؟",
    relevantArticleNumbers: ["66"],
  },
  {
    id: "financial-064",
    query: "ما الذي يشمله الحساب الختامي للدولة في نهاية السنة المالية؟",
    relevantArticleNumbers: ["66"],
  },
  {
    id: "financial-065",
    query:
      "خلال كم شهر من انتهاء السنة المالية تُرسل الحسابات الختامية للموازنة العامة والوحدات الاقتصادية بعد إجراء التسويات اللازمة؟",
    relevantArticleNumbers: ["67"],
  },
];

export function buildFinancialLawGoldDataset(
  corpus: CanonicalCorpus,
): RetrievalGoldDataset {
  const articleMap = new Map<string, string[]>();

  for (const chunk of corpus.chunks) {
    const chunkIds = articleMap.get(chunk.article_number) ?? [];

    chunkIds.push(chunk.id);

    articleMap.set(chunk.article_number, chunkIds);
  }

  const items: RetrievalGoldItem[] = financialLawGoldDraft.map((draft) => {
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
      ...(draft.relevance !== undefined ? { relevance: draft.relevance } : {}),
    };
  });

  return {
    schema_version: "1.0",
    name: "financial-law-retrieval-v1",
    description:
      "Initial manually curated retrieval benchmark for Egyptian Financial Law No. 18 of 2019.",
    language: "ar",
    jurisdiction: "EG",
    items,
  };
}
