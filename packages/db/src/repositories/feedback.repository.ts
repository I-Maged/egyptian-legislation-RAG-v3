import type { FeedbackType } from "../../generated/prisma/client";
import { prisma } from "../client";

export interface UpsertFeedbackInput {
  userId: string;
  messageId: string;
  type: FeedbackType;
  comment?: string | null;
}

export interface FeedbackStats {
  total: number;
  positive: number;
  negative: number;
}

export async function upsertFeedback(input: UpsertFeedbackInput) {
  return prisma.feedback.upsert({
    where: {
      userId_messageId: {
        userId: input.userId,
        messageId: input.messageId,
      },
    },
    create: {
      userId: input.userId,
      messageId: input.messageId,
      type: input.type,
      comment: input.comment ?? null,
    },
    update: {
      type: input.type,
      comment: input.comment ?? null,
    },
  });
}

export async function removeFeedback(userId: string, messageId: string) {
  return prisma.feedback.deleteMany({
    where: { userId, messageId },
  });
}

export async function getMessageFeedback(messageId: string, userId: string) {
  return prisma.feedback.findUnique({
    where: {
      userId_messageId: {
        userId,
        messageId,
      },
    },
  });
}

export async function getFeedbackForMessages(
  messageIds: string[],
  userId: string
) {
  if (messageIds.length === 0) return [];

  return prisma.feedback.findMany({
    where: { userId, messageId: { in: messageIds } },
    select: { messageId: true, type: true },
  });
}

export async function getFeedbackStats(): Promise<FeedbackStats> {
  const groups = await prisma.feedback.groupBy({
    by: ["type"],
    _count: { _all: true },
  });

  const positive =
    groups.find((group) => group.type === "POSITIVE")?._count._all ?? 0;
  const negative =
    groups.find((group) => group.type === "NEGATIVE")?._count._all ?? 0;

  return { total: positive + negative, positive, negative };
}
