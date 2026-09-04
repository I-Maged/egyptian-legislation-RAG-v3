import { NextResponse } from "next/server";

import type { RagResponse } from "@egyptian-law/rag";

import { getRagService } from "@egyptian-law/rag";

import {
  appendMessage,
  createConversation,
  getConversationForUser,
} from "@egyptian-law/db";

import { getCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";

const MAX_TITLE_LENGTH = 60;

function deriveTitle(query: string): string {
  return query.length > MAX_TITLE_LENGTH
    ? `${query.slice(0, MAX_TITLE_LENGTH)}…`
    : query;
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول للمحادثة." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as ChatBody;

    const query = typeof body.query === "string" ? body.query.trim() : "";

    if (!query) {
      return NextResponse.json(
        {
          error: "السؤال لا يمكن أن يكون فارغًا.",
        },
        { status: 400 },
      );
    }

    const requestedConversationId =
      typeof body.conversationId === "string"
        ? body.conversationId.trim()
        : "";

    let conversationId: string;

    if (requestedConversationId) {
      const existing = await getConversationForUser(
        requestedConversationId,
        user.id,
      );

      if (!existing) {
        return NextResponse.json(
          { error: "المحادثة غير موجودة." },
          { status: 404 },
        );
      }

      conversationId = existing.id;
    } else {
      const created = await createConversation({
        userId: user.id,
        title: deriveTitle(query),
      });

      conversationId = created.id;
    }

    await appendMessage({
      conversationId,
      role: "USER",
      content: query,
    });

    const service = getRagService();

    const lawDocumentId =
      typeof body.lawDocumentId === "string" ? body.lawDocumentId.trim() : "";

    const startedAt = performance.now();

    const response: RagResponse = await service.answer({
      query,

      ...(lawDocumentId
        ? {
            retrieval: {
              lawDocumentId,
            },
          }
        : {}),
    });

    const assistantMessage = await appendMessage({
      conversationId,
      role: "ASSISTANT",
      content: response.answer,
      ragRun: {
        model: response.generation.model,
        generationTimeMs: Math.round(response.generation.durationMs),
        totalTimeMs: Math.round(performance.now() - startedAt),
      },
    });

    return NextResponse.json({
      conversationId,
      answer: response.answer,
      citations: response.citations,
      generation: response.generation,
      messageId: assistantMessage.id,
    });
  } catch (error) {
    console.error("/api/chat failed", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء معالجة السؤال.",
      },
      { status: 500 },
    );
  }
}
