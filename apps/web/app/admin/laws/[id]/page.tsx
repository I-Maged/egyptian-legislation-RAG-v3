import { notFound } from "next/navigation";
import { getLawDocument } from "@egyptian-law/db";

import { saveChunk, updateLaw } from "@/app/admin/laws/actions";


export default async function LawPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const law = await getLawDocument(id);

  if (!law) {
    notFound();
  }

  return (
    <main className="admin-main">
      <h1>{law.lawName}</h1>

      <form action={updateLaw.bind(null, id)} className="law-form">
        <label>
          Law name
          <input name="lawName" defaultValue={law.lawName} required />
        </label>

        <label>
          Law number
          <input name="lawNumber" defaultValue={law.lawNumber ?? ""} />
        </label>

        <label>
          Year
          <input name="year" defaultValue={law.year ?? ""} />
        </label>

        <label>
          Source
          <input name="sourceFile" defaultValue={law.sourceFile} required />
        </label>

        <button type="submit">Save law</button>
      </form>

      <hr className="admin-divider" />

      <h2>Articles ({law.chunks.length})</h2>

      <div className="articles-list">
        {law.chunks.map((chunk) => (
          <ArticleEditor key={chunk.id} chunk={chunk} />
        ))}
      </div>
    </main>
  );
}

function ArticleEditor({
  chunk,
}: {
  chunk: NonNullable<
    Awaited<ReturnType<typeof getLawDocument>>
  >["chunks"][number];
}) {
  return (
    <form
      action={saveChunk.bind(null, chunk.id, chunk.documentId)}
      className="article-editor"
    >
      <label>
        Article
        <input name="articleNumber" defaultValue={chunk.articleNumber} />
      </label>

      <label>
        Title
        <input name="articleTitle" defaultValue={chunk.articleTitle ?? ""} />
      </label>

      <label>
        Text
        <textarea
          name="text"
          defaultValue={chunk.text}
          rows={10}
          className="article-textarea"
        />
      </label>

      <button type="submit">Save article</button>

      <div className="article-editor-meta">
        {chunk.embedding ? (
          <small>Embedded: {chunk.embedding.model}</small>
        ) : (
          <small>⚠️ No embedding</small>
        )}
      </div>
    </form>
  );
}
