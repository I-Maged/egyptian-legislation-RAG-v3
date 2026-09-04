import { NextResponse } from "next/server";

import { listConversations } from "@egyptian-law/db";

import { getCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "يجب تسجيل الدخول." },
      { status: 401 },
    );
  }

  const conversations = await listConversations(user.id);

  return NextResponse.json({
    conversations: conversations.map((conversation) => ({
      id: conversation.id,
      title: conversation.title,
      messageCount: conversation._count.messages,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    })),
  });
}
