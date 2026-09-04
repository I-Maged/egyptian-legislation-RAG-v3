import type { GenerationProvider } from "@egyptian-law/generation";

import type { GenerationJudgeInput, GenerationJudgeOutput } from "./types";

export interface LlmGenerationJudgeOptions {
  provider: GenerationProvider;
  passThreshold?: number;
}

export interface GenerationJudgeResult {
  scores: GenerationJudgeOutput;
  overall: number;
  passed: boolean;
}

export class LlmGenerationJudge {
  private readonly provider: GenerationProvider;
  private readonly passThreshold: number;

  constructor(options: LlmGenerationJudgeOptions) {
    this.provider = options.provider;
    this.passThreshold = options.passThreshold ?? 0.7;
  }

  async judge(input: GenerationJudgeInput): Promise<GenerationJudgeResult> {
    const response = await this.provider.generate({
      system: JUDGE_SYSTEM_PROMPT,
      prompt: buildJudgePrompt(input),
      temperature: 0,
    });

    const scores = parseJudgeResponse(response.answer);

    const overall =
      (scores.correctness + scores.faithfulness + scores.citationCorrectness) /
      3;

    return {
      scores,
      overall,
      passed: overall >= this.passThreshold,
    };
  }
}

const JUDGE_SYSTEM_PROMPT = `
أنت مقيّم صارم لإجابات نظام RAG قانوني باللغة العربية.

قيّم الإجابة اعتمادًا على السؤال والنصوص القانونية المسترجعة فقط.

المعايير:

1. correctness:
هل الإجابة تجيب عن السؤال بشكل صحيح ومباشر؟
قارن أيضًا مع الإجابة المرجعية إذا كانت متاحة.

2. faithfulness:
هل الادعاءات الموجودة في الإجابة مدعومة بالنصوص القانونية المسترجعة؟
لا تمنح درجة مرتفعة إذا أضافت الإجابة معلومات غير مدعومة بالسياق.

3. citationCorrectness:
هل الإحالات أو المصادر المذكورة في الإجابة تتوافق مع النصوص القانونية المناسبة؟
إذا لم تستخدم الإجابة citations، قيّم هذا المعيار على أساس عدم وجود citations.

أعط درجة من 0 إلى 1 لكل معيار.

أعد JSON فقط بهذا الشكل:

{
  "correctness": 0.0,
  "faithfulness": 0.0,
  "citationCorrectness": 0.0
}

لا تضف Markdown.
لا تضف أي حقول أخرى.
`.trim();

function buildJudgePrompt(input: GenerationJudgeInput): string {
  const context = input.context
    .map((text, index) => `[${index + 1}] ${text}`)
    .join("\n\n");

  return `
السؤال:
${input.query}

الإجابة المولدة:
${input.answer}

النصوص القانونية المسترجعة:
${context}

معرّفات النصوص المسترجعة:
${input.contextChunkIds.join(", ")}

الإجابة المرجعية:
${input.referenceAnswer}

معرّفات النصوص القانونية المرجعية:
${input.referenceChunkIds.join(", ")}

قيّم الإجابة المولدة وفق المعايير المحددة.

مهم:
- لا تفترض صحة أي معلومة غير موجودة في السياق القانوني.
- correctness يقيس صحة الإجابة بالنسبة للسؤال والإجابة المرجعية.
- faithfulness يقيس مدى دعم السياق القانوني للإجابة.
- citationCorrectness يقيس صحة ربط الإجابة بالمصادر القانونية المناسبة.
`.trim();
}

function parseJudgeResponse(text: string): GenerationJudgeOutput {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: unknown;

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`LLM judge returned invalid JSON: ${text}`);
  }

  if (!isRecord(parsed)) {
    throw new Error("LLM judge returned an invalid object.");
  }

  return {
    correctness: getScore(parsed, "correctness"),
    faithfulness: getScore(parsed, "faithfulness"),
    citationCorrectness: getScore(parsed, "citationCorrectness"),
  };
}

function getScore(value: Record<string, unknown>, key: string): number {
  const score = value[key];

  if (
    typeof score !== "number" ||
    !Number.isFinite(score) ||
    score < 0 ||
    score > 1
  ) {
    throw new Error(
      `LLM judge returned invalid ${key} score: ${String(score)}`,
    );
  }

  return score;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
