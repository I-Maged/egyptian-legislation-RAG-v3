"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  fetchConversation,
  sendChatMessage,
} from "@/lib/api";
import type { ConversationMessage } from "@/lib/api";

import { formatCitation, formatLawName } from "@/lib/utils/format-citation";

import ConversationsSidebar from "./conversations-sidebar";
import { FeedbackControls } from "./feedback-controls";
import { MessageContent } from "./chat-message-content";
import { useNavbarAction, useNavbarSecondaryToggle } from "./navbar";

function toLocalMessages(messages: ConversationMessage[]): Message[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role === "USER" ? "user" : "assistant",
    content: message.content,
    persistedId: message.id,
    ...(message.role === "ASSISTANT"
      ? { feedback: message.myFeedback ?? null }
      : {}),
  }));
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setHistoryError(null);
    setSidebarOpen(false);
  }, []);

  useNavbarAction({ onClick: handleNewChat, disabled: loading });

  useNavbarSecondaryToggle({
    onClick: () => setSidebarOpen((open) => !open),
    active: sidebarOpen,
  });

  async function handleSelectConversation(id: string) {
    if (loading) return;

    setHistoryError(null);
    setLoading(true);

    try {
      const detail = await fetchConversation(id);

      setConversationId(detail.id);
      setMessages(toLocalMessages(detail.messages));
      setSidebarOpen(false);
    } catch (error) {
      setHistoryError(
        error instanceof Error ? error.message : "تعذر تحميل المحادثة.",
      );
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleDeleteConversation(id: string) {
    if (id === conversationId) {
      setMessages([]);
      setConversationId(null);
    }
  }

  useEffect(() => {
    if (!activeCitation) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveCitation(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeCitation]);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    const query = input.trim();
    if (!query || loading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: query,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const payload = await sendChatMessage(
        query,
        conversationId ?? undefined,
      );

      if (payload.conversationId) {
        if (!conversationId) {
          setRefreshKey((key) => key + 1);
        }

        setConversationId(payload.conversationId);
      }

      const assistantMessageId = payload.messageId ?? crypto.randomUUID();

      setMessages((current) => [
        ...current,
        {
          id: assistantMessageId,
          role: "assistant",
          content: payload.answer,
          citations: payload.citations,
          persistedId: payload.messageId ?? undefined,
          feedback: null,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            error instanceof Error ? error.message : "حدث خطأ غير متوقع.",
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  }

  return (
    <div
      className={`workspace workspace--${
        sidebarOpen ? "sidebar-open" : "sidebar-collapsed"
      }`}
    >
      <div
        className={`sidebar-wrap${
          sidebarOpen ? " sidebar-wrap--open" : ""
        }`}
      >
        <ConversationsSidebar
          activeId={conversationId}
          onSelect={(id) => void handleSelectConversation(id)}
          onDeleted={handleDeleteConversation}
          refreshKey={refreshKey}
        />
      </div>

      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="shell">
        {historyError && (
          <div className="history-error" role="alert">
            {historyError}
            <button type="button" onClick={() => setHistoryError(null)}>
              ×
            </button>
          </div>
        )}
        <section className="chat-area">
        {messages.length === 0 ? (
          <div className="welcome">
            <div className="welcome-icon">§</div>
            <h1>كيف يمكنني مساعدتك؟</h1>
            <p>
              اسأل عن مادة أو حكم أو قاعدة واردة في التشريعات المصرية الموجودة
              في قاعدة المعرفة.
            </p>
            <div className="suggestions">
              <button
                onClick={() =>
                  setInput("ما هي شروط إنهاء عقد العمل وفقًا لقانون العمل؟")
                }
              >
                شروط إنهاء عقد العمل
              </button>
              <button
                onClick={() =>
                  setInput("ما الذي ينظمه قانون العمل بشأن الإجازات؟")
                }
              >
                الإجازات في قانون العمل
              </button>
              <button
                onClick={() =>
                  setInput("ما هي مدة الإخطار المطلوبة قبل إنهاء عقد العمل؟")
                }
              >
                مدة الإخطار
              </button>
            </div>
          </div>
        ) : (
          <div className="messages">
            {messages.map((message) => (
              <article key={message.id} className={`message ${message.role}`}>
                <div className="avatar">
                  {message.role === "user" ? "أنت" : "ق"}
                </div>
                <div className="message-body">
                  <div className="message-role">
                    {message.role === "user" ? "أنت" : "المساعد القانوني"}
                  </div>
                  <MessageContent
                    content={message.content}
                    citations={message.citations}
                    onCitationClick={setActiveCitation}
                  />
                  {message.role === "assistant" && message.persistedId && (
                    <FeedbackControls
                      messageId={message.persistedId}
                      feedback={message.feedback ?? null}
                      onChange={(value) =>
                        setMessages((current) =>
                          current.map((item) =>
                            item.id === message.id
                              ? { ...item, feedback: value }
                              : item,
                          ),
                        )
                      }
                    />
                  )}
                  {message.citations && message.citations.length > 0 && (
                    <div className="sources">
                      <div className="sources-title">المصادر</div>
                      {message.citations.map((citation) => (
                        <div className="source" key={citation.id}>
                          <span className="source-id">{citation.id}</span>
                          <span>{formatCitation(citation)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
            {loading && (
              <article className="message assistant">
                <div className="avatar">ق</div>
                <div className="message-body">
                  <div className="message-role">المساعد القانوني</div>
                  <div className="typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </article>
            )}
          </div>
        )}
      </section>

      <form className="composer-wrap" onSubmit={submit}>
        <div className="composer">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اكتب سؤالك القانوني..."
            rows={1}
            disabled={loading}
            aria-label="السؤال القانوني"
          />
          <button
            type="submit"
            className="send"
            disabled={loading || !input.trim()}
            aria-label="إرسال"
          >
            ↑
          </button>
        </div>
        <div className="disclaimer">
          الإجابة تجريبية وليست استشارة قانونية ملزمة.
        </div>
      </form>

      {activeCitation && (
        <div
          className="citation-overlay"
          onClick={() => setActiveCitation(null)}
        >
          <div
            className="citation-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`المصدر ${activeCitation.id}`}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="citation-modal-header">
              <div className="citation-modal-title">
                <span className="source-id">{activeCitation.id}</span>
                <span>{formatCitation(activeCitation)}</span>
              </div>
              <button
                type="button"
                className="citation-modal-close"
                onClick={() => setActiveCitation(null)}
                aria-label="إغلاق"
              >
                ×
              </button>
            </header>
            <dl className="citation-meta">
              <div>
                <dt>القانون</dt>
                <dd>{formatLawName(activeCitation)}</dd>
              </div>
              {activeCitation.articleTitle && (
                <div>
                  <dt>عنوان المادة</dt>
                  <dd>{activeCitation.articleTitle}</dd>
                </div>
              )}
              {(activeCitation.pageStart !== null ||
                activeCitation.pageEnd !== null) && (
                <div>
                  <dt>الصفحات</dt>
                  <dd>
                    {activeCitation.pageEnd === null ||
                    activeCitation.pageEnd === activeCitation.pageStart
                      ? `${activeCitation.pageStart}`
                      : `${activeCitation.pageStart}-${activeCitation.pageEnd}`}
                  </dd>
                </div>
              )}
              <div>
                <dt>الملف المصدر</dt>
                <dd>{activeCitation.sourceFile}</dd>
              </div>
            </dl>
            <div className="citation-text-title">النص القانوني</div>
            <blockquote className="citation-text">
              {activeCitation.text}
            </blockquote>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}
