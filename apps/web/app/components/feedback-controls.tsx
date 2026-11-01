"use client";

import { useState } from "react";

import {
  removeFeedbackRequest,
  sendFeedback,
} from "@/lib/api";

type FeedbackType = "POSITIVE" | "NEGATIVE";

function ThumbIcon({ direction }: { direction: "up" | "down" }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{
        transform: direction === "down" ? "rotate(180deg)" : undefined,
      }}
    >
      <path d="M7 10v12" />
      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
    </svg>
  );
}

export function FeedbackControls({
  messageId,
  feedback,
  onChange,
}: {
  messageId: string;
  feedback: FeedbackType | null;
  onChange: (feedback: FeedbackType | null) => void;
}) {
  const [comment, setComment] = useState("");
  const [commentOpen, setCommentOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function vote(type: FeedbackType) {
    if (saving) return;

    setSaving(true);
    setError(null);

    try {
      if (feedback === type) {
        await removeFeedbackRequest(messageId);
        setComment("");
        setCommentOpen(false);
        onChange(null);
      } else {
        await sendFeedback(messageId, type, comment || undefined);
        onChange(type);
        setCommentOpen(type === "NEGATIVE");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر حفظ التقييم.");
    } finally {
      setSaving(false);
    }
  }

  async function saveComment() {
    if (saving) return;

    setSaving(true);
    setError(null);

    try {
      await sendFeedback(messageId, "NEGATIVE", comment.trim() || undefined);
      setCommentOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر حفظ التقييم.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="message-feedback">
      <div className="feedback-actions">
        <button
          type="button"
          className={`feedback-btn${
            feedback === "POSITIVE" ? " feedback-btn--active" : ""
          }`}
          disabled={saving}
          onClick={() => void vote("POSITIVE")}
          aria-label="تقييم إيجابي"
          aria-pressed={feedback === "POSITIVE"}
          title="إجابة مفيدة"
        >
          <ThumbIcon direction="up" />
        </button>
        <button
          type="button"
          className={`feedback-btn${
            feedback === "NEGATIVE" ? " feedback-btn--active" : ""
          }`}
          disabled={saving}
          onClick={() => void vote("NEGATIVE")}
          aria-label="تقييم سلبي"
          aria-pressed={feedback === "NEGATIVE"}
          title="إجابة غير مفيدة"
        >
          <ThumbIcon direction="down" />
        </button>
      </div>

      {commentOpen && feedback === "NEGATIVE" && (
        <div className="feedback-comment">
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="ما المشكلة في هذه الإجابة؟ (اختياري)"
            rows={2}
            aria-label="ملاحظة على التقييم السلبي"
          />
          <div className="feedback-comment-actions">
            <button
              type="button"
              onClick={() => void saveComment()}
              disabled={saving}
            >
              حفظ الملاحظة
            </button>
            <button
              type="button"
              className="feedback-comment-skip"
              onClick={() => setCommentOpen(false)}
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="feedback-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}