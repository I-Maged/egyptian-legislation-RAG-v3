import Link from "next/link";
import { getSuggestionPageData } from "@/app/actions/suggestions";
import SuggestionForm, { type SuggestionLawOption } from "./suggestion-form";

export default async function SuggestionsPage() {
  const { laws, suggestions } = await getSuggestionPageData();
  const lawOptions: SuggestionLawOption[] = laws.map((law) => ({
    id: law.id,
    lawName: law.lawName,
    lawNumber: law.lawNumber ?? null,
    chunks: law.chunks.map((chunk) => ({
      id: chunk.id,
      articleNumber: chunk.articleNumber,
      articleTitle: chunk.articleTitle ?? null,
    })),
  }));
  return (
    <main className="suggestions-main">
      <h1>اقتراح تعديل أو إضافة مادة</h1>
      <p>يمكن للمستخدم المسجل اقتراح تعديل مادة موجودة أو إضافة مادة إلى قانون موجود. لا يصبح التعديل فعالاً في البحث إلا بعد مراجعته واعتماده من المسؤول.</p>
      <SuggestionForm laws={lawOptions} />
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
