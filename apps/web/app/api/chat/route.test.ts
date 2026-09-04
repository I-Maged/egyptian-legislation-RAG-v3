// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@egyptian-law/db", () => ({
  createConversation: vi.fn(),
  getConversationForUser: vi.fn(),
  appendMessage: vi.fn(),
}));

vi.mock("@egyptian-law/rag", () => ({
  getRagService: vi.fn(),
}));

import { getCurrentUser } from "@/lib/auth/session";
import {
  appendMessage,
  createConversation,
  getConversationForUser,
} from "@egyptian-law/db";
import { getRagService } from "@egyptian-law/rag";

const mockedGetCurrentUser = vi.mocked(getCurrentUser);
const mockedCreateConversation = vi.mocked(createConversation);
const mockedGetConversationForUser = vi.mocked(getConversationForUser);
const mockedAppendMessage = vi.mocked(appendMessage);
const mockedGetRagService = vi.mocked(getRagService);

const user = { id: "user-1", email: "u@example.com", name: null, role: "USER" as const };

const conversation = {
  id: "conv-1",
  userId: "user-1",
  title: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  messages: [],
};

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function mockAnswer() {
  const answer = vi.fn().mockResolvedValue({
    answer: "وفقًا للمادة [1]، يحدد القانون ذلك.",
    citations: [],
    retrieved: [],
    context: { documents: [], text: "" },
    generation: { model: "test-model", durationMs: 42 },
  });

  mockedGetRagService.mockReturnValue({ answer } as never);

  return answer;
}

beforeEach(() => {
  vi.clearAllMocks();

  mockedGetCurrentUser.mockResolvedValue(user);
  mockedAppendMessage.mockImplementation(async (input) => ({
    id: `msg-${mockedAppendMessage.mock.calls.length}`,
    conversationId: input.conversationId,
    role: input.role,
    content: input.content,
    createdAt: new Date(),
    ragRun: null,
  }));
});

describe("POST /api/chat", () => {
  it("returns 401 when unauthenticated", async () => {
    mockedGetCurrentUser.mockResolvedValue(null);

    const response = await POST(makeRequest({ query: "سؤال" }));

    expect(response.status).toBe(401);
    expect(mockedGetRagService).not.toHaveBeenCalled();
  });

  it("returns 400 for an empty query", async () => {
    const response = await POST(makeRequest({ query: "   " }));

    expect(response.status).toBe(400);
    expect(mockedCreateConversation).not.toHaveBeenCalled();
    expect(mockedGetRagService).not.toHaveBeenCalled();
  });

  it("creates a new conversation, persists both messages, and returns conversationId", async () => {
    const answer = mockAnswer();

    mockedCreateConversation.mockResolvedValue({
      ...conversation,
      title: "ما هي شروط إنهاء عقد العمل؟",
    });

    const response = await POST(
      makeRequest({ query: "ما هي شروط إنهاء عقد العمل؟" }),
    );

    expect(response.status).toBe(200);

    const data = (await response.json()) as Record<string, unknown>;

    expect(data.conversationId).toBe("conv-1");

    expect(mockedCreateConversation).toHaveBeenCalledWith({
      userId: "user-1",
      title: "ما هي شروط إنهاء عقد العمل؟",
    });

    expect(mockedAppendMessage).toHaveBeenCalledTimes(2);
    expect(mockedAppendMessage).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ conversationId: "conv-1", role: "USER" }),
    );
    expect(mockedAppendMessage).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        conversationId: "conv-1",
        role: "ASSISTANT",
        content: "وفقًا للمادة [1]، يحدد القانون ذلك.",
        ragRun: expect.objectContaining({ model: "test-model" }),
      }),
    );

    expect(answer).toHaveBeenCalledWith(
      expect.objectContaining({ query: "ما هي شروط إنهاء عقد العمل؟" }),
    );
  });

  it("derives a truncated title for long first queries", async () => {
    mockAnswer();
    mockedCreateConversation.mockResolvedValue(conversation);

    const longQuery = "س".repeat(100);

    await POST(makeRequest({ query: longQuery }));

    const title = mockedCreateConversation.mock.calls[0]![0]
      .title as string;

    expect(title.length).toBeLessThanOrEqual(61);
    expect(title.endsWith("…")).toBe(true);
  });

  it("appends to an existing owned conversation without creating one", async () => {
    mockAnswer();
    mockedGetConversationForUser.mockResolvedValue(conversation);

    const response = await POST(
      makeRequest({ query: "سؤال متابعة", conversationId: "conv-1" }),
    );

    expect(response.status).toBe(200);
    expect(mockedGetConversationForUser).toHaveBeenCalledWith(
      "conv-1",
      "user-1",
    );
    expect(mockedCreateConversation).not.toHaveBeenCalled();
  });

  it("returns 404 when the conversation belongs to another user", async () => {
    mockAnswer();
    mockedGetConversationForUser.mockResolvedValue(null);

    const response = await POST(
      makeRequest({ query: "سؤال", conversationId: "foreign-conv" }),
    );

    expect(response.status).toBe(404);
    expect(mockedAppendMessage).not.toHaveBeenCalled();
    expect(mockedGetRagService).not.toHaveBeenCalled();
  });

  it("returns 500 when the RAG service fails", async () => {
    mockedGetRagService.mockReturnValue({
      answer: vi.fn().mockRejectedValue(new Error("ollama down")),
    } as never);

    mockedCreateConversation.mockResolvedValue(conversation);

    const response = await POST(makeRequest({ query: "سؤال" }));

    expect(response.status).toBe(500);
  });
});
