-- Article numbers are not globally unique within a legal document.
-- Compiled instruments can contain a wrapper law whose articles restart
-- numbering in an attached/subordinate instrument. The chunk primary key
-- is the unique chunk identity; article_number remains a searchable field.
DROP INDEX IF EXISTS "law_chunks_document_id_article_number_key";
