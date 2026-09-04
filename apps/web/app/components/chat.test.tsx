import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";

import userEvent from "@testing-library/user-event";

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchConversation,
  fetchConversations,
  sendChatMessage,
} from "@/lib/api";
import type { SessionUser } from "@/lib/auth/types";

import Chat from "./chat";
import NavbarDefault, { NavbarProvider } from "./navbar";
import { UserProvider } from "./user-provider";

const Navbar = NavbarDefault;

vi.mock("@/lib/api", () => ({
  sendChatMessage: vi.fn(),
  fetchConversation: vi.fn(),
  fetchConversations: vi.fn(),
  deleteConversation: vi.fn(),
}));

const mockedSendChatMessage = vi.mocked(sendChatMessage);
const mockedFetchConversation = vi.mocked(fetchConversation);
const mockedFetchConversations = vi.mocked(fetchConversations);

const signedInUser: SessionUser = {
  id: "user-1",
  email: "ali@example.com",
  name: "علي",
  role: "USER",
};

const citation = {
  id: "[1]",

  chunkId: "chunk-1",

  lawName: "قانون العمل",

  lawNumber: "148",

  year: "2019",

  articleNumber: "35",

  articleTitle: "إنهاء عقد العمل",

  text: "النص الكامل للمادة 35.",

  sourceFile: "labour-law-148-2019.pdf",

  pageStart: 10,

  pageEnd: 11,
};

function mockResponse(overrides: Partial<{
  answer: string;
  citations: typeof citation[];
}> = {}) {
  mockedSendChatMessage.mockResolvedValue({
    answer: overrides.answer ?? "وفقًا للمادة [1]، يحدد القانون ذلك.",
    citations: overrides.citations ?? [citation],
    generation: { model: "test-model", durationMs: 10 },
  });
}

async function askQuestion(question: string) {
  const user = userEvent.setup();

  await user.type(
    screen.getByLabelText("السؤال القانوني"),
    `${question}{Enter}`,
  );

  return user;
}

