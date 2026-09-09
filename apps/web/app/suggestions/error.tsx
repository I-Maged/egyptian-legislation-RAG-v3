"use client";

export default function SuggestionsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="suggestions-main">
      <h1>تعذر إرسال الاقتراح</h1>
      <div role="alert" className="form-error">
        {error.message || "حدث خطأ غير متوقع. حاول مرة أخرى."}
      </div>
      <button type="button" onClick={() => reset()}>
        إعادة المحاولة
      </button>
    </main>
  );
}
