import { NextResponse } from "next/server";

import { prisma, removeFeedback, upsertFeedback } from "@egyptian-law/db";

import { getCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

const FEEDBACK_TYPES = ["POSITIVE", "NEGATIVE"] as const;

type FeedbackTypeValue = (typeof FEEDBACK_TYPES)[number];

function parseFeedbackType(value: unknown): FeedbackTypeValue | null {
  return typeof value === "string" &&
    (FEEDBACK_TYPES as readonly string[]).includes(value)
    ? (value as FeedbackTypeValue)
    : null;
}

async function getAssistantMessageForUser(id: string, userId: string) {
  return prisma.message.findFirst({
    where: {
      id,
      role: "ASSISTANT",
      conversation: { userId },
    },
    select: { id: true },
  });
}

export async function POST(request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "يجب تسجيل الدخول." },
      { status: 401 },
    );
  }

  const { id } = await context.params;

  const message = await getAssistantMessageForUser(id, user.id);

  if (!message) {
    return NextResponse.json(
      { error: "الرسالة غير موجودة." },
      { status: 404 },
    );
  }

  let body: {
    type?: unknown;
    comment?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "صيغة الطلب غير صحيحة." },
      { status: 400 },
    );
  }

  const type = parseFeedbackType(body.type);

  if (!type) {
    return NextResponse.json(
      { error: "نوع التقييم يجب أن يكون POSITIVE أو NEGATIVE." },
      { status: 400 },
    );
  }

  const comment =
    typeof body.comment === "string" && body.comment.trim().length > 0
      ? body.comment.trim()
      : null;

  const feedback = await upsertFeedback({
    userId: user.id,
    messageId: id,
    type,
    comment,
  });

  return NextResponse.json({
    feedback: {
      messageId: feedback.messageId,
      type: feedback.type,
      comment: feedback.comment,
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

  const removed = await removeFeedback(user.id, id);

  if (removed.count === 0) {
    return NextResponse.json(
      { error: "لا يوجد تقييم لهذه الرسالة." },
      { status: 404 },
    );
  }

  return new Response(null, { status: 204 });
}
