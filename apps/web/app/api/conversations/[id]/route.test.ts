// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@egyptian-law/db", () => ({
  getConversationForUser: vi.fn(),
  getFeedbackForMessages: vi.fn(),
  deleteConversation: vi.fn(),
}));

import { getCurrentUser } from "@/lib/auth/session";
import {
  deleteConversation,
  getConversationForUser,
  getFeedbackForMessages,
} from "@egyptian-law/db";

import { DELETE, GET } from "./route";

const mockedGetCurrentUser = vi.mocked(getCurrentUser);
const mockedGetConversationForUser = vi.mocked(getConversationForUser);
const mockedGetFeedbackForMessages = vi.mocked(getFeedbackForMessages);
const mockedDeleteConversation = vi.mocked(deleteConversation);

const user = { id: "user-1", email: "u@example.com", name: null, role: "USER" as const };

const conversation = {
  id: "conv-1",
  userId: "user-1",
  title: "محادثة",
  createdAt: new Date(),
  updatedAt: new Date(),
  messages: [
    {
      id: "msg-1",
      conversationId: "conv-1",
      role: "USER" as const,
      content: "سؤال",
      createdAt: new Date(),
    },
  ],
};

function context(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedGetCurrentUser.mockResolvedValue(user);
  mockedGetFeedbackForMessages.mockResolvedValue([]);
});

describe("GET /api/conversations/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    mockedGetCurrentUser.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/x"), context("conv-1"));

    expect(response.status).toBe(401);
  });

  it("returns 404 when the conversation is missing or foreign", async () => {
    mockedGetConversationForUser.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/x"), context("nope"));

    expect(response.status).toBe(404);
    expect(mockedGetConversationForUser).toHaveBeenCalledWith("nope", "user-1");
  });

  it("returns the conversation with its ordered messages", async () => {
    mockedGetConversationForUser.mockResolvedValue(conversation);

    const response = await GET(
      new Request("http://localhost/x"),
      context("conv-1"),
    );

    expect(response.status).toBe(200);

    const data = (await response.json()) as {
      conversation: Record<string, unknown>;
    };

    expect(data.conversation.id).toBe("conv-1");
    expect((data.conversation.messages as unknown[]).length).toBe(1);
  });
});

describe("DELETE /api/conversations/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    mockedGetCurrentUser.mockResolvedValue(null);

    const response = await DELETE(
      new Request("http://localhost/x", { method: "DELETE" }),
      context("conv-1"),
    );

    expect(response.status).toBe(401);
    expect(mockedDeleteConversation).not.toHaveBeenCalled();
  });

  it("returns 404 when the conversation is missing or foreign", async () => {
    mockedGetConversationForUser.mockResolvedValue(null);

    const response = await DELETE(
      new Request("http://localhost/x", { method: "DELETE" }),
      context("nope"),
    );

    expect(response.status).toBe(404);
    expect(mockedDeleteConversation).not.toHaveBeenCalled();
  });

  it("deletes an owned conversation and returns 204", async () => {
    mockedGetConversationForUser.mockResolvedValue(conversation);
    mockedDeleteConversation.mockResolvedValue({
      id: "conv-1",
      userId: "user-1",
      title: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await DELETE(
      new Request("http://localhost/x", { method: "DELETE" }),
      context("conv-1"),
    );

    expect(response.status).toBe(204);
    expect(mockedDeleteConversation).toHaveBeenCalledWith("conv-1");
  });
});
