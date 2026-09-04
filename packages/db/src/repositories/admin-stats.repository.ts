import { prisma } from "../client";

export interface RagPerformanceStats {
  totalRuns: number;
  avgRetrievalTimeMs: number | null;
  avgGenerationTimeMs: number | null;
  avgTotalTimeMs: number | null;
  models: {
    model: string;
    runs: number;
    avgTotalTimeMs: number | null;
  }[];
}

export interface RetrievalQualityStats {
  totalCitations: number;
  avgCitationsPerAnswer: number | null;
  avgRank: number | null;
  avgScore: number | null;
  neverCitedChunks: number;
  topLaws: {
    lawName: string;
    lawNumber: string | null;
    year: string | null;
    citations: number;
  }[];
}

export interface UsageStats {
  userCount: number;
  conversationCount: number;
  messageCount: number;
  assistantMessageCount: number;
  userMessageCount: number;
  avgMessagesPerConversation: number | null;
}

export interface NegativeFeedbackItem {
  id: string;
  comment: string;
  createdAt: Date;

  userName: string | null;
  userEmail: string;

  messageExcerpt: string;
}

export interface FeedbackEngagementStats {
  coverageRatePercent: number | null;
  positiveRatePercent: number | null;
  negativeWithComments: number;
  recentNegativeComments: NegativeFeedbackItem[];
}

export interface SuggestionsStats {
  pendingCount: number;
}

export interface AdminDashboardStats {
  ragPerformance: RagPerformanceStats;
  retrievalQuality: RetrievalQualityStats;
  usage: UsageStats;
  feedback: FeedbackEngagementStats;
  suggestions: SuggestionsStats;
}

const TOP_LAWS_LIMIT = 10;
const RECENT_COMMENTS_LIMIT = 10;
const MESSAGE_EXCERPT_LENGTH = 80;

export function percent(part: number, whole: number): number | null {
  if (whole <= 0) return null;

  return Math.round((part / whole) * 1000) / 10;
}

export function buildTopLaws(
  citationsByChunkId: Map<string, number>,
  chunksById: Map<
    string,
    {
      lawName: string;
      lawNumber: string | null;
      year: string | null;
    }
  >,
): RetrievalQualityStats["topLaws"] {
  const citationsByLaw = new Map<
    string,
    RetrievalQualityStats["topLaws"][number]
  >();

  for (const [chunkId, count] of citationsByChunkId) {
    const chunk = chunksById.get(chunkId);

    if (!chunk) continue;

    const key = `${chunk.lawName}#${chunk.lawNumber ?? ""}#${chunk.year ?? ""}`;
    const existing = citationsByLaw.get(key);

    if (existing) {
      existing.citations += count;
    } else {
      citationsByLaw.set(key, {
        lawName: chunk.lawName,
        lawNumber: chunk.lawNumber,
        year: chunk.year,
        citations: count,
      });
    }
  }

  return [...citationsByLaw.values()]
    .sort((a, b) => b.citations - a.citations)
    .slice(0, TOP_LAWS_LIMIT);
}

export async function getRagPerformance(): Promise<RagPerformanceStats> {
  const [aggregate, models] = await Promise.all([
    prisma.ragRun.aggregate({
      _count: { _all: true },
      _avg: {
        retrievalTimeMs: true,
        generationTimeMs: true,
        totalTimeMs: true,
      },
    }),

    prisma.ragRun.groupBy({
      by: ["model"],
      _count: { _all: true },
      _avg: { totalTimeMs: true },
      orderBy: { _count: { model: "desc" } },
    }),
  ]);

  return {
    totalRuns: aggregate._count._all,
    avgRetrievalTimeMs: aggregate._avg.retrievalTimeMs,
    avgGenerationTimeMs: aggregate._avg.generationTimeMs,
    avgTotalTimeMs: aggregate._avg.totalTimeMs,
    models: models.map((entry) => ({
      model: entry.model,
      runs: entry._count._all,
      avgTotalTimeMs: entry._avg.totalTimeMs,
    })),
  };
}

