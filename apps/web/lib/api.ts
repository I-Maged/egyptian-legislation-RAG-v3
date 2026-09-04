export interface ChatCitation {
  id: string;

  chunkId: string;

  lawName: string;
  lawNumber: string | null;
  year: string | null;

  articleNumber: string;
  articleTitle: string | null;

  text: string;

  sourceFile: string;

  pageStart: number | null;
  pageEnd: number | null;
}

export interface ChatResponse {
  conversationId?: string;

  messageId?: string;

  answer: string;

  citations: ChatCitation[];

  generation: {
    model: string;
    durationMs: number;
  };
}

export type FeedbackTypeValue = "POSITIVE" | "NEGATIVE";

export async function sendFeedback(
  messageId: string,
  type: FeedbackTypeValue,
  comment?: string,
): Promise<void> {
  const response = await fetch(`/api/messages/${messageId}/feedback`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      type,
      ...(comment ? { comment } : {}),
    }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    throw new Error(data?.error ?? "تعذر حفظ التقييم.");
  }
}

export async function removeFeedbackRequest(
  messageId: string,
): Promise<void> {
  const response = await fetch(`/api/messages/${messageId}/feedback`, {
    method: "DELETE",
  });

  if (!response.ok && response.status !== 204) {
    throw new Error("تعذر إزالة التقييم.");
  }
}

export async function sendChatMessage(
  query: string,
  conversationId?: string,
): Promise<ChatResponse> {
  const response = await fetch("/api/chat", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      query,
      ...(conversationId ? { conversationId } : {}),
    }),
  });

  const data = (await response.json()) as ChatResponse | { error?: string };

  if (!response.ok) {
    throw new Error(
      "error" in data && data.error ? data.error : "Failed to get an answer.",
    );
  }

  return data as ChatResponse;
}

export interface ConversationSummary {
  id: string;

  title: string | null;

  messageCount: number;

  createdAt: string;

  updatedAt: string;
}

export interface ConversationMessage {
  id: string;

  role: "USER" | "ASSISTANT";

  content: string;

  createdAt: string;

  myFeedback?: FeedbackTypeValue | null;
}

export interface ConversationDetail {
  id: string;

  title: string | null;

  messages: ConversationMessage[];
}

export async function fetchConversations(): Promise<ConversationSummary[]> {
  const response = await fetch("/api/conversations");

  if (!response.ok) {
    throw new Error("تعذر تحميل المحادثات.");
  }

  const data = (await response.json()) as {
    conversations?: ConversationSummary[];
  };

  return data.conversations ?? [];
}

export async function fetchConversation(
  id: string,
): Promise<ConversationDetail> {
  const response = await fetch(`/api/conversations/${id}`);

  if (response.status === 404) {
    throw new Error("المحادثة غير موجودة.");
  }

  if (!response.ok) {
    throw new Error("تعذر تحميل المحادثة.");
  }

  const data = (await response.json()) as { conversation?: ConversationDetail };

  if (!data.conversation) {
    throw new Error("تعذر تحميل المحادثة.");
  }

  return data.conversation;
}

export async function deleteConversation(id: string): Promise<void> {
  const response = await fetch(`/api/conversations/${id}`, {
    method: "DELETE",
  });

  if (!response.ok && response.status !== 204) {
    throw new Error("تعذر حذف المحادثة.");
  }
}
