-- Complete article-level HITL workflow.
ALTER TYPE "SuggestionType" ADD VALUE IF NOT EXISTS 'ADD_ARTICLE';
ALTER TYPE "SuggestionStatus" ADD VALUE IF NOT EXISTS 'APPLIED';
ALTER TYPE "SuggestionStatus" ADD VALUE IF NOT EXISTS 'FAILED';

ALTER TABLE "law_suggestions"
  ADD COLUMN "proposed_article_number" TEXT,
  ADD COLUMN "proposed_article_title" TEXT;
