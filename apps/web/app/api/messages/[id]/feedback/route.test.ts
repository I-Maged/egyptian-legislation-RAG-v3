// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@egyptian-law/db", () => ({
  prisma: {
    message: {
      findFirst: vi.fn(),
    },
  },
  upsertFeedback: vi.fn(),
  removeFeedback: vi.fn(),
}));

import { getCurrentUser } from "@/lib/auth/session";
import { prisma, removeFeedback, upsertFeedback } from "@egyptian-law/db";

import { DELETE, POST } from "./route";

const mockedGetCurrentUser = vi.mocked(getCurrentUser);
const mockedFindMessage = vi.mocked(prisma.message.findFirst);
const mockedUpsertFeedback = vi.mocked(upsertFeedback);
const mockedRemoveFeedback = vi.mocked(removeFeedback);

const user = { id: "user-1", email: "u@example.com", name: null, role: "USER" as const };

const assistantMessage = {
  id: "msg-1",
  conversationId: "conv-1",
  role: "ASSISTANT" as const,
  content: "إجابة",
  createdAt: new Date(),
};

function context(id: string) {
  return { params: Promise.resolve({ id }) };
}

function jsonRequest(body: unknown) {
  return new Request("http://localhost/x", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedGetCurrentUser.mockResolvedValue(user);
});

describe("POST /api/messages/[id]/feedback", () => {
  it("returns 401 when unauthenticated", async () => {
    mockedGetCurrentUser.mockResolvedValue(null);

    const response = await POST(jsonRequest({ type: "POSITIVE" }), context("msg-1"));

    expect(response.status).toBe(401);
    expect(mockedUpsertFeedback).not.toHaveBeenCalled();
  });

  it("returns 404 when the message is missing or foreign", async () => {
    mockedFindMessage.mockResolvedValue(null);

    const response = await POST(jsonRequest({ type: "POSITIVE" }), context("nope"));

    expect(response.status).toBe(404);
  });

  it("rejects invalid feedback types", async () => {
    mockedFindMessage.mockResolvedValue(assistantMessage);

    const response = await POST(jsonRequest({ type: "NEUTRAL" }), context("msg-1"));

    expect(response.status).toBe(400);
    expect(mockedUpsertFeedback).not.toHaveBeenCalled();
  });

  it("stores positive feedback without a comment", async () => {
    mockedFindMessage.mockResolvedValue(assistantMessage);
    mockedUpsertFeedback.mockResolvedValue({
      id: "fb-1",
      userId: "user-1",
      messageId: "msg-1",
      type: "POSITIVE" as const,
      comment: null,
      createdAt: new Date(),
    });

    const response = await POST(jsonRequest({ type: "POSITIVE" }), context("msg-1"));

    expect(response.status).toBe(200);
    expect(mockedUpsertFeedback).toHaveBeenCalledWith({
      userId: "user-1",
      messageId: "msg-1",
      type: "POSITIVE",
      comment: null,
    });

    const data = (await response.json()) as { feedback: { type: string } };
    expect(data.feedback.type).toBe("POSITIVE");
  });

  it("trims and stores negative feedback with a comment", async () => {
    mockedFindMessage.mockResolvedValue(assistantMessage);
    mockedUpsertFeedback.mockResolvedValue({
      id: "fb-1",
      userId: "user-1",
      messageId: "msg-1",
      type: "NEGATIVE" as const,
      comment: "إجابة خاطئة",
      createdAt: new Date(),
    });

    await POST(
      jsonRequest({ type: "NEGATIVE", comment: "  إجابة خاطئة  " }),
      context("msg-1"),
    );

    expect(mockedUpsertFeedback).toHaveBeenCalledWith({
      userId: "user-1",
      messageId: "msg-1",
      type: "NEGATIVE",
      comment: "إجابة خاطئة",
    });
  });
});

describe("DELETE /api/messages/[id]/feedback", () => {
  it("returns 401 when unauthenticated", async () => {
    mockedGetCurrentUser.mockResolvedValue(null);

    const response = await DELETE(new Request("http://localhost/x", { method: "DELETE" }), context("msg-1"));

    expect(response.status).toBe(401);
    expect(mockedRemoveFeedback).not.toHaveBeenCalled();
  });

  it("returns 404 when no feedback exists", async () => {
    mockedRemoveFeedback.mockResolvedValue({ count: 0 });

    const response = await DELETE(new Request("http://localhost/x", { method: "DELETE" }), context("msg-1"));

    expect(response.status).toBe(404);
  });

  it("removes the feedback and returns 204", async () => {
    mockedRemoveFeedback.mockResolvedValue({ count: 1 });

    const response = await DELETE(new Request("http://localhost/x", { method: "DELETE" }), context("msg-1"));

    expect(response.status).toBe(204);
    expect(mockedRemoveFeedback).toHaveBeenCalledWith("user-1", "msg-1");
  });
});
