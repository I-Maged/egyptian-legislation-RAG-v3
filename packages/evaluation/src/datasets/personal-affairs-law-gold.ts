import type { CanonicalCorpus } from "@egyptian-law/core";

import type {
  RetrievalGoldDataset,
  RetrievalGoldItem,
} from "./retrieval-dataset";

export interface PersonalAffairsLawGoldDraft {
  id: string;
  query: string;
  relevantArticleNumbers: string[];
  relevance?: Record<string, number>;
}

export const personalAffairsLawGoldDraft: PersonalAffairsLawGoldDraft[] = [
  {
    id: "personal-001",
    query: "متى تعتبر نفقة المطلقة دينًا؟",
    relevantArticleNumbers: ["2"],
  },
  {
    id: "personal-002",
    query: "كم مرة يقع الطلاق المقترن بعدد لفظ أو إشارة؟",
    relevantArticleNumbers: ["3"],
  },
  {
    id: "personal-003",
    query: "متى يستحق الإرث؟",
    relevantArticleNumbers: ["2"],
  },
  {
    id: "personal-004",
    query: "ما هي طرق انعقاد الوصية؟",
    relevantArticleNumbers: ["2"],
  },
  {
    id: "personal-005",
    query: "ماذا يلغي نص المادة 2 بشأن الكتاب الأول من قانون المحاكم الحسبية؟",
    relevantArticleNumbers: ["2"],
  },
  {
    id: "personal-006",
    query: "متى يجوز للولي مباشرة حق من حقوق الولاية؟",
    relevantArticleNumbers: ["2"],
  },
  {
    id: "personal-007",
    query:
      "ما الإجراءات التي يتخذها القاضي إذا امتنع الزوج عن الإنفاق وكان له مال ظاهر؟",
    relevantArticleNumbers: ["4"],
  },
  {
    id: "personal-008",
    query:
      "أي قانون تطبق قواعده وإجراءاته على الإعلان بوقوع الطلاق فيما عدا ما تقدم؟",
    relevantArticleNumbers: ["4"],
  },
  {
    id: "personal-009",
    query: "من الذي يتولى إجراءات الجرد؟",
    relevantArticleNumbers: ["20", "21", "43"],
  },
  {
    id: "personal-010",
    query:
      "في حالة غياب الزوج هل يختلف تطبيق أحكام التنفيذ إذا كان له مال ظاهر؟",
    relevantArticleNumbers: ["5"],
  },
  {
    id: "personal-011",
    query: "خلال كم يوم يجب توثيق إشهاد الطلاق لدى الموثق؟",
    relevantArticleNumbers: ["5"],
  },
  {
    id: "personal-012",
    query:
      "متى تترتب آثار الطلاق من حيث الميراث والحقوق المالية إذا أخفى الزوج وقوع الطلاق عن زوجته؟",
    relevantArticleNumbers: ["5"],
  },
  {
    id: "personal-013",
    query: "هل يمنع قتل المورث عمدًا استحقاق الإرث عن القاتل؟",
    relevantArticleNumbers: ["5"],
  },
  {
    id: "personal-014",
    query: "متى يجوز وصية المحجور عليه للسفه أو الغفلة بإذن المجلس الحسبي؟",
    relevantArticleNumbers: ["5"],
  },
  {
    id: "personal-015",
    query: "متى يجوز للولي التبرع بمال القاصر؟",
    relevantArticleNumbers: ["5"],
  },
  {
    id: "personal-016",
    query:
      "ما المدة اللازمة للحكم بموت المفقود إذا كان على ظهر سفينة غرقت أو في طائرة سقطت؟",
    relevantArticleNumbers: ["21"],
  },
  {
    id: "personal-017",
    query:
      "ماذا يفعل الموثق إذا لم تحضر المطلقة لاستلام نسخة إشهاد الطلاق خلال المدة المقررة؟",
    relevantArticleNumbers: ["5"],
  },
  {
    id: "personal-018",
    query: "ما أثر غياب الزوج على سماع دعوى نسب الولد؟",
    relevantArticleNumbers: ["15"],
  },
  {
    id: "personal-019",
    query: "كم نسخة يحرر بها محضر جرد الأموال؟",
    relevantArticleNumbers: ["5"],
  },
  {
    id: "personal-020",
    query: "تحت أي شرط يمكن للزوج أن يرجع زوجته بعد تطليقها لعدم الإنفاق؟",
    relevantArticleNumbers: ["6"],
  },
  {
    id: "personal-021",
    query:
      "ما نوع الطلاق الذي يوقعه القاضي إذا ثبت الضرر الذي ألحقه الزوج بزوجته؟",
    relevantArticleNumbers: ["6"],
  },
  {
    id: "personal-022",
    query: "هل يورث المسلم وغير المسلم بعضهما بعضًا؟",
    relevantArticleNumbers: ["6"],
  },
  {
    id: "personal-023",
    query:
      "ما الواجبات الإدارية التي تترتب على النائب أو الوصي عند انتهاء الوصاية؟",
    relevantArticleNumbers: ["50"],
  },
  {
    id: "personal-024",
    query:
      "ما الحد الأقصى للمدة التي يُحكم بعدها بموت المفقود في الحالات العامة؟",
    relevantArticleNumbers: ["21"],
  },
  {
    id: "personal-025",
    query:
      "ماذا يحدث إذا صدر حكم بموت المفقود أو نشر قرار رئاسي باعتباره ميتًا؟",
    relevantArticleNumbers: ["22"],
  },
  {
    id: "personal-026",
    query:
      "ما المدة التي يبدأ منها سريان حكم القانون المشار إليه في حساب السنة المتعلقة ببعض دعاوى الأحوال الشخصية؟",
    relevantArticleNumbers: ["13"],
  },
  {
    id: "personal-027",
    query: "متى يجوز لزوجة المحكوم عليه بعقوبة سالبة للحرية طلب التطليق عليه؟",
    relevantArticleNumbers: ["14"],
  },
  {
    id: "personal-028",
    query:
      "ما مدة العقوبة التي يترتب عليها حق الزوجة في طلب التطليق وفقاً للنص؟",
    relevantArticleNumbers: ["14"],
  },
  {
    id: "personal-029",
    query: "متى لا تُسمع دعوى النسب عند إنكار الزوج؟",
    relevantArticleNumbers: ["15"],
  },
  {
    id: "personal-030",
    query: "ما أثر غياب الزوج على سماع دعوى نسب الولد؟",
    relevantArticleNumbers: ["15"],
  },
  {
    id: "personal-031",
    query: "كيف تُقدر نفقة الزوجة بحسب حالة الزوج؟",
    relevantArticleNumbers: ["16"],
  },
  {
    id: "personal-032",
    query: "ما الحد الأدنى لنفقة الزوجة في حالة عسر الزوج؟",
    relevantArticleNumbers: ["16"],
  },
  {
    id: "personal-033",
    query:
      "خلال كم مدة يجب على القاضي عرض النفقة المؤقتة عند توافر سبب استحقاقها؟",
    relevantArticleNumbers: ["16"],
  },
  {
    id: "personal-034",
    query: "ما المدة التي لا تُسمع بعدها دعوى النفقة من تاريخ الطلاق؟",
    relevantArticleNumbers: ["17"],
  },
  {
    id: "personal-035",
    query: "متى تستحق المطلقة المدخول بها في زواج صحيح متعة الطلاق؟",
    relevantArticleNumbers: ["17"],
  },
  {
    id: "personal-036",
    query: "ما الحد الأقصى لمدة المتعة التي تستحقها المطلقة وفقاً للنص؟",
    relevantArticleNumbers: ["17"],
  },
  {
    id: "personal-037",
    query:
      "ما المدة التي لا يجوز تنفيذ حكم النفقة عن مدة تتجاوزها من تاريخ الطلاق؟",
    relevantArticleNumbers: ["18"],
  },
  {
    id: "personal-038",
    query: "على من تستمر نفقة الأولاد حتى زواج البنت أو اكتساب الابن؟",
    relevantArticleNumbers: ["18"],
  },
  {
    id: "personal-039",
    query: "كيف يُحسم الخلاف بين الزوجين في مقدار المهر؟",
    relevantArticleNumbers: ["19"],
  },
  {
    id: "personal-040",
    query: "ما حكم اختلاف أحد الزوجين مع ورثة الزوج الآخر بشأن مقدار المهر؟",
    relevantArticleNumbers: ["19"],
  },
  {
    id: "personal-041",
    query: "متى ينتهي حق حضانة النساء للصغير والصغيرة؟",
    relevantArticleNumbers: ["20"],
  },
  {
    id: "personal-042",
    query:
      "إلى أي سن يجوز للقاضي إبقاء الصغيرة في يد الحاضنة إذا اقتضت مصلحتها ذلك؟",
    relevantArticleNumbers: ["20"],
  },
  {
    id: "personal-043",
    query: "ما حق كل من الأبوين والأجداد في رؤية الصغير أو الصغيرة؟",
    relevantArticleNumbers: ["20"],
  },
  {
    id: "personal-044",
    query: "متى يُحكم بموت المفقود إذا غلب عليه الهلاك؟",
    relevantArticleNumbers: ["21"],
  },
  {
    id: "personal-045",
    query:
      "ما المدة اللازمة للحكم بموت المفقود إذا كان على ظهر سفينة غرقت أو في طائرة سقطت؟",
    relevantArticleNumbers: ["21"],
  },
  {
    id: "personal-046",
    query:
      "ما الآثار المترتبة على الحكم بموت المفقود بالنسبة إلى زوجته وتركته؟",
    relevantArticleNumbers: ["22"],
  },
  {
    id: "personal-047",
    query: "متى تُقسم تركة المفقود المحكوم بموته؟",
    relevantArticleNumbers: ["22"],
  },
  {
    id: "personal-048",
    query: "متى يجوز للزوجة طلب التفريق بسبب عيب في الزوج؟",
    relevantArticleNumbers: ["9"],
  },
  {
    id: "personal-049",
    query: "من الذي يقيد نسخة إشهاد الطلاق في السجل ويعتمد القيد؟",
    relevantArticleNumbers: ["6"],
  },
  {
    id: "personal-050",
    query: "متى يستعان بأهل الخبرة في دعاوى الفسخ المتعلقة بعيوب الزواج؟",
    relevantArticleNumbers: ["11"],
  },
  {
    id: "personal-051",
    query: "ماذا يترتب على عودة المفقود أو عدم تبين حياته بالنسبة لزواجه؟",
    relevantArticleNumbers: ["8"],
  },
  {
    id: "personal-052",
    query: "ما مدة مأمورية الحكمين وحدها وحد الإضافة التي يجوز للمحكمة منحها؟",
    relevantArticleNumbers: ["8"],
  },
  {
    id: "personal-053",
    query: "في أي حالة يثبت للآب فرض السدس؟",
    relevantArticleNumbers: ["9", "21"],
  },
  {
    id: "personal-054",
    query: "ما نوع الطلاق في الفرقة بالعيب؟",
    relevantArticleNumbers: ["10"],
  },
  {
    id: "personal-055",
    query: "ماذا يقترح الحكمان إذا كانت الإساءة كلها من جانب الزوج؟",
    relevantArticleNumbers: ["10"],
  },
  {
    id: "personal-056",
    query:
      "ما البيان الذي يجب أن يثبته الموثق في وثيقة الزواج عن حالة الزوج الاجتماعية؟",
    relevantArticleNumbers: ["8"],
  },
  {
    id: "personal-057",
    query:
      "ما الحكم الذي يُقضى به إذا طلبت الزوجة التفريق لعيب لا يُحتمل دوام العشرة؟",
    relevantArticleNumbers: ["9"],
  },
  {
    id: "personal-058",
    query:
      "هل يؤثر امتناع أحد الزوجين عن حضور مجلس التحكيم على سير عمل الحكمين إذا تم إخطارهما؟",
    relevantArticleNumbers: ["9"],
  },

  {
    id: "personal--59",
    query:
      "هل يؤثر علم الزوجة بالعيب قبل الزواج أو رضاها به بعد العقد في حقها في طلب التفريق؟",
    relevantArticleNumbers: ["9"],
  },
  {
    id: "personal-060",
    query: "ما نوع الطلاق الناتج عن التفريق بسبب العيب؟",
    relevantArticleNumbers: ["10"],
  },
  {
    id: "personal-061",
    query: "ماذا يقترح الحكمان إذا كانت الإساءة كلها من جانب الزوج؟",
    relevantArticleNumbers: ["10"],
  },
  {
    id: "personal-062",
    query: "ماذا يقترح الحكمان إذا كانت الإساءة كلها من جانب الزوجة؟",
    relevantArticleNumbers: ["10"],
  },
  {
    id: "personal-063",
    query: "بمن تستعين المحكمة للتحقق من العيوب التي يُطلب فسخ الزواج بسببها؟",
    relevantArticleNumbers: ["11"],
  },
  {
    id: "personal-064",
    query:
      "ما المدة التي يبدأ منها سريان حكم القانون المشار إليه في حساب السنة المتعلقة ببعض دعاوى الأحوال الشخصية؟",
    relevantArticleNumbers: ["13"],
  },
  {
    id: "personal-065",
    query: "متى يجوز لزوجة المحكوم عليه بعقوبة سالبة للحرية طلب التطليق عليه؟",
    relevantArticleNumbers: ["14"],
  },
  {
    id: "personal-066",
    query: "كيف تُقدر نفقة الزوجة بحسب حالة الزوج؟",
    relevantArticleNumbers: ["16"],
  },
  {
    id: "personal-067",
    query:
      "ماذا يجوز للزوجة أن تطلب إذا امتنع زوجها عن الإنفاق ولم يكن له مال ظاهر؟",
    relevantArticleNumbers: ["4"],
  },
  {
    id: "personal-068",
    query: "كيف يتصرف القاضي إذا كان الزوج غائباً وله مال ظاهر؟",
    relevantArticleNumbers: ["5"],
  },
  {
    id: "personal-069",
    query: "متى يجوز للقاضي تطليق الزوج الغائب الذي لا يُسهل الوصول إليه؟",
    relevantArticleNumbers: ["5"],
  },
  {
    id: "personal-070",
    query: "هل يكون الطلاق لعدم الإنفاق طلاقاً رجعياً أم بائناً؟",
    relevantArticleNumbers: ["6"],
  },
];

export function buildPersonalAffairsLawGoldDataset(
  corpus: CanonicalCorpus,
): RetrievalGoldDataset {
  const articleMap = new Map<string, string[]>();

  for (const chunk of corpus.chunks) {
    const chunkIds = articleMap.get(chunk.article_number) ?? [];

    chunkIds.push(chunk.id);

    articleMap.set(chunk.article_number, chunkIds);
  }

  const items: RetrievalGoldItem[] = personalAffairsLawGoldDraft.map(
    (draft) => {
      const relevantChunkIds: string[] = [];

      for (const articleNumber of draft.relevantArticleNumbers) {
        const chunkIds = articleMap.get(articleNumber);

        if (!chunkIds || chunkIds.length === 0) {
          throw new Error(
            `Personal Affairs Law article ${articleNumber} was not found in the canonical corpus.`,
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
    name: "personal-affairs-law-retrieval-v1",
    description:
      "Initial manually curated retrieval benchmark for Egyptian Personal Affairs Law No. 25 of 1929.",
    language: "ar",
    jurisdiction: "EG",
    items,
  };
}
