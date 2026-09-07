import Link from "next/link";
import { getSuggestionPageData, submitArticleSuggestion } from "@/app/actions/suggestions";

export default async function SuggestionsPage() {
  const { laws, suggestions } = await getSuggestionPageData();
  return (
    <main className="suggestions-main">
      <h1>اقتراح تعديل أو إضافة مادة</h1>
      <p>يمكن للمستخدم المسجل اقتراح تعديل مادة موجودة أو إضافة مادة إلى قانون موجود. لا يصبح التعديل فعالاً في البحث إلا بعد مراجعته واعتماده من المسؤول.</p>
      <form action={submitArticleSuggestion} className="suggestion-form">
        <label>نوع الاقتراح
          <select name="type" defaultValue="EDIT_ARTICLE" required>
            <option value="EDIT_ARTICLE">تعديل مادة موجودة</option>
            <option value="ADD_ARTICLE">إضافة مادة</option>
          </select>
        </label>
        <label>القانون
          <select name="lawDocumentId" required defaultValue="">
            <option value="" disabled>اختر القانون</option>
            {laws.map((law) => <option key={law.id} value={law.id}>{law.lawName}{law.lawNumber ? ` — ${law.lawNumber}` : ""}</option>)}
          </select>
        </label>
        <label>المادة المراد تعديلها <span>(للتعديل)</span>
          <select name="lawChunkId" defaultValue="">
            <option value="">— إضافة مادة جديدة —</option>
            {laws.flatMap((law) => law.chunks.map((chunk) => <option key={chunk.id} value={chunk.id}>{law.lawName} — مادة {chunk.articleNumber}</option>))}
          </select>
        </label>
        <label>رقم المادة
          <input name="articleNumber" required placeholder="مثال: 45" />
        </label>
        <label>عنوان المادة <span>(اختياري)</span>
          <input name="articleTitle" />
        </label>
        <label>النص المقترح
          <textarea name="proposedText" required rows={12} />
        </label>
        <label>سبب الاقتراح
          <textarea name="reason" required rows={5} />
        </label>
        <button type="submit">إرسال الاقتراح</button>
      </form>
      <section>
        <h2>اقتراحاتي السابقة</h2>
        {suggestions.length === 0 ? <p>لا توجد اقتراحات بعد.</p> : (
          <table className="data-table"><thead><tr><th>التاريخ</th><th>النوع</th><th>الحالة</th><th>العنوان</th><th>ملاحظة المسؤول</th></tr></thead>
            <tbody>{suggestions.map((s) => <tr key={s.id}><td>{s.createdAt.toLocaleString("ar-EG")}</td><td>{s.type === "ADD_ARTICLE" ? "إضافة مادة" : "تعديل مادة"}</td><td>{statusLabel(s.status)}</td><td>{s.title}</td><td>{s.adminNote ?? "-"}</td></tr>)}</tbody>
          </table>
        )}
      </section>
      <Link href="/">العودة إلى المحادثة</Link>
    </main>
  );
}
function statusLabel(status: string) { return ({ PENDING: "قيد المراجعة", UNDER_REVIEW: "قيد المراجعة", APPROVED: "تم الاعتماد", REJECTED: "مرفوض", APPLIED: "تم التطبيق", FAILED: "فشل التطبيق" } as Record<string,string>)[status] ?? status; }
