import type { PersonalAffairsParserArticle } from "./personal-affairs";

export function reconstructPersonalAffairsArticles(
  articles: PersonalAffairsParserArticle[],
): PersonalAffairsParserArticle[] {
  if (articles.length === 0) {
    return [];
  }

  const result: PersonalAffairsParserArticle[] = [];

  let current: PersonalAffairsParserArticle | null = null;

  for (const article of articles) {
    if (current === null) {
      current = cloneArticle(article);
      continue;
    }

    /*
     * Only merge records when they are consecutive and represent
     * the same article within the same structural context.
     *
     * Article number alone is NOT sufficient because numbers such as
     * "1", "2", "3", etc. legitimately repeat in different sections.
     */
    const sameArticle =
      current.articleNumber === article.articleNumber &&
      current.chapter === article.chapter;

    if (sameArticle) {
      current = mergeArticles(current, article);
    } else {
      result.push(current);
      current = cloneArticle(article);
    }
  }

  if (current !== null) {
    result.push(current);
  }

  return result;
}

function cloneArticle(
  article: PersonalAffairsParserArticle,
): PersonalAffairsParserArticle {
  return {
    ...article,

    ...(article.pages && { pages: [...article.pages] }),

    ...(article.sourceRecordIds && {
      sourceRecordIds: [...article.sourceRecordIds],
    }),

    ...(article.reviewReasons && { reviewReasons: [...article.reviewReasons] }),
  };
}

function mergeArticles(
  first: PersonalAffairsParserArticle,
  next: PersonalAffairsParserArticle,
): PersonalAffairsParserArticle {
  const sourceRecordIds = unique([
    ...(first.sourceRecordIds ?? []),
    ...(next.sourceRecordIds ?? []),
  ]);

  const pages = unique([...(first.pages ?? []), ...(next.pages ?? [])]).sort(
    (a, b) => a - b,
  );

  return {
    ...first,

    /*
     * Preserve the first record's identity/order.
     */
    ...(first.sourceOrder !== undefined && { sourceOrder: first.sourceOrder }),

    /*
     * Preserve the complete article text in parser order.
     */
    text: joinText(first.text, next.text),

    textForEmbedding: joinText(first.textForEmbedding, next.textForEmbedding),

    /*
     * Expand provenance.
     */
    pageStart: Math.min(first.pageStart ?? Number.POSITIVE_INFINITY, next.pageStart ?? Number.POSITIVE_INFINITY),

    pageEnd: Math.max(first.pageEnd ?? 0, next.pageEnd ?? 0),

    ...(pages.length > 0 && { pages }),

    ...(sourceRecordIds.length > 0 && { sourceRecordIds }),

    qwenRecordCount: (first.qwenRecordCount ?? 0) + (next.qwenRecordCount ?? 0),

    recoveryRecordCount:
      (first.recoveryRecordCount ?? 0) + (next.recoveryRecordCount ?? 0),

    needsReview: first.needsReview === true || next.needsReview === true,

    reviewReasons: unique([
      ...(first.reviewReasons ?? []),
      ...(next.reviewReasons ?? []),
    ]),
  };
}

function joinText(first: string, second: string): string {
  if (!first.trim()) {
    return second;
  }

  if (!second.trim()) {
    return first;
  }

  return `${first.trim()}\n${second.trim()}`;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

