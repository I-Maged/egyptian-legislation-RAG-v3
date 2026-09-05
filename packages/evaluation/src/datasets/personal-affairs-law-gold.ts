import type { CanonicalCorpus } from "@egyptian-law/core";

import type {
  RetrievalGoldDataset,
  RetrievalGoldItem,
} from "./retrieval-dataset";

export interface PersonalAffairsLawGoldSource {
  documentId: string;
  articleNumber: string;
  sourceOrder?: number;
}

export interface PersonalAffairsLawGoldDraft {
  id: string;
  query: string;
  relevantSources: PersonalAffairsLawGoldSource[];
  relevance?: Record<string, number>;
}

export const personalAffairsLawGoldDraft: PersonalAffairsLawGoldDraft[] = [
  {
    id: "personal-001",
    query: "متى تعتبر نفقة المطلقة دينًا؟",
    relevantSources: [{ documentId: "lawdoc_9a396852aeb82aea", articleNumber: "2", sourceOrder: 2 }],
  },
  {
    id: "personal-002",
    query: "كم مرة يقع الطلاق المقترن بعدد لفظ أو إشارة؟",
    relevantSources: [{ documentId: "lawdoc_ecde51a89e480e6f", articleNumber: "2", sourceOrder: 15 }],
  },
  {
    id: "personal-003",
    query: "متى يستحق الإرث؟",
    relevantSources: [{ documentId: "lawdoc_b30e2a4693393c34", articleNumber: "1", sourceOrder: 48 }],
  },
  {
    id: "personal-004",
    query: "ما هي طرق انعقاد الوصية؟",
    relevantSources: [{ documentId: "lawdoc_f414b4b1f3edf2af", articleNumber: "2", sourceOrder: 101 }],
  },
  {
    id: "personal-005",
    query: "ماذا يلغي نص المادة 2 بشأن الكتاب الأول من قانون المحاكم الحسبية؟",
    relevantSources: [{ documentId: "lawdoc_0c22cb5e7a14459a", articleNumber: "2", sourceOrder: 198 }],
  },
  {
    id: "personal-006",
    query: "متى يجوز للولي مباشرة حق من حقوق الولاية؟",
    relevantSources: [{ documentId: "lawdoc_0c22cb5e7a14459a", articleNumber: "2", sourceOrder: 201 }],
  },
  {
    id: "personal-007",
    query:
      "ما الإجراءات التي يتخذها القاضي إذا امتنع الزوج عن الإنفاق وكان له مال ظاهر؟",
    relevantSources: [{ documentId: "lawdoc_9a396852aeb82aea", articleNumber: "4", sourceOrder: 4 }],
  },
  {
    id: "personal-008",
    query:
      "أي قانون تطبق قواعده وإجراءاته على الإعلان بوقوع الطلاق فيما عدا ما تقدم؟",
    relevantSources: [{ documentId: "lawdoc_6500117cae50e72a", articleNumber: "4", sourceOrder: 376 }],
  },
  {
    id: "personal-009",
    query: "من الذي يتولى إجراءات الجرد؟",
    relevantSources: [{ documentId: "lawdoc_b3ca42fe1dd1894f", articleNumber: "4", sourceOrder: 400 }],
  },
  {
    id: "personal-010",
    query:
      "في حالة غياب الزوج هل يختلف تطبيق أحكام التنفيذ إذا كان له مال ظاهر؟",
    relevantSources: [{ documentId: "lawdoc_9a396852aeb82aea", articleNumber: "5", sourceOrder: 5 }],
  },
  {
    id: "personal-011",
    query: "خلال كم يوم يجب على الموثق إعلان المطلقة بوقوع الطلاق إذا لم تحضر لتوثيق إشهاد الطلاق؟",
    relevantSources: [{ documentId: "lawdoc_6500117cae50e72a", articleNumber: "2", sourceOrder: 374 }],
  },
  {
    id: "personal-012",
    query:
      "متى تترتب آثار الطلاق من حيث الميراث والحقوق المالية إذا أخفى الزوج وقوع الطلاق عن زوجته؟",
    relevantSources: [{ documentId: "lawdoc_9a396852aeb82aea", articleNumber: "5", sourceOrder: 5 }],
  },
  {
    id: "personal-013",
    query: "هل يمنع قتل المورث عمدًا استحقاق الإرث عن القاتل؟",
    relevantSources: [{ documentId: "lawdoc_b30e2a4693393c34", articleNumber: "5", sourceOrder: 52 }],
  },
  {
    id: "personal-014",
    query: "متى يجوز وصية المحجور عليه للسفه أو الغفلة بإذن المجلس الحسبي؟",
    relevantSources: [{ documentId: "lawdoc_f414b4b1f3edf2af", articleNumber: "5", sourceOrder: 104 }],
  },
  {
    id: "personal-015",
    query: "متى يجوز للولي التبرع بمال القاصر؟",
    relevantSources: [{ documentId: "lawdoc_0c22cb5e7a14459a", articleNumber: "5", sourceOrder: 204 }],
  },
  {
    id: "personal-016",
    query:
      "ما المدة اللازمة للحكم بموت المفقود إذا كان على ظهر سفينة غرقت أو في طائرة سقطت؟",
    relevantSources: [{ documentId: "lawdoc_ecde51a89e480e6f", articleNumber: "21", sourceOrder: 40 }],
  },
  {
    id: "personal-017",
    query:
      "ماذا يفعل الموثق إذا لم تحضر المطلقة لاستلام نسخة إشهاد الطلاق خلال المدة المقررة؟",
    relevantSources: [{ documentId: "lawdoc_6500117cae50e72a", articleNumber: "5", sourceOrder: 377 }],
  },
  {
    id: "personal-018",
    query: "ما أثر غياب الزوج على سماع دعوى نسب الولد؟",
    relevantSources: [{ documentId: "lawdoc_ecde51a89e480e6f", articleNumber: "15", sourceOrder: 31 }],
  },
  {
    id: "personal-019",
    query: "كم نسخة يحرر بها محضر جرد الأموال؟",
    relevantSources: [{ documentId: "lawdoc_b3ca42fe1dd1894f", articleNumber: "5", sourceOrder: 401 }],
  },
  {
    id: "personal-020",
    query: "تحت أي شرط يمكن للزوج أن يرجع زوجته بعد تطليقها لعدم الإنفاق؟",
    relevantSources: [{ documentId: "lawdoc_9a396852aeb82aea", articleNumber: "6", sourceOrder: 6 }],
  },
  {
    id: "personal-021",
    query:
      "ما نوع الطلاق الذي يوقعه القاضي إذا ثبت الضرر الذي ألحقه الزوج بزوجته؟",
    relevantSources: [{ documentId: "lawdoc_ecde51a89e480e6f", articleNumber: "6", sourceOrder: 20 }],
  },
  {
    id: "personal-022",
    query: "هل يورث المسلم وغير المسلم بعضهما بعضًا؟",
    relevantSources: [{ documentId: "lawdoc_b30e2a4693393c34", articleNumber: "6", sourceOrder: 53 }],
  },
  {
    id: "personal-023",
    query:
      "ما الواجبات الإدارية التي تترتب على النائب أو الوصي عند انتهاء الوصاية؟",
    relevantSources: [{ documentId: "lawdoc_0c22cb5e7a14459a", articleNumber: "50", sourceOrder: 250 }],
  },
  {
    id: "personal-024",
    query:
      "ما الحد الأقصى للمدة التي يُحكم بعدها بموت المفقود في الحالات العامة؟",
    relevantSources: [{ documentId: "lawdoc_ecde51a89e480e6f", articleNumber: "21", sourceOrder: 40 }],
  },
  {
    id: "personal-025",
    query:
      "ماذا يحدث إذا صدر حكم بموت المفقود أو نشر قرار رئاسي باعتباره ميتًا؟",
    relevantSources: [{ documentId: "lawdoc_ecde51a89e480e6f", articleNumber: "22", sourceOrder: 41 }],
  },
  {
    id: "personal-026",
    query:
      "ما المدة التي يبدأ منها سريان حكم القانون المشار إليه في حساب السنة المتعلقة ببعض دعاوى الأحوال الشخصية؟",
    relevantSources: [{ documentId: "lawdoc_ecde51a89e480e6f", articleNumber: "13", sourceOrder: 29 }],
  },
  {
    id: "personal-027",
    query: "متى يجوز لزوجة المحكوم عليه بعقوبة سالبة للحرية طلب التطليق عليه؟",
    relevantSources: [{ documentId: "lawdoc_ecde51a89e480e6f", articleNumber: "14", sourceOrder: 30 }],
  },
  {
    id: "personal-028",
    query:
      "ما مدة العقوبة التي يترتب عليها حق الزوجة في طلب التطليق وفقاً للنص؟",
    relevantSources: [{ documentId: "lawdoc_ecde51a89e480e6f", articleNumber: "14", sourceOrder: 30 }],
  },
  {
    id: "personal-029",
    query: "متى لا تُسمع دعوى النسب عند إنكار الزوج؟",
    relevantSources: [{ documentId: "lawdoc_ecde51a89e480e6f", articleNumber: "15", sourceOrder: 31 }],
  },
  {
    id: "personal-030",
    query: "ما أثر غياب الزوج على سماع دعوى نسب الولد؟",
    relevantSources: [{ documentId: "lawdoc_ecde51a89e480e6f", articleNumber: "15", sourceOrder: 31 }],
  },
  {
    id: "personal-031",
    query: "كيف تُقدر نفقة الزوجة بحسب حالة الزوج؟",
    relevantSources: [{ documentId: "lawdoc_ecde51a89e480e6f", articleNumber: "16", sourceOrder: 32 }],
  },
  {
    id: "personal-032",
    query: "ما الحد الأدنى لنفقة الزوجة في حالة عسر الزوج؟",
    relevantSources: [{ documentId: "lawdoc_ecde51a89e480e6f", articleNumber: "16", sourceOrder: 32 }],
  },
  {
    id: "personal-033",
    query:
      "خلال كم مدة يجب على القاضي عرض النفقة المؤقتة عند توافر سبب استحقاقها؟",
    relevantSources: [{ documentId: "lawdoc_ecde51a89e480e6f", articleNumber: "16", sourceOrder: 32 }],
  },
  {
    id: "personal-034",
    query: "ما المدة التي لا تُسمع بعدها دعوى النفقة من تاريخ الطلاق؟",
    relevantSources: [{ documentId: "lawdoc_ecde51a89e480e6f", articleNumber: "17", sourceOrder: 33 }],
  },
  {
    id: "personal-035",
    query: "متى تستحق المطلقة المدخول بها في زواج صحيح متعة الطلاق؟",
    relevantSources: [{ documentId: "lawdoc_ecde51a89e480e6f", articleNumber: "17", sourceOrder: 35 }],
  },
  {
    id: "personal-036",
    query: "ما الحد الأقصى لمدة المتعة التي تستحقها المطلقة وفقاً للنص؟",
    relevantSources: [{ documentId: "lawdoc_ecde51a89e480e6f", articleNumber: "17", sourceOrder: 35 }],
  },
  {
    id: "personal-037",
    query:
      "ما المدة التي لا يجوز تنفيذ حكم النفقة عن مدة تتجاوزها من تاريخ الطلاق؟",
    relevantSources: [{ documentId: "lawdoc_ecde51a89e480e6f", articleNumber: "18", sourceOrder: 34 }],
  },
  {
    id: "personal-038",
    query: "على من تستمر نفقة الأولاد حتى زواج البنت أو اكتساب الابن؟",
    relevantSources: [{ documentId: "lawdoc_ecde51a89e480e6f", articleNumber: "18", sourceOrder: 36 }],
  },
  {
    id: "personal-039",
    query: "كيف يُحسم الخلاف بين الزوجين في مقدار المهر؟",
    relevantSources: [{ documentId: "lawdoc_ecde51a89e480e6f", articleNumber: "19", sourceOrder: 38 }],
  },
  {
    id: "personal-040",
    query: "ما حكم اختلاف أحد الزوجين مع ورثة الزوج الآخر بشأن مقدار المهر؟",
    relevantSources: [{ documentId: "lawdoc_ecde51a89e480e6f", articleNumber: "19", sourceOrder: 38 }],
  },
  {
    id: "personal-041",
    query: "متى ينتهي حق حضانة النساء للصغير والصغيرة؟",
    relevantSources: [{ documentId: "lawdoc_ecde51a89e480e6f", articleNumber: "20", sourceOrder: 39 }],
  },
  {
    id: "personal-042",
    query:
      "إلى أي سن يجوز للقاضي إبقاء الصغيرة في يد الحاضنة إذا اقتضت مصلحتها ذلك؟",
    relevantSources: [{ documentId: "lawdoc_ecde51a89e480e6f", articleNumber: "20", sourceOrder: 39 }],
  },
  {
    id: "personal-043",
    query: "ما حق كل من الأبوين والأجداد في رؤية الصغير أو الصغيرة؟",
    relevantSources: [{ documentId: "lawdoc_ecde51a89e480e6f", articleNumber: "20", sourceOrder: 39 }],
  },
  {
    id: "personal-044",
    query: "متى يُحكم بموت المفقود إذا غلب عليه الهلاك؟",
    relevantSources: [{ documentId: "lawdoc_ecde51a89e480e6f", articleNumber: "21", sourceOrder: 40 }],
  },
  {
    id: "personal-045",
    query:
      "ما المدة اللازمة للحكم بموت المفقود إذا كان على ظهر سفينة غرقت أو في طائرة سقطت؟",
    relevantSources: [{ documentId: "lawdoc_ecde51a89e480e6f", articleNumber: "21", sourceOrder: 40 }],
  },
  {
    id: "personal-046",
    query:
      "ما الآثار المترتبة على الحكم بموت المفقود بالنسبة إلى زوجته وتركته؟",
    relevantSources: [{ documentId: "lawdoc_ecde51a89e480e6f", articleNumber: "22", sourceOrder: 41 }],
  },
  {
    id: "personal-047",
    query: "متى تُقسم تركة المفقود المحكوم بموته؟",
    relevantSources: [{ documentId: "lawdoc_ecde51a89e480e6f", articleNumber: "22", sourceOrder: 41 }],
  },
  {
    id: "personal-048",
    query: "متى يجوز للزوجة طلب التفريق بسبب عيب في الزوج؟",
    relevantSources: [{ documentId: "lawdoc_9a396852aeb82aea", articleNumber: "9", sourceOrder: 9 }],
  },
  {
    id: "personal-049",
    query: "من الذي يقيد نسخة إشهاد الطلاق في السجل ويعتمد القيد؟",
    relevantSources: [{ documentId: "lawdoc_6500117cae50e72a", articleNumber: "6", sourceOrder: 380 }],
  },
  {
    id: "personal-050",
    query: "متى يستعان بأهل الخبرة في دعاوى الفسخ المتعلقة بعيوب الزواج؟",
    relevantSources: [{ documentId: "lawdoc_9a396852aeb82aea", articleNumber: "11", sourceOrder: 11 }],
  },
  {
    id: "personal-051",
    query: "ماذا يترتب على عودة المفقود أو عدم تبين حياته بالنسبة لزواجه؟",
    relevantSources: [{ documentId: "lawdoc_9a396852aeb82aea", articleNumber: "8", sourceOrder: 8 }],
  },
  {
    id: "personal-052",
    query: "ما مدة مأمورية الحكمين وحدها وحد الإضافة التي يجوز للمحكمة منحها؟",
    relevantSources: [{ documentId: "lawdoc_ecde51a89e480e6f", articleNumber: "8", sourceOrder: 22 }],
  },
  {
    id: "personal-053",
    query: "في أي حالة يثبت للأب فرض السدس في الميراث؟",
    relevantSources: [
      { documentId: "lawdoc_b30e2a4693393c34", articleNumber: "9", sourceOrder: 56 },
      { documentId: "lawdoc_b30e2a4693393c34", articleNumber: "21", sourceOrder: 68 },
    ],
  },
  {
    id: "personal-054",
    query: "ما نوع الطلاق في الفرقة بالعيب؟",
    relevantSources: [{ documentId: "lawdoc_9a396852aeb82aea", articleNumber: "10", sourceOrder: 10 }],
  },
  {
    id: "personal-055",
    query: "ماذا يقترح الحكمان إذا كانت الإساءة كلها من جانب الزوج؟",
    relevantSources: [{ documentId: "lawdoc_ecde51a89e480e6f", articleNumber: "10", sourceOrder: 24 }],
  },
  {
    id: "personal-056",
    query:
      "ما البيان الذي يجب أن يثبته الموثق في وثيقة الزواج عن حالة الزوج الاجتماعية؟",
    relevantSources: [{ documentId: "lawdoc_6500117cae50e72a", articleNumber: "8", sourceOrder: 382 }],
  },
  {
    id: "personal-057",
    query:
      "ما الحكم الذي يُقضى به إذا طلبت الزوجة التفريق لعيب لا يُحتمل دوام العشرة؟",
    relevantSources: [{ documentId: "lawdoc_9a396852aeb82aea", articleNumber: "9", sourceOrder: 9 }],
  },
  {
    id: "personal-058",
    query:
      "هل يؤثر امتناع أحد الزوجين عن حضور مجلس التحكيم على سير عمل الحكمين إذا تم إخطارهما؟",
    relevantSources: [{ documentId: "lawdoc_ecde51a89e480e6f", articleNumber: "9", sourceOrder: 23 }],
  },

  {
    id: "personal--59",
    query:
      "هل يؤثر علم الزوجة بالعيب قبل الزواج أو رضاها به بعد العقد في حقها في طلب التفريق؟",
    relevantSources: [{ documentId: "lawdoc_9a396852aeb82aea", articleNumber: "9", sourceOrder: 9 }],
  },
  {
    id: "personal-060",
    query: "ما نوع الطلاق الناتج عن التفريق بسبب العيب؟",
    relevantSources: [{ documentId: "lawdoc_ecde51a89e480e6f", articleNumber: "10", sourceOrder: 24 }],
  },
  {
    id: "personal-061",
    query: "ماذا يقترح الحكمان إذا كانت الإساءة كلها من جانب الزوج؟",
    relevantSources: [{ documentId: "lawdoc_ecde51a89e480e6f", articleNumber: "10", sourceOrder: 24 }],
  },
  {
    id: "personal-062",
    query: "ماذا يقترح الحكمان إذا كانت الإساءة كلها من جانب الزوجة؟",
    relevantSources: [{ documentId: "lawdoc_ecde51a89e480e6f", articleNumber: "10", sourceOrder: 24 }],
  },
  {
    id: "personal-063",
    query: "بمن تستعين المحكمة للتحقق من العيوب التي يُطلب فسخ الزواج بسببها؟",
    relevantSources: [{ documentId: "lawdoc_9a396852aeb82aea", articleNumber: "11", sourceOrder: 11 }],
  },
  {
    id: "personal-064",
    query:
      "ما المدة التي يبدأ منها سريان حكم القانون المشار إليه في حساب السنة المتعلقة ببعض دعاوى الأحوال الشخصية؟",
    relevantSources: [{ documentId: "lawdoc_ecde51a89e480e6f", articleNumber: "13", sourceOrder: 29 }],
  },
  {
    id: "personal-065",
    query: "متى يجوز لزوجة المحكوم عليه بعقوبة سالبة للحرية طلب التطليق عليه؟",
    relevantSources: [{ documentId: "lawdoc_ecde51a89e480e6f", articleNumber: "14", sourceOrder: 30 }],
  },
  {
    id: "personal-066",
    query: "كيف تُقدر نفقة الزوجة بحسب حالة الزوج؟",
    relevantSources: [{ documentId: "lawdoc_ecde51a89e480e6f", articleNumber: "16", sourceOrder: 32 }],
  },
  {
    id: "personal-067",
    query:
      "ماذا يجوز للزوجة أن تطلب إذا امتنع زوجها عن الإنفاق ولم يكن له مال ظاهر؟",
    relevantSources: [{ documentId: "lawdoc_9a396852aeb82aea", articleNumber: "4", sourceOrder: 4 }],
  },
  {
    id: "personal-068",
    query: "كيف يتصرف القاضي إذا كان الزوج غائباً وله مال ظاهر؟",
    relevantSources: [{ documentId: "lawdoc_9a396852aeb82aea", articleNumber: "5", sourceOrder: 5 }],
  },
  {
    id: "personal-069",
    query: "متى يجوز للقاضي تطليق الزوج الغائب الذي لا يُسهل الوصول إليه؟",
    relevantSources: [{ documentId: "lawdoc_9a396852aeb82aea", articleNumber: "5", sourceOrder: 5 }],
  },
  {
    id: "personal-070",
    query: "هل يكون الطلاق لعدم الإنفاق طلاقاً رجعياً أم بائناً؟",
    relevantSources: [{ documentId: "lawdoc_9a396852aeb82aea", articleNumber: "6", sourceOrder: 6 }],
  },
];

export function buildPersonalAffairsLawGoldDataset(
  corpora: CanonicalCorpus[],
): RetrievalGoldDataset {
  const chunksByDocument = new Map<string, CanonicalCorpus["chunks"]>();

  for (const corpus of corpora) {
    chunksByDocument.set(corpus.document.id, corpus.chunks);
  }

  const items: RetrievalGoldItem[] = personalAffairsLawGoldDraft.map((draft) => {
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
    name: "personal-affairs-retrieval-v1",
    description:
      "Manually curated retrieval benchmark across the current Egyptian Personal Affairs corpus (14 legal instruments).",
    language: "ar",
    jurisdiction: "EG",
    items,
  };
}
