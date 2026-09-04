CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE
    "law_documents" (
        "id" TEXT NOT NULL,
        "law_name" TEXT NOT NULL,
        "law_number" TEXT,
        "year" TEXT,
        "jurisdiction" TEXT NOT NULL,
        "language" TEXT NOT NULL,
        "source_file" TEXT NOT NULL,
        "parser_version" TEXT,
        "normalization_version" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "law_documents_pkey" PRIMARY KEY ("id")
    );

-- CreateTable
CREATE TABLE
    "law_chunks" (
        "id" TEXT NOT NULL,
        "document_id" TEXT NOT NULL,
        "article_number" TEXT NOT NULL,
        "article_title" TEXT,
        "text" TEXT NOT NULL,
        "text_for_embedding" TEXT NOT NULL,
        "source_page_start" INTEGER,
        "source_page_end" INTEGER,
        "source_order" INTEGER,
        "hierarchy" JSONB,
        "parser_version" TEXT,
        "normalization_version" TEXT,
        "ocr_confidence" DOUBLE PRECISION,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "law_chunks_pkey" PRIMARY KEY ("id")
    );

-- CreateTable
CREATE TABLE
    "law_chunk_embeddings" (
        "chunk_id" TEXT NOT NULL,
        "model" TEXT NOT NULL,
        "dimensions" INTEGER NOT NULL,
        "embedding" vector (1024) NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "law_chunk_embeddings_pkey" PRIMARY KEY ("chunk_id")
    );

-- CreateIndex
CREATE INDEX "law_documents_law_name_idx" ON "law_documents" ("law_name");

-- CreateIndex
CREATE INDEX "law_documents_law_number_idx" ON "law_documents" ("law_number");

-- CreateIndex
CREATE INDEX "law_documents_year_idx" ON "law_documents" ("year");

-- CreateIndex
CREATE INDEX "law_chunks_document_id_idx" ON "law_chunks" ("document_id");

-- CreateIndex
CREATE INDEX "law_chunks_article_number_idx" ON "law_chunks" ("article_number");

-- CreateIndex
CREATE UNIQUE INDEX "law_chunks_document_id_article_number_key" ON "law_chunks" ("document_id", "article_number");

-- AddForeignKey
ALTER TABLE "law_chunks" ADD CONSTRAINT "law_chunks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "law_documents" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "law_chunk_embeddings" ADD CONSTRAINT "law_chunk_embeddings_chunk_id_fkey" FOREIGN KEY ("chunk_id") REFERENCES "law_chunks" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "law_chunk_embeddings_embedding_hnsw_idx" ON "law_chunk_embeddings" USING hnsw ("embedding" vector_cosine_ops);