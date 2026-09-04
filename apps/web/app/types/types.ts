type ChatBody = {
  query?: unknown;
  lawDocumentId?: unknown;
  conversationId?: unknown;
};

type Citation = {
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
};

type MessageFeedbackType = "POSITIVE" | "NEGATIVE";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  persistedId?: string;
  feedback?: MessageFeedbackType | null;
};
