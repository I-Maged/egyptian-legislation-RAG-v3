import { render, screen, waitFor } from "@testing-library/react";

import userEvent from "@testing-library/user-event";

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  deleteConversation,
  fetchConversations,
} from "@/lib/api";

import ConversationsSidebar from "./conversations-sidebar";
import { UserProvider } from "./user-provider";
import type { SessionUser } from "@/lib/auth/types";

vi.mock("@/lib/api", () => ({
  fetchConversations: vi.fn(),
  deleteConversation: vi.fn(),
}));

const mockedFetchConversations = vi.mocked(fetchConversations);
const mockedDeleteConversation = vi.mocked(deleteConversation);

const signedInUser: SessionUser = {
  id: "user-1",
  email: "ali@example.com",
  name: "علي",
  role: "USER",
};

const conversations = [
  {
    id: "conv-1",
    title: "سؤال عن قانون العمل",
    messageCount: 4,
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-02T10:00:00.000Z",
  },
  {
    id: "conv-2",
    title: null,
    messageCount: 2,
    createdAt: "2026-08-03T10:00:00.000Z",
    updatedAt: "2026-08-03T12:00:00.000Z",
  },
];

function renderSidebar(
  user: SessionUser | null = signedInUser,
  props: Partial<Parameters<typeof ConversationsSidebar>[0]> = {},
) {
  return render(
    <UserProvider initialUser={user}>
      <ConversationsSidebar
        activeId={null}
        onSelect={vi.fn()}
        refreshKey={0}
        {...props}
      />
    </UserProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ConversationsSidebar", () => {
  it("renders nothing while the session is loading", async () => {
    const fetchMock = vi.fn(
      () => new Promise(() => {}), // never resolves
    );

    vi.stubGlobal("fetch", fetchMock);

    const { container } = renderSidebar(null);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for signed-out users", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(null) }),
    );

    vi.stubGlobal("fetch", fetchMock);

    const { container } = renderSidebar(null);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    expect(container).toBeEmptyDOMElement();
    expect(mockedFetchConversations).not.toHaveBeenCalled();
  });

  it("lists the user's conversations with title, count and date", async () => {
    mockedFetchConversations.mockResolvedValue(conversations);

    renderSidebar();

    expect(await screen.findByText("سؤال عن قانون العمل")).toBeInTheDocument();

    expect(screen.getByText("محادثة بدون عنوان")).toBeInTheDocument();

    expect(screen.getAllByText(/رسالة/)).toHaveLength(2);
  });

  it("shows an empty state when there are no conversations", async () => {
    mockedFetchConversations.mockResolvedValue([]);

    renderSidebar();

    expect(await screen.findByText("لا توجد محادثات بعد")).toBeInTheDocument();
  });

  it("shows an error state when loading fails", async () => {
    mockedFetchConversations.mockRejectedValue(new Error("network"));

    renderSidebar();

    expect(await screen.findByText("تعذر تحميل المحادثات.")).toBeInTheDocument();
  });

  it("calls onSelect with the clicked conversation's id", async () => {
    mockedFetchConversations.mockResolvedValue(conversations);

    const onSelect = vi.fn();

    renderSidebar(signedInUser, { onSelect });

    const [item] = await screen.findAllByRole("button", {
      name: /سؤال عن قانون العمل/,
    });

    await userEvent.setup().click(item!);

    expect(onSelect).toHaveBeenCalledWith("conv-1");
  });

  it("highlights the active conversation", async () => {
    mockedFetchConversations.mockResolvedValue(conversations);

    renderSidebar(signedInUser, { activeId: "conv-2" });

    const activeItem = await screen.findByRole("button", {
      name: /محادثة بدون عنوان/,
    });

    expect(activeItem).toHaveClass("sidebar-item--active");
    expect(activeItem).toHaveAttribute("aria-current", "true");
  });

  it("deletes a conversation and removes it from the list", async () => {
    mockedFetchConversations.mockResolvedValue(conversations);
    mockedDeleteConversation.mockResolvedValue(undefined);

    const onDeleted = vi.fn();

    const user = userEvent.setup();

    renderSidebar(signedInUser, { onDeleted });

    await screen.findByText("سؤال عن قانون العمل");

    await user.click(
      screen.getByRole("button", { name: "حذف سؤال عن قانون العمل" }),
    );

    await waitFor(() => {
      expect(mockedDeleteConversation).toHaveBeenCalledWith("conv-1");
    });

    await waitFor(() => {
      expect(onDeleted).toHaveBeenCalledWith("conv-1");
    });

    await waitFor(() => {
      expect(
        screen.queryByText("سؤال عن قانون العمل"),
      ).not.toBeInTheDocument();
    });
  });

  it("refetches when refreshKey changes", async () => {
    mockedFetchConversations.mockResolvedValue(conversations);

    const { rerender } = renderSidebar();

    await screen.findByText("سؤال عن قانون العمل");

    rerender(
      <UserProvider initialUser={signedInUser}>
        <ConversationsSidebar
          activeId={null}
          onSelect={vi.fn()}
          onDeleted={vi.fn()}
          refreshKey={1}
        />
      </UserProvider>,
    );

    await waitFor(() => {
      expect(mockedFetchConversations).toHaveBeenCalledTimes(2);
    });
  });
});
