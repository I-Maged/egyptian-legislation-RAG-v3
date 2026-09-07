import type { GenerationProvider } from "@egyptian-law/generation";
import { extractCitationIds, sanitizeGeneratedAnswer } from "@egyptian-law/generation";

import type {
  RagCitation,
  RagRequest,
  RagResponse,
  RagRetrievalResult,
  RagRetriever,
} from "./types";

export interface RagServiceOptions {
  topK?: number;
  candidateTopK?: number;

  systemPrompt?: string;

  temperature?: number;

  maxTokens?: number;
}

const DEFAULT_SYSTEM_PROMPT = `
أنت مساعد قانوني متخصص في التشريعات المصرية.

أجب عن سؤال المستخدم اعتمادًا فقط على النصوص القانونية الموجودة في السياق المقدم لك.

القواعد:

1. لا تخترع أي نص قانوني أو معلومة غير موجودة في السياق.
2. إذا لم يكن السياق كافيًا للإجابة، صرّح بذلك بوضوح.
3. ميّز بين النص القانوني وبين تفسيرك له.
4. عند الاستناد إلى مادة قانونية، اذكر رقم المادة.
5. لا تستخدم معلومات من خارج السياق.
6. أجب باللغة العربية ما لم يطلب المستخدم لغة أخرى.
7. لا تضف أي تنويه أو إخلاء مسؤولية أو عبارة تفيد بأن الإجابة ليست استشارة قانونية.
8. لا تضف عبارات ميتا مثل "هذه الإجابة مستمدة من النصوص المقدمة" أو "بناءً على النصوص القانونية المقدمة".
9. عند الاستناد إلى مصدر، استخدم رقم المصدر كما هو ظاهر في السياق، مثل [1] أو [2].
10. لا تستخدم صيغة [C1] أو أي صيغة أخرى.
11. لا تغيّر نفي الحكم أو شروطه أو استثناءاته أو نطاق تطبيقه عند إعادة الصياغة. إذا ورد في النص "لا يجوز ... إلا ..."، فحافظ على المنع والاستثناء معًا.

السياق القانوني سيظهر على النحو التالي:

[1]
...

[2]
...

استخدم أرقام المصادر [1]، [2]، إلخ عند الاستناد إلى النصوص.
`.trim();

