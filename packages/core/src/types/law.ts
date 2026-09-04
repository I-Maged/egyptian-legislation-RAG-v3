export interface LawDocument {
  id: string;

  law_name: string;
  law_number: string | null;
  year: string | null;

  jurisdiction: "EG";
  language: "ar";

  source_file: string;

  metadata: {
    parser_version: string;
    normalization_version: string;
  };
}

export interface LawHierarchyNode {
  type: string;
  label: string;
  title: string | null;
}

export interface LawChunk {
  id: string;

  document_id: string;

  law_name: string;
  law_number: string | null;
  year: string | null;

  article_number: string;
  article_title: string | null;

  source_order: number | null;

  hierarchy: LawHierarchyNode[];

  text: string;
  text_for_embedding: string;

  provenance: {
    source_file: string;
    page_start: number | null;
    page_end: number | null;
  };

  metadata: {
    parser_version: string;
    normalization_version: string;
    ocr_confidence: number | null;
  };
}
