import type { MessageRole } from "../../generated/prisma/client";
import { prisma } from "../client";

export interface CreateConversationInput {
  userId: string;
  title?: string | null;
}

export interface CreateRagRunInput {
  model: string;
  retrievalTimeMs?: number | null;
  generationTimeMs?: number | null;
  totalTimeMs?: number | null;
}

export interface AppendMessageInput {
  conversationId: string;
  role: MessageRole;
  content: string;

  ragRun?: CreateRagRunInput;
}

export async function createConversation(input: CreateConversationInput) {
  return prisma.conversation.create({
    data: {
      userId: input.userId,
      title: input.title ?? null,
    },
  });
}

export async function getConversation(id: string) {
  return prisma.conversation.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function getConversationForUser(id: string, userId: string) {
  return prisma.conversation.findFirst({
    where: { id, userId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function listConversations(userId: string) {
  return prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { messages: true },
      },
    },
  });
}

export async function updateConversationTitle(id: string, title: string) {
  return prisma.conversation.update({
    where: { id },
    data: { title },
  });
}

export async function deleteConversation(id: string) {
  return prisma.conversation.delete({
    where: { id },
  });
}

export async function appendMessage(input: AppendMessageInput) {
  const [, message] = await prisma.$transaction([
    prisma.conversation.update({
      where: { id: input.conversationId },
      data: { updatedAt: new Date() },
    }),

    prisma.message.create({
      data: {
        conversationId: input.conversationId,
        role: input.role,
        content: input.content,

        ...(input.ragRun
          ? {
              ragRun: {
                create: {
                  model: input.ragRun.model,
                  retrievalTimeMs: input.ragRun.retrievalTimeMs ?? null,
                  generationTimeMs: input.ragRun.generationTimeMs ?? null,
                  totalTimeMs: input.ragRun.totalTimeMs ?? null,
                },
              },
            }
          : {}),
      },
      include: { ragRun: true },
    }),
  ]);

  return message;
}
