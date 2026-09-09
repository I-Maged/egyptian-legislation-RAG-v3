"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { submitArticleSuggestion } from "@/app/actions/suggestions";
import { initialSuggestionFormState } from "./suggestion-state";

export type SuggestionLawOption = {
  id: string;
  lawName: string;
  lawNumber: string | null;
  chunks: Array<{
    id: string;
    articleNumber: string;
    articleTitle: string | null;
  }>;
};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={disabled || pending}>
      {pending ? "جارٍ الإرسال..." : "إرسال الاقتراح"}
    </button>
  );
}

export default function SuggestionForm({ laws }: { laws: SuggestionLawOption[] }) {
  const [state, formAction] = useActionState(
    submitArticleSuggestion,
    initialSuggestionFormState,
  );
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState("EDIT_ARTICLE");
  const [selectedLawId, setSelectedLawId] = useState("");
  const [selectedChunkId, setSelectedChunkId] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const isEdit = type === "EDIT_ARTICLE";

  const chunks = useMemo(
    () => laws.find((law) => law.id === selectedLawId)?.chunks ?? [],
    [laws, selectedLawId],
  );

  // On success: show banner, clear the form, and refresh server data
  // (previous suggestions table) without navigating away.
  // One-shot consumption of the success state: guards + bail-outs mean this
  // runs at most once per submission, not a render loop.
  /* eslint-disable react-hooks/set-state-in-effect -- see above */
  useEffect(() => {
    if (state.ok && state.created) {
      setShowSuccess(true);
      setType("EDIT_ARTICLE");
      setSelectedLawId("");
      setSelectedChunkId("");
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <form
      ref={formRef}
      action={(formData) => {
        setShowSuccess(false);
        formAction(formData);
      }}
      className="suggestion-form"
    >
      {showSuccess && state.ok && state.created ? (
        <div role="status" className="form-success">
          <span>تم إرسال الاقتراح بنجاح. سيظهر في اقتراحاتك بعد المراجعة.</span>
          <button type="button" onClick={() => setShowSuccess(false)}>
            إغلاق
          </button>
        </div>
      ) : null}

      {state.ok === false && state.error ? (
        <div role="alert" className="form-error">
          {state.error}
        </div>
      ) : null}

      <label>
        نوع الاقتراح
        <select
          name="type"
          required
          value={type}
          onChange={(event) => {
            setType(event.target.value);
            // Adding a new article has no target chunk; clear any stale selection.
            if (event.target.value === "ADD_ARTICLE") setSelectedChunkId("");
          }}
        >
          <option value="EDIT_ARTICLE">تعديل مادة موجودة</option>
          <option value="ADD_ARTICLE">إضافة مادة</option>
        </select>
      </label>

      <label>
        القانون
        <select
          name="lawDocumentId"
          required
          value={selectedLawId}
          onChange={(event) => {
            setSelectedLawId(event.target.value);
            // Chunks belong to a specific law — reset to avoid cross-law mismatch.
            setSelectedChunkId("");
          }}
        >
          <option value="" disabled>
            اختر القانون
          </option>
          {laws.map((law) => (
            <option key={law.id} value={law.id}>
              {law.lawName}
              {law.lawNumber ? ` — ${law.lawNumber}` : ""}
            </option>
          ))}
        </select>
      </label>

      <label>
        المادة المراد تعديلها <span>(للتعديل)</span>
        <select
          name="lawChunkId"
          value={selectedChunkId}
          onChange={(event) => setSelectedChunkId(event.target.value)}
          required={isEdit}
          disabled={!isEdit || !selectedLawId}
        >
          <option value="">
            {isEdit
              ? selectedLawId
                ? chunks.length > 0
                  ? "اختر المادة"
                  : "لا توجد مواد لهذا القانون"
                : "اختر القانون أولاً"
              : "— إضافة مادة جديدة —"}
          </option>
          {chunks.map((chunk) => (
            <option key={chunk.id} value={chunk.id}>
              مادة {chunk.articleNumber}
              {chunk.articleTitle ? ` — ${chunk.articleTitle}` : ""}
            </option>
          ))}
        </select>
      </label>

      <label>
        رقم المادة
        <input name="articleNumber" required placeholder="مثال: 45" />
      </label>
      <label>
        عنوان المادة <span>(اختياري)</span>
        <input name="articleTitle" />
      </label>
      <label>
        النص المقترح
        <textarea name="proposedText" required rows={12} />
      </label>
      <label>
        سبب الاقتراح
        <textarea name="reason" required rows={5} />
      </label>
      <SubmitButton disabled={isEdit && !selectedChunkId} />
    </form>
  );
}
