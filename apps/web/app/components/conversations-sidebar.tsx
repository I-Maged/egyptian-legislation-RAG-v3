"use client";

import { useEffect, useState } from "react";

import {
  deleteConversation as deleteConversationRequest,
  fetchConversations,
  type ConversationSummary,
} from "@/lib/api";

import { useUser } from "./user-provider";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ar-EG", {
    day: "numeric",
    month: "short",
  });
}

export default function ConversationsSidebar({
  activeId,
  onSelect,
  onDeleted,
  refreshKey,
}: {
  activeId: string | null;
  onSelect: (id: string) => void;
  onDeleted?: (id: string) => void;
  refreshKey: number;
}) {
  const { user, isLoading } = useUser();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading || !user) return;

    let cancelled = false;

    async function loadConversations() {
      try {
        const result = await fetchConversations();

        if (!cancelled) {
          setConversations(result);
          setError(null);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError("تعذر تحميل المحادثات.");
          setLoading(false);
        }
      }
    }

    void loadConversations();

    return () => {
      cancelled = true;
    };
  }, [isLoading, user, refreshKey]);

  if (isLoading || !user) {
    return null;
  }

  async function handleDelete(id: string) {
    try {
      await deleteConversationRequest(id);
      setConversations((current) =>
        current.filter((conversation) => conversation.id !== id),
      );
      onDeleted?.(id);
    } catch {
      setError("تعذر حذف المحادثة.");
    }
  }

  return (
    <aside className="sidebar" aria-label="سجل المحادثات">
      <div className="sidebar-title">محادثاتي</div>

      {error && <div className="sidebar-error">{error}</div>}

      {loading ? (
        <div className="sidebar-empty">جارٍ التحميل...</div>
      ) : conversations.length === 0 && !error ? (
        <div className="sidebar-empty">لا توجد محادثات بعد</div>
      ) : (
        <ul className="sidebar-list">
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <button
                type="button"
                className={`sidebar-item${
                  conversation.id === activeId ? " sidebar-item--active" : ""
                }`}
                aria-current={conversation.id === activeId || undefined}
                onClick={() => onSelect(conversation.id)}
              >
                <span className="sidebar-item-title">
                  {conversation.title ?? "محادثة بدون عنوان"}
                </span>
                <span className="sidebar-item-meta">
                  <span className="sidebar-item-count">
                    {conversation.messageCount} رسالة
                  </span>
                  <span className="sidebar-item-date">
                    {formatDate(conversation.updatedAt)}
                  </span>
                </span>
              </button>
              <button
                type="button"
                className="sidebar-delete"
                aria-label={`حذف ${conversation.title ?? "المحادثة"}`}
                onClick={() => void handleDelete(conversation.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
