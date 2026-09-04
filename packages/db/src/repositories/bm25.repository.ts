import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../client";

export interface Bm25SearchInput {
  query: string;
  topK: number;
  lawDocumentId?: string;
}

export interface Bm25SearchResult {
  chunkId: string;
  score: number;
}

/**
 * Conservative Arabic stopword list.
 *
 * These words are common in natural-language questions but usually
 * provide little lexical retrieval value.
 */
const ARABIC_STOPWORDS = new Set([
  "ما",
  "ماذا",
  "هل",
  "هي",
  "هو",
  "هم",
  "هن",
  "هذا",
  "هذه",
  "ذلك",
  "تلك",
  "من",
  "في",
  "إلى",
  "على",
  "عن",
  "مع",
  "و",
  "أو",
  "ثم",
  "أن",
  "إن",
  "لا",
  "لم",
  "لن",
  "قد",
  "كان",
  "كانت",
  "يكون",
  "تكون",
]);

/**
 * Tokenize a natural-language Arabic query into lexical terms.
 *
 * Example:
 *
 *   ما هي مدة فترة الاختبار في عقد العمل؟
 *
 * becomes:
 *
 *   ["مدة", "فترة", "الاختبار", "عقد", "العمل"]
 */
function tokenizeQuery(query: string): string[] {
  return query
    .trim()
    .split(/\s+/)
    .map((token) => token.replace(/[؟?!،,.;:()[\]{}"'`]/g, "").trim())
    .filter((token) => token.length > 0)
    .filter((token) => !ARABIC_STOPWORDS.has(token));
}

/**
 * Build the value passed to PostgreSQL to_tsquery().
 *
 * PostgreSQL's `to_tsquery` supports the `|` operator for OR:
 *
 *   مدة | فترة | الاختبار | عقد | العمل
 *
 * The individual terms have already been stripped of characters
 * that could be interpreted as tsquery operators.
 */
function buildOrTsQuery(query: string): string {
  const terms = tokenizeQuery(query);

  return terms.join(" | ");
}

export async function searchBm25(
  input: Bm25SearchInput,
): Promise<Bm25SearchResult[]> {
  const query = input.query.trim();

  if (!query) {
    return [];
  }

  if (!Number.isInteger(input.topK) || input.topK <= 0) {
    throw new Error(`Invalid topK: ${input.topK}`);
  }

  const lexicalQuery = buildOrTsQuery(query);

  /**
   * The query may consist entirely of stopwords.
   *
   * Example:
   *
   *   "ما هي"
   *
   * produces no useful lexical terms.
   */
  if (!lexicalQuery) {
    return [];
  }

  if (input.lawDocumentId !== undefined) {
    return prisma.$queryRaw<Bm25SearchResult[]>(
      Prisma.sql`
        SELECT
          c."id" AS "chunkId",

          ts_rank_cd(
            to_tsvector(
              'simple',
              c."text_for_embedding"
            ),
            to_tsquery(
              'simple',
              ${lexicalQuery}
            )
          )::double precision AS "score"

        FROM "law_chunks" c

        WHERE
          c."document_id" = ${input.lawDocumentId}

          AND to_tsvector(
            'simple',
            c."text_for_embedding"
          ) @@ to_tsquery(
            'simple',
            ${lexicalQuery}
          )

        ORDER BY
          "score" DESC,
          c."id" ASC

        LIMIT ${input.topK}
      `,
    );
  }

  return prisma.$queryRaw<Bm25SearchResult[]>(
    Prisma.sql`
      SELECT
        c."id" AS "chunkId",

        ts_rank_cd(
          to_tsvector(
            'simple',
            c."text_for_embedding"
          ),
          to_tsquery(
            'simple',
            ${lexicalQuery}
          )
        )::double precision AS "score"

      FROM "law_chunks" c

      WHERE
        to_tsvector(
          'simple',
          c."text_for_embedding"
        ) @@ to_tsquery(
          'simple',
          ${lexicalQuery}
        )

      ORDER BY
        "score" DESC,
        c."id" ASC

      LIMIT ${input.topK}
    `,
  );
}
