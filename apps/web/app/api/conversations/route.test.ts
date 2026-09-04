// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@egyptian-law/db", () => ({
  listConversations: vi.fn(),
}));

import { getCurrentUser } from "@/lib/auth/session";
import { listConversations } from "@egyptian-law/db";

import { GET } from "./route";

const mockedGetCurrentUser = vi.mocked(getCurrentUser);
const mockedListConversations = vi.mocked(listConversations);

const user = { id: "user-1", email: "u@example.com", name: null, role: "USER" as const };

beforeEach(() => {
  vi.clearAllMocks();
  mockedGetCurrentUser.mockResolvedValue(user);
});

describe("GET /api/conversations", () => {
  it("returns 401 when unauthenticated", async () => {
    mockedGetCurrentUser.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(mockedListConversations).not.toHaveBeenCalled();
  });

  it("lists the current user's conversations with message counts", async () => {
    const updatedAt = new Date();

    mockedListConversations.mockResolvedValue([
      {
        id: "conv-1",
        userId: "user-1",
        title: "محادثة",
        createdAt: new Date(),
        updatedAt,
        _count: { messages: 4 },
      },
    ]);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(mockedListConversations).toHaveBeenCalledWith("user-1");

    const data = (await response.json()) as {
      conversations: Array<Record<string, unknown>>;
    };

    expect(data.conversations).toHaveLength(1);
    expect(data.conversations[0]).toMatchObject({
      id: "conv-1",
      title: "محادثة",
      messageCount: 4,
    });
  });
});
