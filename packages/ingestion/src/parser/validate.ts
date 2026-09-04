import type {
  ArticleAnchor,
  LawIdentity,
  ParsedArticle,
  ValidationIssue,
} from "./types.js";

export function expectedArticleNumbers(identity: LawIdentity): number[] {
  const ranges: Record<string, number[]> = {
    "labour-law-14-2025": Array.from({ length: 298 }, (_, i) => i + 1),
    "financial-law-6-2022": Array.from({ length: 78 }, (_, i) => i + 1),
    "personal-law-25-1920": Array.from({ length: 13 }, (_, i) => i + 1),
    "personal-decree-25-1929": Array.from({ length: 25 }, (_, i) => i + 1),
    "inheritance-law-77-1943": Array.from({ length: 48 }, (_, i) => i + 1),
    "inheritance-application-law-35-1944": [1, 2],
    "wills-law-71-1946": Array.from({ length: 82 }, (_, i) => i + 1),
    "guardianship-person-decree-118-1952": Array.from(
      { length: 13 },
      (_, i) => i + 1,
    ),
    "guardianship-property-decree-119-1952": Array.from(
      { length: 88 },
      (_, i) => i + 1,
    ),
    "litigation-law-1-2000": Array.from({ length: 79 }, (_, i) => i + 1),
    "ministerial-decision-3269-1985": Array.from(
      { length: 11 },
      (_, i) => i + 1,
    ),
    "ministerial-decision-1086-2000": [1, 2],
    "ministerial-decision-1087-2000": Array.from(
      { length: 9 },
      (_, i) => i + 1,
    ),
    "ministerial-decision-1088-2000": Array.from(
      { length: 23 },
      (_, i) => i + 1,
    ),
    "ministerial-decision-1089-2000": Array.from(
      { length: 12 },
      (_, i) => i + 1,
    ),
    "ministerial-decision-1090-2000": Array.from(
      { length: 3 },
      (_, i) => i + 1,
    ),
  };
  return ranges[identity.id] ?? [];
}

export function validateArticles(
  articles: ParsedArticle[],
  identities: LawIdentity[],
  anchors: ArticleAnchor[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const article of articles) {
    if (!article.text.trim())
      issues.push({
        severity: "error",
        code: "EMPTY_ARTICLE",
        message: "Article text is empty.",
        articleNumber: article.articleNumber,
        instrumentId: article.instrumentId,
      });
    if (article.text.length > 5000)
      issues.push({
        severity: "warning",
        code: "LONG_ARTICLE",
        message: `Article has ${article.text.length} characters.`,
        articleNumber: article.articleNumber,
        instrumentId: article.instrumentId,
      });
    if (article.reviewReasons.length)
      issues.push({
        severity: "warning",
        code: "SUSPICIOUS_ARTICLE",
        message: article.reviewReasons.join(" "),
        articleNumber: article.articleNumber,
        instrumentId: article.instrumentId,
      });
  }
  for (const identity of identities) {
    const actual = new Set(
      articles
        .filter((a) => a.instrumentId === identity.id)
        .map((a) => a.articleNumber)
        .filter((x) => /^\d+$/.test(x))
        .map(Number),
    );
    const missing = expectedArticleNumbers(identity).filter(
      (n) => !actual.has(n),
    );
    if (missing.length)
      issues.push({
        severity: "warning",
        code: "MISSING_ARTICLES",
        message: `Missing expected article numbers: ${missing.join(", ")}`,
        instrumentId: identity.id,
      });
  }
  const byKey = new Map<string, ParsedArticle[]>();
  for (const a of articles) {
    const k = `${a.instrumentId}|${a.articleNumber}`;
    const arr = byKey.get(k) ?? [];
    arr.push(a);
    byKey.set(k, arr);
  }
  for (const [key, list] of byKey)
    if (list.length > 1)
      issues.push({
        severity: "info",
        code: "REPEATED_ARTICLE_NUMBER",
        message: `${key} occurs ${list.length} times; this can be legitimate for amended/repeated provisions.`,
        articleNumber: list[0]!.articleNumber,
        instrumentId: list[0]!.instrumentId,
      });
  if (anchors.length === 0)
    issues.push({
      severity: "warning",
      code: "NO_PDF_ARTICLE_ANCHORS",
      message: "No article markers were detected in the PDF text layer.",
    });
  return issues;
}