export function serializeRagContextDocument(
  document: RagResponse["context"]["documents"][number],
): string {
  const hierarchy =
    document.hierarchy.length > 0
      ? `التصنيف: ${document.hierarchy.join(" > ")}`
      : null;

  const articleTitle = document.articleTitle
    ? `عنوان المادة: ${document.articleTitle}`
    : null;

  return [
    document.citationId,
    `القانون: ${document.lawName}`,
    `رقم القانون: ${document.lawNumber ?? "غير محدد"}`,
    `السنة: ${document.year ?? "غير محددة"}`,
    `المادة: ${document.articleNumber}`,
    articleTitle,
    hierarchy,
    "النص:",
    document.text,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildContext(retrieved: RagRetrievalResult[]): {
  documents: RagResponse["context"]["documents"];
  text: string;
} {
  const documents = retrieved.map((result, index) => {
    const { chunk } = result;

    return {
      citationId: `[${index + 1}]`,

      chunkId: chunk.id,

      lawName: chunk.law_name,
      lawNumber: chunk.law_number,
      year: chunk.year,

      articleNumber: chunk.article_number,
      articleTitle: chunk.article_title,

      hierarchy: chunk.hierarchy.map((node) => node.title ?? node.label),

      text: chunk.text,

      sourceFile: chunk.provenance.source_file,

      pageStart: chunk.provenance.page_start,
      pageEnd: chunk.provenance.page_end,

      vectorScore: result.vectorScore,
      rerankScore: result.rerankScore,
    };
  });

  const text = documents
    .map(serializeRagContextDocument)
    .join("\n\n------------------------------\n\n");

  return {
    documents,
    text,
  };
}

function buildUserPrompt(query: string, context: string): string {
  return `
السؤال:

${query}

النصوص القانونية المسترجعة:

${context}

أجب عن السؤال اعتمادًا على النصوص أعلاه فقط.

إذا كانت النصوص غير كافية، وضّح أن المعلومات المتاحة لا تكفي للإجابة.

عند استخدام نص قانوني، ضع رقم المصدر بين أقواس مربعة مثل [1] أو [2].
لا تستخدم أي صيغة أخرى لأرقام المصادر.
لا تضف في نهاية الإجابة أي تنويه أو إخلاء مسؤولية أو عبارة عن كونها ليست استشارة قانونية.
لا تضف تعليقاً ميتا عن مصدر الإجابة؛ أخرج الإجابة القانونية نفسها فقط مع الإحالات المناسبة.
لا تغيّر نفي الحكم أو شروطه أو استثناءاته أثناء التلخيص أو إعادة الصياغة.
`.trim();
}

function buildCitations(
  answer: string,
  retrieved: RagRetrievalResult[],
): RagCitation[] {
  const citationIds = extractCitationIds(answer);

  return citationIds.flatMap((citationId) => {
    const match = /^\[(\d+)\]$/.exec(citationId);

    if (!match) {
      return [];
    }

    const index = Number(match[1]) - 1;
    const result = retrieved[index];

    if (!result) {
      return [];
    }

    const { chunk } = result;

    return [
      {
        id: citationId,

        chunkId: chunk.id,

        lawName: chunk.law_name,
        lawNumber: chunk.law_number,
        year: chunk.year,

        articleNumber: chunk.article_number,
        articleTitle: chunk.article_title,

        text: chunk.text,

        sourceFile: chunk.provenance.source_file,

        pageStart: chunk.provenance.page_start,
        pageEnd: chunk.provenance.page_end,
      },
    ];
  });
}

export class RagService {
  constructor(
    private readonly retriever: RagRetriever,
    private readonly generator: GenerationProvider,
    private readonly options: RagServiceOptions = {},
  ) {}

  async answer(request: RagRequest): Promise<RagResponse> {
    const query = request.query.trim();

    if (query.length === 0) {
      throw new Error("RAG query must not be empty.");
    }

    const topK = this.options.topK ?? 5;

    if (!Number.isInteger(topK) || topK <= 0) {
      throw new Error(`Invalid topK: ${topK}`);
    }

    const candidateTopK =
      this.options.candidateTopK ?? Math.max(topK * 4, topK);

    if (!Number.isInteger(candidateTopK) || candidateTopK <= 0) {
      throw new Error(`Invalid candidateTopK: ${candidateTopK}`);
    }

    const retrieved = await this.retriever.retrieve(query, {
      topK,
      candidateTopK,
      ...request.retrieval,
    });

    if (retrieved.length === 0) {
      return {
        answer: "المعلومات المتاحة لا تكفي للإجابة بشكل موثوق.",
        citations: [],
        retrieved: [],
        context: {
          documents: [],
          text: "",
        },
        generation: {
          model: this.generator.model,
          durationMs: 0,
        },
      };
    }

    const context = buildContext(retrieved);

    const systemPrompt = [
      this.options.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
      request.systemInstruction?.trim(),
    ]
      .filter(Boolean)
      .join("\n\n");

    const startedAt = performance.now();

    const generationResponse = await this.generator.generate({
      system: systemPrompt,

      prompt: buildUserPrompt(query, context.text),

      ...(this.options.temperature !== undefined
        ? {
            temperature: this.options.temperature,
          }
        : {}),

      ...(this.options.maxTokens !== undefined
        ? {
            maxTokens: this.options.maxTokens,
          }
        : {}),
    });

    const answer = sanitizeGeneratedAnswer(generationResponse.answer);

    if (answer.length === 0) {
      throw new Error("Generation provider returned an empty answer.");
    }

    return {
      answer,

      citations: buildCitations(answer, retrieved),

      retrieved,

      context,

      generation: {
        model: generationResponse.metadata.model,
        durationMs:
          generationResponse.metadata.durationMs ||
          performance.now() - startedAt,
      },
    };
  }
}

export function createRagService(
  retriever: RagRetriever,
  generator: GenerationProvider,
  options: RagServiceOptions = {},
): RagService {
  return new RagService(retriever, generator, options);
}
