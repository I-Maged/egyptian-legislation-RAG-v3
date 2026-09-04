export type SourceType =
  | "vision_ocr"
  | "vision_ocr_recovery"
  | "pdf_text_recovery";

export interface QwenOCRRecord {
  law_name?: string | null;
  law_number?: string | null;
  year?: string | null;
  article_number: string;
  chapter?: string | null;
  text: string;
  text_for_embedding?: string | null;
  page_number: number;
  source?: string | null;
  record_id?: string | null;
}

export interface LawIdentity {
  id: string;
  lawName: string;
  lawNumber: string;
  year: string;
  kind: "law" | "decree_law" | "ministerial_decision";
  title: string;
  startPage: number;
  endPage: number;
  startMarkerOrdinal?: number;
  startAfter?: {
    page: number;
    articleNumber: string;
    occurrenceOnPage?: number;
  };
}

export interface PdfRecoveryPolicy {
  enabled: boolean;
  requireUniqueAnchor: boolean;
  requiresReview: boolean;
}

export interface LawProfile {
  id: string;
  displayName: string;
  sourceFilePattern: RegExp;
  defaultIdentity: LawIdentity;
  identities: LawIdentity[];
  pdfRecovery?: PdfRecoveryPolicy;
}

export interface PdfPage {
  pageNumber: number;
  text: string;
  lines: string[];
}

export interface ArticleAnchor {
  pageNumber: number;
  lineIndex: number;
  ordinalOnPage: number;
  rawLabel: string;
  articleNumber: string;
  suffix: string | null;
}

export interface ParsedArticle {
  instrumentId: string;
  lawName: string;
  lawNumber: string | null;
  year: string | null;
  articleNumber: string;
  articleNumberNormalized: number | null;
  articleSuffix: string | null;
  chapter: string | null;
  text: string;
  textForEmbedding: string;
  pageStart: number;
  pageEnd: number;
  pages: number[];
  sourceOrder: number;
  source: SourceType;
  sourceRecordIds: string[];
  qwenRecordCount: number;
  recoveryRecordCount: number;
  needsReview: boolean;
  reviewReasons: string[];
}

export interface ValidationIssue {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  articleNumber?: string;
  pageNumber?: number;
  instrumentId?: string;
}

export interface ParserOutput {
  metadata: {
    parserVersion: string;
    inputFile: string | null;
    pdfFile: string;
    generatedAt: string;
    recordCountOriginal: number;
    recordCountRecovery: number;
    recordCountMerged: number;
    pdfRecoveryArticleCount?: number;
    instrumentId: string | null;
    mode: "qwen+pdf" | "pdf-only";
  };
  metadataResolved: {
    lawName: string | null;
    lawNumber: string | null;
    year: string | null;
  };
  instruments: LawIdentity[];
  articles: ParsedArticle[];
  coverage: {
    pdfPageCount: number;
    articleAnchorCount: number;
    qwenRecordCount: number;
    pdfOnlyArticleCount: number;
    pdfRecoveredArticleCount?: number;
    missingArticleNumbers: Array<{
      instrumentId: string;
      articleNumbers: string[];
    }>;
    suspiciousArticleCount: number;
  };
  validation: {
    issues: ValidationIssue[];
    summary: {
      errors: number;
      warnings: number;
      infos: number;
      articleCount: number;
      qwenRecordCount: number;
      recoveryRecordCount: number;
      suspiciousMergeCount: number;
      missingArticleNumberCount: number;
    };
  };
}
