import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../client";

export type ArticleChange = {
  mode: "create" | "update";
  documentId: string;
  chunkId?: string;
  articleNumber: string;
  articleTitle: string | null;
  text: string;
  embedding: number[];
  embeddingModel: string;
  embeddingDimensions: number;
  actorUserId: string;
  suggestionId?: string;
};

function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function assertEmbedding(input: ArticleChange) {
  if (input.embedding.length !== input.embeddingDimensions) {
    throw new Error(
      `Embedding dimension mismatch: expected ${input.embeddingDimensions}, got ${input.embedding.length}.`,
    );
  }
}

export async function createLawSuggestion(input: {
  userId: string;
  type: "EDIT_ARTICLE" | "ADD_ARTICLE";
  lawDocumentId: string;
  lawChunkId?: string;
  title: string;
  reason: string;
  proposedText: string;
  proposedArticleNumber: string;
  proposedArticleTitle?: string;
}) {
  return prisma.lawSuggestion.create({
    data: {
      userId: input.userId,
      type: input.type,
      status: "PENDING",
      lawDocumentId: input.lawDocumentId,
      ...(input.lawChunkId ? { lawChunkId: input.lawChunkId } : {}),
      title: input.title,
      reason: input.reason,
      proposedText: input.proposedText,
      proposedArticleNumber: input.proposedArticleNumber,
      ...(input.proposedArticleTitle
        ? { proposedArticleTitle: input.proposedArticleTitle }
        : {}),
    },
  });
}

export async function listLawSuggestions(
  status?:
    | "PENDING"
    | "UNDER_REVIEW"
    | "APPROVED"
    | "REJECTED"
    | "APPLIED"
    | "FAILED",
) {
  const where = status ? { status } : {};
  return prisma.lawSuggestion.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function listUserLawSuggestions(userId: string) {
  return prisma.lawSuggestion.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getLawSuggestion(id: string) {
  return prisma.lawSuggestion.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}

export async function rejectLawSuggestion(input: {
  suggestionId: string;
  adminUserId: string;
  adminNote: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const suggestion = await tx.lawSuggestion.findUnique({
      where: { id: input.suggestionId },
    });

    if (!suggestion) throw new Error("Suggestion not found.");
    if (
      suggestion.status !== "PENDING" &&
      suggestion.status !== "UNDER_REVIEW"
    ) {
      throw new Error("Only pending suggestions can be rejected.");
    }

    const updated = await tx.lawSuggestion.update({
      where: { id: suggestion.id },
      data: {
        status: "REJECTED",
        adminNote: input.adminNote,
        reviewedBy: input.adminUserId,
        reviewedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        userId: input.adminUserId,
        action: "REJECT_SUGGESTION",
        entityType: "LawSuggestion",
        entityId: suggestion.id,
        before: json({ status: suggestion.status }),
        after: json({ status: updated.status, adminNote: updated.adminNote }),
      },
    });

    return updated;
  });
}

export async function applyArticleChange(input: ArticleChange) {
  assertEmbedding(input);

  return prisma.$transaction(async (tx) => {
    let appliedChunkId = input.chunkId;
    let before: Record<string, unknown> | null = null;

    if (input.mode === "update") {
      if (!appliedChunkId)
        throw new Error("chunkId is required for article updates.");

      const current = await tx.lawChunk.findUnique({
        where: { id: appliedChunkId },
      });
      if (!current || current.documentId !== input.documentId) {
        throw new Error("Target article was not found in the selected law.");
      }

      before = {
        id: current.id,
        documentId: current.documentId,
        articleNumber: current.articleNumber,
        articleTitle: current.articleTitle,
        text: current.text,
      };

      await tx.lawChunk.update({
        where: { id: appliedChunkId },
        data: {
          articleNumber: input.articleNumber,
          articleTitle: input.articleTitle,
          text: input.text,
          textForEmbedding: input.text,
          parserVersion: "hitl-v1",
          normalizationVersion: "hitl-v1",
        },
      });
    } else {
      const aggregate = await tx.lawChunk.aggregate({
        where: { documentId: input.documentId },
        _max: { sourceOrder: true },
      });
      appliedChunkId = crypto.randomUUID();

      await tx.lawChunk.create({
        data: {
          id: appliedChunkId,
          documentId: input.documentId,
          articleNumber: input.articleNumber,
          articleTitle: input.articleTitle,
          text: input.text,
          textForEmbedding: input.text,
          sourceOrder: (aggregate._max.sourceOrder ?? -1) + 1,
          parserVersion: "hitl-v1",
          normalizationVersion: "hitl-v1",
        },
      });
    }

    const vector = `[${input.embedding.join(",")}]`;
    await tx.$executeRaw(
      Prisma.sql`
        INSERT INTO "law_chunk_embeddings"
          ("chunk_id", "model", "dimensions", "embedding")
        VALUES
          (${appliedChunkId}, ${input.embeddingModel}, ${input.embeddingDimensions}, ${vector}::vector)
        ON CONFLICT ("chunk_id")
        DO UPDATE SET
          "model" = EXCLUDED."model",
          "dimensions" = EXCLUDED."dimensions",
          "embedding" = EXCLUDED."embedding"
      `,
    );

    const after = {
      id: appliedChunkId,
      documentId: input.documentId,
      articleNumber: input.articleNumber,
      articleTitle: input.articleTitle,
      text: input.text,
      embeddingModel: input.embeddingModel,
      embeddingDimensions: input.embeddingDimensions,
    };

    await tx.auditLog.create({
      data: {
        userId: input.actorUserId,
        action: input.mode === "create" ? "CREATE_ARTICLE" : "UPDATE_ARTICLE",
        entityType: "LawChunk",
        entityId: appliedChunkId,
        after: json(after),
        ...(before ? { before: json(before) } : {}),
      },
    });

    if (input.suggestionId) {
      const updated = await tx.lawSuggestion.updateMany({
        where: {
          id: input.suggestionId,
          status: { in: ["PENDING", "UNDER_REVIEW"] },
        },
        data: {
          status: "APPLIED",
          reviewedBy: input.actorUserId,
          reviewedAt: new Date(),
          adminNote:
            "تم اعتماد الاقتراح وتطبيقه على قاعدة البيانات وفهرس المتجهات.",
        },
      });

      if (updated.count !== 1) {
        throw new Error(
          "Suggestion was already reviewed or no longer pending.",
        );
      }

      await tx.auditLog.create({
        data: {
          userId: input.actorUserId,
          action: "APPROVE_SUGGESTION",
          entityType: "LawSuggestion",
          entityId: input.suggestionId,
          after: json({ status: "APPLIED", chunkId: appliedChunkId }),
        },
      });
    }

    return { chunkId: appliedChunkId };
  });
}

export async function markLawSuggestionFailed(input: {
  suggestionId: string;
  adminUserId: string;
  adminNote: string;
}) {
  return prisma.lawSuggestion.updateMany({
    where: {
      id: input.suggestionId,
      status: { in: ["PENDING", "UNDER_REVIEW"] },
    },
    data: {
      status: "FAILED",
      reviewedBy: input.adminUserId,
      reviewedAt: new Date(),
      adminNote: input.adminNote,
    },
  });
}