export async function getRetrievalQuality(): Promise<RetrievalQualityStats> {
  const [citationsAggregate, runCount, citedChunkGroups, chunkCount] =
    await Promise.all([
      prisma.ragCitation.aggregate({
        _count: { _all: true },
        _avg: { rank: true, score: true },
      }),

      prisma.ragRun.count(),

      prisma.ragCitation.groupBy({
        by: ["chunkId"],
        _count: { _all: true },
      }),

      prisma.lawChunk.count(),
    ]);

    const citationsByChunkId = new Map(
      citedChunkGroups.map((group) => [group.chunkId, group._count._all]),
    );

    const citedChunks = await prisma.lawChunk.findMany({
      where: { id: { in: [...citationsByChunkId.keys()] } },
      select: {
        id: true,
        document: {
          select: {
            lawName: true,
            lawNumber: true,
            year: true,
          },
        },
      },
    });

    const chunksById = new Map(
      citedChunks.map((chunk) => [
        chunk.id,
        {
          lawName: chunk.document.lawName,
          lawNumber: chunk.document.lawNumber,
          year: chunk.document.year,
        },
      ]),
    );

    return {
      totalCitations: citationsAggregate._count._all,
      avgCitationsPerAnswer:
        runCount > 0
          ? Math.round((citationsAggregate._count._all / runCount) * 100) / 100
          : null,
      avgRank: citationsAggregate._avg.rank,
      avgScore: citationsAggregate._avg.score,
      neverCitedChunks: chunkCount - citationsByChunkId.size,
      topLaws: buildTopLaws(citationsByChunkId, chunksById),
    };
}

export async function getUsageStats(): Promise<UsageStats> {
  const [userCount, conversationCount, roleGroups] = await Promise.all([
    prisma.user.count(),

    prisma.conversation.count(),

    prisma.message.groupBy({
      by: ["role"],
      _count: { _all: true },
    }),
  ]);

  const userMessageCount =
    roleGroups.find((group) => group.role === "USER")?._count._all ?? 0;
  const assistantMessageCount =
    roleGroups.find((group) => group.role === "ASSISTANT")?._count._all ?? 0;
  const messageCount = userMessageCount + assistantMessageCount;

  return {
    userCount,
    conversationCount,
    messageCount,
    assistantMessageCount,
    userMessageCount,
    avgMessagesPerConversation:
      conversationCount > 0
        ? Math.round((messageCount / conversationCount) * 100) / 100
        : null,
  };
}

export function computeFeedbackEngagement(
  feedbackTotal: number,
  positiveCount: number,
  negativeWithComments: number,
  assistantMessageCount: number,
  recentNegativeComments: NegativeFeedbackItem[],
): FeedbackEngagementStats {
  return {
    coverageRatePercent: percent(feedbackTotal, assistantMessageCount),
    positiveRatePercent:
      feedbackTotal > 0
        ? percent(positiveCount, feedbackTotal)
        : null,
    negativeWithComments,
    recentNegativeComments,
  };
}

export async function getSuggestionsStats(): Promise<SuggestionsStats> {
  const pendingCount = await prisma.lawSuggestion.count({
    where: { status: "PENDING" },
  });

  return { pendingCount };
}

export async function getFeedbackEngagement(): Promise<FeedbackEngagementStats> {
  const [typeGroups, negativeWithComments, assistantMessageCount, comments] =
    await Promise.all([
      prisma.feedback.groupBy({
        by: ["type"],
        _count: { _all: true },
      }),

      prisma.feedback.count({
        where: { type: "NEGATIVE", comment: { not: null } },
      }),

      prisma.message.count({ where: { role: "ASSISTANT" } }),

      prisma.feedback.findMany({
        where: { type: "NEGATIVE", comment: { not: null } },
        orderBy: { createdAt: "desc" },
        take: RECENT_COMMENTS_LIMIT,
        select: {
          id: true,
          comment: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
          message: { select: { content: true } },
        },
      }),
    ]);

  const positive =
    typeGroups.find((group) => group.type === "POSITIVE")?._count._all ?? 0;
  const negative =
    typeGroups.find((group) => group.type === "NEGATIVE")?._count._all ?? 0;

  const recentNegativeComments = comments.map((comment) => ({
    id: comment.id,
    comment: comment.comment as string,
    createdAt: comment.createdAt,
    userName: comment.user.name,
    userEmail: comment.user.email,
    messageExcerpt:
      comment.message.content.length > MESSAGE_EXCERPT_LENGTH
        ? `${comment.message.content.slice(0, MESSAGE_EXCERPT_LENGTH)}…`
        : comment.message.content,
  }));

  return computeFeedbackEngagement(
    positive + negative,
    positive,
    negativeWithComments,
    assistantMessageCount,
    recentNegativeComments,
  );
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const [ragPerformance, retrievalQuality, usage, feedback, suggestions] =
    await Promise.all([
      getRagPerformance(),
      getRetrievalQuality(),
      getUsageStats(),
      getFeedbackEngagement(),
      getSuggestionsStats(),
    ]);

  return { ragPerformance, retrievalQuality, usage, feedback, suggestions };
}