describe("Chat citation modal", () => {
  beforeEach(() => {
    mockedSendChatMessage.mockReset();
    mockedFetchConversation.mockReset();
    mockedFetchConversations.mockReset().mockResolvedValue([]);
  });

  it("does not render the modal initially", () => {
    render(<Chat />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders an inline citation marker as a clickable badge", async () => {
    mockResponse();

    render(<Chat />);

    await askQuestion("ما هي شروط إنهاء عقد العمل؟");

    const badge = await screen.findByRole("button", { name: "[1]" });

    expect(badge).toHaveClass("citation-badge");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens a modal with metadata and full source text when the badge is clicked", async () => {
    mockResponse();

    const user = await (async () => {
      render(<Chat />);

      return askQuestion("ما هي شروط إنهاء عقد العمل؟");
    })();

    const badge = await screen.findByRole("button", { name: "[1]" });

    await user.click(badge);

    const dialog = screen.getByRole("dialog", {
      name: "المصدر [1]",
    });

    expect(dialog).toHaveTextContent(
      "قانون العمل رقم 148 لسنة 2019 · المادة 35 · الصفحات 10-11",
    );

    expect(screen.getByText("إنهاء عقد العمل")).toBeInTheDocument();

    expect(screen.getByText("labour-law-148-2019.pdf")).toBeInTheDocument();

    expect(screen.getByText("النص الكامل للمادة 35.")).toBeInTheDocument();
  });

  it("leaves unmatched citation markers as plain text", async () => {
    mockResponse({
      answer: "وفقًا للمادة [7]، لا يوجد نص مطابق.",
      citations: [],
    });

    render(<Chat />);

    await askQuestion("سؤال بلا مصادر");

    await screen.findByText(/لا يوجد نص مطابق/);

    expect(screen.queryByRole("button", { name: "[7]" })).not
      .toBeInTheDocument();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the modal via the close button", async () => {
    mockResponse();

    const user = await (async () => {
      render(<Chat />);

      return askQuestion("سؤال");
    })();

    await user.click(await screen.findByRole("button", { name: "[1]" }));

    await user.click(screen.getByRole("button", { name: "إغلاق" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the modal via the Escape key", async () => {
    mockResponse();

    const user = await (async () => {
      render(<Chat />);

      return askQuestion("سؤال");
    })();

    await user.click(await screen.findByRole("button", { name: "[1]" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the modal via a backdrop click", async () => {
    mockResponse();

    const user = await (async () => {
      render(<Chat />);

      return askQuestion("سؤال");
    })();

    await user.click(await screen.findByRole("button", { name: "[1]" }));

    const overlay = document.querySelector(".citation-overlay");

    expect(overlay).not.toBeNull();

    fireEvent.click(overlay as Element);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("Chat conversation history", () => {
  const sidebarConversations = [
    {
      id: "conv-9",
      title: "سؤال سابق",
      messageCount: 2,
      createdAt: "2026-08-01T10:00:00.000Z",
      updatedAt: "2026-08-02T10:00:00.000Z",
    },
  ];

  function renderWithHistory() {
    return render(
      <UserProvider initialUser={signedInUser}>
        <NavbarProvider>
          <Navbar />
          <Chat />
        </NavbarProvider>
      </UserProvider>,
    );
  }

  beforeEach(() => {
    mockedSendChatMessage.mockReset();
    mockedFetchConversation.mockReset();
    mockedFetchConversations.mockReset();
  });

  it("loads and displays both user and assistant messages when a conversation is clicked", async () => {
    mockedFetchConversations.mockResolvedValue(sidebarConversations);

    mockedFetchConversation.mockResolvedValue({
      id: "conv-9",
      title: "سؤال سابق",
      messages: [
        {
          id: "msg-1",
          role: "USER" as const,
          content: "ما هي مدة الإخطار؟",
          createdAt: "2026-08-01T10:00:00.000Z",
        },
        {
          id: "msg-2",
          role: "ASSISTANT" as const,
          content: "المادة [1] تحدد المدة.",
          createdAt: "2026-08-01T10:00:05.000Z",
        },
      ],
    });

    const user = userEvent.setup();

    renderWithHistory();

    await user.click(await screen.findByText("سؤال سابق"));

    expect(mockedFetchConversation).toHaveBeenCalledWith("conv-9");

    expect(await screen.findByText("ما هي مدة الإخطار؟")).toBeInTheDocument();

    expect(screen.getByText("المادة [1] تحدد المدة.")).toBeInTheDocument();
  });

  it("resets the active selection when starting a new chat", async () => {
    mockedFetchConversations.mockResolvedValue(sidebarConversations);

    mockedFetchConversation.mockResolvedValue({
      id: "conv-9",
      title: "سؤال سابق",
      messages: [
        {
          id: "msg-1",
          role: "USER" as const,
          content: "رسالة قديمة",
          createdAt: "2026-08-01T10:00:00.000Z",
        },
      ],
    });

    const user = userEvent.setup();

    renderWithHistory();

    await user.click(await screen.findByText("سؤال سابق"));

    expect(await screen.findByText("رسالة قديمة")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "محادثة جديدة" }));

    await waitFor(() => {
      expect(screen.queryByText("رسالة قديمة")).not.toBeInTheDocument();
    });

    const list = screen.getByRole("list");

    const activeItem = within(list)
      .getAllByRole("button", { name: /سؤال سابق/ })
      .find((button) => button.classList.contains("sidebar-item"));

    expect(activeItem).toBeDefined();

    expect(activeItem).not.toHaveClass("sidebar-item--active");
  });

  it("refreshes the sidebar list after the first exchange of a new chat", async () => {
    mockedFetchConversations.mockResolvedValue([]);

    mockedSendChatMessage.mockResolvedValue({
      conversationId: "conv-new",
      answer: "إجابة.",
      citations: [],
      generation: { model: "test-model", durationMs: 10 },
    });

    renderWithHistory();

    await askQuestion("سؤال أول");

    await screen.findByText("إجابة.");

    await waitFor(() => {
      expect(mockedSendChatMessage).toHaveBeenCalledWith(
        "سؤال أول",
        undefined,
      );
    });

    await waitFor(() => {
      expect(mockedFetchConversations).toHaveBeenCalledTimes(2);
    });
  });
});

describe("Chat sidebar toggle", () => {
  beforeEach(() => {
    mockedSendChatMessage.mockReset();
    mockedFetchConversation.mockReset();
    mockedFetchConversations.mockReset().mockResolvedValue([]);
  });

  it("collapses and expands the sidebar via the navbar button", async () => {
    const user = userEvent.setup();

    render(
      <UserProvider initialUser={signedInUser}>
        <NavbarProvider>
          <Navbar />
          <Chat />
        </NavbarProvider>
      </UserProvider>,
    );

    const workspace = document.querySelector(".workspace") as Element;

    expect(workspace).toHaveClass("workspace--sidebar-collapsed");

    await user.click(screen.getByRole("button", { name: "المحادثات" }));

    expect(workspace).toHaveClass("workspace--sidebar-open");

    const navToggle = screen.getByRole("button", { name: "المحادثات" });

    expect(navToggle).toHaveAttribute("aria-expanded", "true");
    expect(navToggle).toHaveClass("sidebar-nav-toggle--active");

    await user.click(navToggle);

    expect(workspace).toHaveClass("workspace--sidebar-collapsed");
  });
});
