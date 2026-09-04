"use server";

import { redirect } from "next/navigation";
import {
  createLawChunk,
  createLawDocument,
  updateLawChunk,
  updateLawDocument,
} from "@egyptian-law/db";

import { parseArticles } from "@/lib/utils/parse-articles";

export async function createLaw(formData: FormData) {
  const id = crypto.randomUUID();

  const lawName = String(formData.get("lawName") ?? "").trim();

  const lawNumber = String(formData.get("lawNumber") ?? "").trim();

  const year = String(formData.get("year") ?? "").trim();

  const sourceFile = String(formData.get("sourceFile") ?? "").trim();

  const articlesRaw = String(formData.get("articles") ?? "");

  if (!lawName || !sourceFile) {
    throw new Error("Law name and source file are required.");
  }

  await createLawDocument({
    id,
    lawName,
    lawNumber: lawNumber || null,
    year: year || null,
    sourceFile,
    jurisdiction: "EG",
    language: "ar",
  });

  const articles = parseArticles(articlesRaw);

  for (const [index, article] of articles.entries()) {
    await createLawChunk(id, {
      id: crypto.randomUUID(),
      articleNumber: article.articleNumber,
      articleTitle: null,
      text: article.text,
      textForEmbedding: article.text,
      sourceOrder: index,
    });
  }

  redirect(`/admin/laws/${id}`);
}

export async function updateLaw(id: string, formData: FormData) {
  const lawName = String(formData.get("lawName") ?? "").trim();

  const lawNumber = String(formData.get("lawNumber") ?? "").trim();

  const year = String(formData.get("year") ?? "").trim();

  const sourceFile = String(formData.get("sourceFile") ?? "").trim();

  await updateLawDocument(id, {
    lawName,
    lawNumber: lawNumber || null,
    year: year || null,
    sourceFile,
    jurisdiction: "EG",
    language: "ar",
  });

  redirect(`/admin/laws/${id}`);
}

export async function saveChunk(
  chunkId: string,
  documentId: string,
  formData: FormData,
) {
  const articleNumber = String(formData.get("articleNumber") ?? "").trim();

  const articleTitle = String(formData.get("articleTitle") ?? "").trim();

  const text = String(formData.get("text") ?? "").trim();

  await updateLawChunk(chunkId, {
    articleNumber,
    articleTitle: articleTitle || null,
    text,
    textForEmbedding: text,
  });

  redirect(`/admin/laws/${documentId}`);
}
