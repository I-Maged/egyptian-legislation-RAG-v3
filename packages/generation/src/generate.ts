import { buildCitations } from "./citations";
import type { GenerationProvider } from "./provider";
import { LEGAL_SYSTEM_PROMPT, buildGenerationPrompt } from "./prompt";
import type { GenerationRequest, GenerationResponse } from "./types";

export function sanitizeGeneratedAnswer(answer: string): string {
  const lines = answer.trim().split(/\r?\n/);
  const cleaned = lines.filter((line) => {
    const normalized = line.replace(/[*_`]/g, "").replace(/\s+/g, " ").trim();

    if (!normalized) return true;

    if (
      /لا تمثل\s+استشارة قانونية\s+ملزمة|ليست\s+استشارة قانونية\s+ملزمة/u.test(
        normalized,
      )
    ) {
      return false;
    }

    return (
      !/(?:هذه|هذا)\s+الإجابة.*(?:مستمدة|تستند|مبنية|مستخلصة|تم استخلاصها).*النصوص/u.test(
        normalized,
      ) &&
      !/^(?:يرجى العلم|يرجى ملاحظة)\s+أن\s+(?:هذه|هذا)\s+الإجابة/u.test(
        normalized,
      )
    );
  });

  return cleaned
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function generateAnswer(
  provider: GenerationProvider,
  request: GenerationRequest,
): Promise<GenerationResponse> {
  const query = request.query.trim();

  if (!query) {
    throw new Error("Generation query cannot be empty.");
  }

  if (request.chunks.length === 0) {
    throw new Error("Generation requires at least one retrieved chunk.");
  }

  const prompt = buildGenerationPrompt(query, request.chunks);

  const startedAt = performance.now();

  const providerResponse = await provider.generate({
    system: LEGAL_SYSTEM_PROMPT,
    prompt,

    ...(request.temperature !== undefined
      ? { temperature: request.temperature }
      : {}),

    ...(request.maxTokens !== undefined
      ? { maxTokens: request.maxTokens }
      : {}),
  });

  if (!providerResponse || typeof providerResponse.answer !== "string") {
    throw new Error("Generation provider returned an invalid response.");
  }

  const answer = sanitizeGeneratedAnswer(providerResponse.answer);

  if (!answer) {
    throw new Error("Generation provider returned an empty answer.");
  }

  const citations = buildCitations(answer, request.chunks);

  return {
    answer,
    citations,
    metadata: {
      model: providerResponse.metadata.model,
      contextChunkCount: request.chunks.length,
      citationCount: citations.length,
      latencyMs: performance.now() - startedAt,
    },
  };
}

export async function generateFromChunks(
  provider: GenerationProvider,
  query: string,
  chunks: import("@egyptian-law/core").LawChunk[],
  options?: {
    temperature?: number;
    maxTokens?: number;
  },
): Promise<GenerationResponse> {
  return generateAnswer(provider, {
    query,
    chunks,

    ...(options?.temperature !== undefined
      ? { temperature: options.temperature }
      : {}),

    ...(options?.maxTokens !== undefined
      ? { maxTokens: options.maxTokens }
      : {}),
  });
}
