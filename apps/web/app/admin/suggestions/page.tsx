import {
  approveArticleSuggestion,
  getAdminSuggestionPageData,
  rejectArticleSuggestion,
} from "@/app/actions/suggestions";

export default async function AdminSuggestionsPage() {
  const suggestions = await getAdminSuggestionPageData();
  console.log(suggestions);
  return (
    <main className="admin-main">
      <h1>مراجعة اقتراحات المواد</h1>
      {suggestions.length === 0 ? (
        <p>لا توجد اقتراحات معلقة.</p>
      ) : (
        suggestions.map((s) => (
          <article key={s.id} className="suggestion-review-card">
            <h2>{s.title}</h2>
            <p>
              <strong>المستخدم:</strong> {s.user.name ?? s.user.email}
            </p>
            <p>
              <strong>السبب:</strong> {s.reason}
            </p>
            <p>
              <strong>النص المقترح:</strong>
            </p>
            <pre className="suggestion-proposed-text">{s.proposedText}</pre>
            <div className="suggestion-review-actions">
              <form action={approveArticleSuggestion.bind(null, s.id)}>
                <button type="submit">اعتماد وتطبيق</button>
              </form>
              <form action={rejectArticleSuggestion.bind(null, s.id)}>
                <input name="adminNote" placeholder="ملاحظة الرفض (اختيارية)" />
                <button type="submit">رفض</button>
              </form>
            </div>
          </article>
        ))
      )}
    </main>
  );
}
