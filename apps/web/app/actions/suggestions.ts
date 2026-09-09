"use server";

import { redirect } from "next/navigation";
import {
  createLawSuggestion,
  getLawDocument,
  getLawSuggestion,
  listLawDocuments,
  listLawSuggestions,
  listUserLawSuggestions,
  applyArticleChange,
  markLawSuggestionFailed,
  rejectLawSuggestion,
} from "@egyptian-law/db";
import { OllamaEmbeddingProvider } from "@egyptian-law/ingestion";

import { getCurrentUser } from "@/lib/auth/session";
import type { SuggestionFormState } from "../suggestions/suggestion-state";

const embedder = new OllamaEmbeddingProvider({ model: "bge-m3", dimensions: 1024 });

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Authentication required.");
  return user;
}

async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("Admin access required.");
  return user;
}

export async function submitArticleSuggestion(
  _prevState: SuggestionFormState,
  formData: FormData,
): Promise<SuggestionFormState> {
  const user = await requireUser();
  const type = String(formData.get("type") ?? "");
  const lawDocumentId = String(formData.get("lawDocumentId") ?? "").trim();
  const lawChunkId = String(formData.get("lawChunkId") ?? "").trim();
  const articleNumber = String(formData.get("articleNumber") ?? "").trim();
  const articleTitle = String(formData.get("articleTitle") ?? "").trim();
  const proposedText = String(formData.get("proposedText") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if ((type !== "EDIT_ARTICLE" && type !== "ADD_ARTICLE") || !lawDocumentId || !articleNumber || !proposedText || !reason) {
    return { ok: false, error: "نوع الاقتراح والقانون ورقم المادة والنص والسبب مطلوبة." };
  }

  const law = await getLawDocument(lawDocumentId);
  if (!law) return { ok: false, error: "القانون المحدد غير موجود." };

  if (type === "EDIT_ARTICLE") {
    if (!lawChunkId) return { ok: false, error: "يجب تحديد المادة المراد تعديلها من مواد القانون المختار." };
    const chunk = law.chunks.find((item) => item.id === lawChunkId);
    if (!chunk) return { ok: false, error: "المادة المحددة لا تنتمي إلى القانون المختار. حدث الصفحة وأعد اختيار القانون ثم المادة." };
  }

  try {
    await createLawSuggestion({
      userId: user.id,
      type: type as "EDIT_ARTICLE" | "ADD_ARTICLE",
      lawDocumentId,
      ...(type === "EDIT_ARTICLE" ? { lawChunkId } : {}),
      title: `${type === "EDIT_ARTICLE" ? "تعديل" : "إضافة"} المادة ${articleNumber}`,
      reason,
      proposedText,
      proposedArticleNumber: articleNumber,
      ...(articleTitle ? { proposedArticleTitle: articleTitle } : {}),
    });
  } catch (error) {
    console.error("submitArticleSuggestion failed", error);
    return { ok: false, error: "تعذر حفظ الاقتراح. حاول مرة أخرى." };
  }

  return { ok: true, created: true };
}

export async function approveArticleSuggestion(suggestionId: string) {
  const admin = await requireAdmin();
  const suggestion = await getLawSuggestion(suggestionId);
  if (!suggestion) throw new Error("Suggestion not found.");
  if (suggestion.status !== "PENDING" && suggestion.status !== "UNDER_REVIEW") throw new Error("Suggestion is no longer pending.");
  if (suggestion.type !== "EDIT_ARTICLE" && suggestion.type !== "ADD_ARTICLE") throw new Error("Only article suggestions are supported.");
  if (!suggestion.lawDocumentId || !suggestion.proposedText || !suggestion.proposedArticleNumber) throw new Error("Suggestion is incomplete.");

  const law = await getLawDocument(suggestion.lawDocumentId);
  if (!law) throw new Error("Target law no longer exists.");

  let chunkId: string | undefined;
  if (suggestion.type === "EDIT_ARTICLE") {
    if (!suggestion.lawChunkId) throw new Error("Target article is missing.");
    const chunk = law.chunks.find((item) => item.id === suggestion.lawChunkId);
    if (!chunk) throw new Error("Target article no longer exists in this law.");
    chunkId = chunk.id;
  }

  let embedding: number[];
  try {
    const [vector] = await embedder.embed([suggestion.proposedText]);
    if (!vector) throw new Error("Embedding generation returned no vector.");
    embedding = vector;
  } catch (error) {
    await markLawSuggestionFailed({
      suggestionId,
      adminUserId: admin.id,
      adminNote: `Embedding generation failed: ${error instanceof Error ? error.message : String(error)}`,
    });
    redirect("/admin/suggestions");
  }

  try {
    await applyArticleChange({
      mode: suggestion.type === "ADD_ARTICLE" ? "create" : "update",
      documentId: suggestion.lawDocumentId,
      ...(chunkId ? { chunkId } : {}),
      articleNumber: suggestion.proposedArticleNumber,
      articleTitle: suggestion.proposedArticleTitle ?? null,
      text: suggestion.proposedText,
      embedding,
      embeddingModel: embedder.model,
      embeddingDimensions: embedder.dimensions,
      actorUserId: admin.id,
      suggestionId,
    });
  } catch (error) {
    await markLawSuggestionFailed({
      suggestionId,
      adminUserId: admin.id,
      adminNote: `Article change failed: ${error instanceof Error ? error.message : String(error)}`,
    });
  }

  redirect("/admin/suggestions");
}

export async function rejectArticleSuggestion(suggestionId: string, formData: FormData) {
  const admin = await requireAdmin();
  const adminNote = String(formData.get("adminNote") ?? "").trim();
  await rejectLawSuggestion({ suggestionId, adminUserId: admin.id, adminNote: adminNote || null });
  redirect("/admin/suggestions");
}

export async function getSuggestionPageData() {
  const user = await requireUser();
  const [laws, suggestions] = await Promise.all([
    listLawDocuments(),
    listUserLawSuggestions(user.id),
  ]);
  const fullLaws = await Promise.all(laws.map((law) => getLawDocument(law.id)));
  return { user, laws: fullLaws.filter((law): law is NonNullable<typeof law> => law !== null), suggestions };
}

export async function getAdminSuggestionPageData() {
  await requireAdmin();
  return listLawSuggestions("PENDING");
}
