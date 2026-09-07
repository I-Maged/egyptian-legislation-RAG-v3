"use server";

import { redirect } from "next/navigation";
import {
  applyArticleChange,
  createLawChunk,
  createLawDocument,
  updateLawDocument,
} from "@egyptian-law/db";
import { OllamaEmbeddingProvider } from "@egyptian-law/ingestion";

import { getCurrentUser } from "@/lib/auth/session";
import { parseArticles } from "@/lib/utils/parse-articles";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Admin access required.");
  return user;
}

const embedder = new OllamaEmbeddingProvider({ model: "bge-m3", dimensions: 1024 });

export async function createLaw(formData: FormData) {
  const admin = await requireAdmin();
  const id = crypto.randomUUID();
  const lawName = String(formData.get("lawName") ?? "").trim();
  const lawNumber = String(formData.get("lawNumber") ?? "").trim();
  const year = String(formData.get("year") ?? "").trim();
  const sourceFile = String(formData.get("sourceFile") ?? "").trim();
  const articlesRaw = String(formData.get("articles") ?? "");
  if (!lawName || !sourceFile) throw new Error("Law name and source file are required.");

  await createLawDocument({ id, lawName, lawNumber: lawNumber || null, year: year || null, sourceFile, jurisdiction: "EG", language: "ar" });
  const articles = parseArticles(articlesRaw);
  for (const [index, article] of articles.entries()) {
    await createLawChunk(id, {
      id: crypto.randomUUID(), articleNumber: article.articleNumber, articleTitle: null,
      text: article.text, textForEmbedding: article.text, sourceOrder: index,
    });
  }
  void admin;
  redirect(`/admin/laws/${id}`);
}

export async function updateLaw(id: string, formData: FormData) {
  await requireAdmin();
  const lawName = String(formData.get("lawName") ?? "").trim();
  const lawNumber = String(formData.get("lawNumber") ?? "").trim();
  const year = String(formData.get("year") ?? "").trim();
  const sourceFile = String(formData.get("sourceFile") ?? "").trim();
  await updateLawDocument(id, { lawName, lawNumber: lawNumber || null, year: year || null, sourceFile, jurisdiction: "EG", language: "ar" });
  redirect(`/admin/laws/${id}`);
}

export async function saveChunk(chunkId: string, documentId: string, formData: FormData) {
  const admin = await requireAdmin();
  const articleNumber = String(formData.get("articleNumber") ?? "").trim();
  const articleTitle = String(formData.get("articleTitle") ?? "").trim();
  const text = String(formData.get("text") ?? "").trim();
  if (!articleNumber || !text) throw new Error("Article number and text are required.");

  const [embedding] = await embedder.embed([text]);
  if (!embedding) throw new Error("Embedding generation returned no vector.");
  await applyArticleChange({
    mode: "update", documentId, chunkId, articleNumber, articleTitle: articleTitle || null,
    text, embedding, embeddingModel: embedder.model, embeddingDimensions: embedder.dimensions,
    actorUserId: admin.id,
  });
  redirect(`/admin/laws/${documentId}`);
}

export async function addArticle(documentId: string, formData: FormData) {
  const admin = await requireAdmin();
  const articleNumber = String(formData.get("articleNumber") ?? "").trim();
  const articleTitle = String(formData.get("articleTitle") ?? "").trim();
  const text = String(formData.get("text") ?? "").trim();
  if (!articleNumber || !text) throw new Error("Article number and text are required.");

  const [embedding] = await embedder.embed([text]);
  if (!embedding) throw new Error("Embedding generation returned no vector.");
  await applyArticleChange({
    mode: "create", documentId, articleNumber, articleTitle: articleTitle || null,
    text, embedding, embeddingModel: embedder.model, embeddingDimensions: embedder.dimensions,
    actorUserId: admin.id,
  });
  redirect(`/admin/laws/${documentId}`);
}
