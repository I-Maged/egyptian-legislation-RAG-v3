import { NextResponse } from "next/server";

import {
  getConversationForUser,
  getFeedbackForMessages,
  deleteConversation,
} from "@egyptian-law/db";

import { getCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "يجب تسجيل الدخول." },
      { status: 401 },
    );
  }

  const { id } = await context.params;

  const conversation = await getConversationForUser(id, user.id);

  if (!conversation) {
    return NextResponse.json(
      { error: "المحادثة غير موجودة." },
      { status: 404 },
    );
  }

  const feedbacks = await getFeedbackForMessages(
    conversation.messages.map((message) => message.id),
    user.id,
  );

  const feedbackByMessageId = new Map(
    feedbacks.map((feedback) => [feedback.messageId, feedback.type]),
  );

  return NextResponse.json({
    conversation: {
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messages: conversation.messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        createdAt: message.createdAt,
        ...(message.role === "ASSISTANT"
          ? { myFeedback: feedbackByMessageId.get(message.id) ?? null }
          : {}),
      })),
    },
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "يجب تسجيل الدخول." },
      { status: 401 },
    );
  }

  const { id } = await context.params;

  const conversation = await getConversationForUser(id, user.id);

  if (!conversation) {
    return NextResponse.json(
      { error: "المحادثة غير موجودة." },
      { status: 404 },
    );
  }

  await deleteConversation(id);

  return new Response(null, { status: 204 });
}
