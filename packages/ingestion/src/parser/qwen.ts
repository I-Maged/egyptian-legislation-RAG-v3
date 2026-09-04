import fs from "node:fs";
import {
  canonicalArticleNumber,
  normalizeArabicText,
  normalizeForEmbedding,
} from "./arabic.js";
import type {
  LawIdentity,
  LawProfile,
  ParsedArticle,
  QwenOCRRecord,
  SourceType,
} from "./types.js";

export type QwenInputKind =
  | "qwen-record-array"
  | "qwen-record-object"
  | "legacy-parser-output"
  | "legacy-adapted";

export interface ParsedQwenInput {
  records: InternalRecord[];
  originalCount: number;
  identities: Map<number, LawIdentity>;
  inputKind: QwenInputKind;
}

export interface InternalRecord extends QwenOCRRecord {
  sourceType: SourceType;
  originalIndex: number;
  internalId: string;
  sortKey: number;
}

interface RawJson {
  records?: unknown;
  articles?: unknown;
  metadata?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isQwenRecord(value: unknown): value is QwenOCRRecord {
  if (!isRecord(value)) return false;
  return (
    typeof value.article_number === "string" &&
    typeof value.page_number === "number" &&
    typeof value.text === "string"
  );
}

function looksLikeLegacyArticle(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    "articleNumber" in value &&
    "pageStart" in value &&
    "sourceRecordIds" in value
  );
}

function readJson(path: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(path, "utf8")) as unknown;
  } catch (error) {
    throw new Error(
      `Failed to read JSON ${path}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function readRecords(path: string): {
  records: QwenOCRRecord[];
  originalCount: number;
  inputKind: QwenInputKind;
} {
  const value = readJson(path);
  if (Array.isArray(value)) {
    if (value.some((item) => looksLikeLegacyArticle(item))) {
      throw new Error(
        `The file ${path} contains legacy Parser V2/V2.3 article objects, not the original Qwen records. ` +
          `Pass the original Qwen JSON (article_number/page_number/text), or explicitly use --legacy-raw for a diagnostic-only import.`,
      );
    }
    const records = value.filter(isQwenRecord);
    if (records.length !== value.length)
      throw new Error(
        `Unsupported Qwen record shape in ${path}: expected article_number, page_number and text on every record.`,
      );
    return {
      records,
      originalCount: records.length,
      inputKind: "qwen-record-array",
    };
  }

  if (!isRecord(value)) throw new Error(`Unsupported Qwen JSON shape: ${path}`);
  const object = value as RawJson;

  if (Array.isArray(object.records)) {
    const records = object.records.filter(isQwenRecord);
    if (records.length !== object.records.length)
      throw new Error(
        `Unsupported Qwen record shape in ${path}: expected article_number, page_number and text on every record.`,
      );
    return {
      records,
      originalCount: records.length,
      inputKind: "qwen-record-object",
    };
  }

  if (Array.isArray(object.articles)) {
    if (object.articles.some(looksLikeLegacyArticle)) {
      throw new Error(
        `The file ${path} is a Parser V2/V2.3 output. It cannot safely be reconstructed as original Qwen records. ` +
          `Use the original Qwen JSON instead, or pass --legacy-raw for a diagnostic-only import.`,
      );
    }
    const records = object.articles.filter(isQwenRecord);
    if (records.length !== object.articles.length)
      throw new Error(`Unsupported Qwen article record shape in ${path}.`);
    return {
      records,
      originalCount: records.length,
      inputKind: "qwen-record-object",
    };
  }

  throw new Error(`Unsupported Qwen JSON shape: ${path}`);
}

function readLegacyArticles(path: string): ParsedArticle[] {
  const value = readJson(path);
  if (!isRecord(value) || !Array.isArray(value.articles))
    throw new Error(
      `Expected a Parser V2/V2.3 output containing an articles array: ${path}`,
    );
  const articles = value.articles;
  if (
    !articles.every(
      (x) =>
        isRecord(x) &&
        typeof x.articleNumber === "string" &&
        typeof x.text === "string",
    )
  ) {
    throw new Error(`Unsupported legacy parser output: ${path}`);
  }
  return articles as ParsedArticle[];
}

function canSafelyAdaptLegacyArticles(
  articles: ParsedArticle[],
  profile: LawProfile,
): boolean {
  if (profile.identities.length !== 1 || articles.length === 0) return false;

  const numbers = articles.map((a) => canonicalArticleNumber(a.articleNumber));
  if (numbers.some((n) => !/^\d+$/.test(n))) return false;
  if (new Set(numbers).size !== numbers.length) return false;

  const numeric = numbers.map(Number);
  for (let i = 1; i < numeric.length; i++) {
    if (numeric[i]! < numeric[i - 1]!) return false;
  }

  if (
    articles.some(
      (a) => a.pageStart <= 0 || a.pageEnd < a.pageStart || !a.text.trim(),
    )
  )
    return false;
  return true;
}

function adaptLegacyArticles(
  articles: ParsedArticle[],
  profile: LawProfile,
): ParsedArticle[] {
  const identity = profile.defaultIdentity;
  return articles
    .slice()
    .sort(
      (a, b) =>
        a.sourceOrder - b.sourceOrder ||
        a.pageStart - b.pageStart ||
        canonicalArticleNumber(a.articleNumber).localeCompare(
          canonicalArticleNumber(b.articleNumber),
          undefined,
          { numeric: true },
        ),
    )
    .map((article, index) => {
      // Metadata warnings from V2/V2.3 are stale because V3 resolves identity
      // from the authoritative profile. Preserve all other review signals.
      const reviewReasons = (article.reviewReasons ?? []).filter(
        (reason) =>
          !/^Law number is unknown in the Qwen record\.$/i.test(reason) &&
          !/^Law year is unknown in the Qwen record\.$/i.test(reason),
      );
      return {
        ...article,
        instrumentId: identity.id,
        lawName: identity.lawName,
        lawNumber: identity.lawNumber || null,
        year: identity.year || null,
        articleNumber: canonicalArticleNumber(article.articleNumber),
        articleNumberNormalized: /^\d+$/.test(
          canonicalArticleNumber(article.articleNumber),
        )
          ? Number(canonicalArticleNumber(article.articleNumber))
          : null,
        sourceOrder: Number.isFinite(article.sourceOrder)
          ? article.sourceOrder
          : index,
        source: "vision_ocr",
        needsReview: reviewReasons.length > 0,
        reviewReasons,
      };
    });
}

export function parseInputFile(
  path: string,
  profile: LawProfile,
): {
  kind: QwenInputKind;
  records: InternalRecord[];
  articles?: ParsedArticle[];
  originalCount: number;
} {
  try {
    const parsed = parseQwenFile(path, profile);
    return {
      kind: parsed.inputKind,
      records: parsed.records,
      originalCount: parsed.originalCount,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/Parser V2\/V2\.3 output/.test(message)) throw error;

    const legacy = readLegacyArticles(path);
    if (!canSafelyAdaptLegacyArticles(legacy, profile)) {
      throw new Error(
        `The file ${path} is Parser V2/V2.3 output, but it is not safe to adapt automatically for profile \"${profile.id}\". ` +
          `The file may contain merged/repeated article boundaries. Use the original Qwen JSON for the authoritative V3 run.`,
      );
    }
    return {
      kind: "legacy-adapted",
      records: [],
      articles: adaptLegacyArticles(legacy, profile),
      originalCount: legacy.length,
    };
  }
}

function toInternal(
  records: QwenOCRRecord[],
  sourceType: SourceType,
  prefix: string,
  startIndex = 0,
): InternalRecord[] {
  return records
    .map((r, i) => ({
      ...r,
      sourceType,
      originalIndex: startIndex + i,
      internalId:
        r.record_id ?? `${prefix}:${i}:${r.page_number}:${r.article_number}`,
      sortKey: startIndex + i,
    }))
    .filter(
      (r) =>
        Number.isInteger(r.page_number) &&
        r.page_number > 0 &&
        !!r.text?.trim() &&
        !!r.article_number,
    );
}

function cleanText(text: string): string {
  const lines = normalizeArabicText(text).split(/\n+/);
  const out: string[] = [];
  for (const line of lines) {
    if (!line) continue;
    if (out.at(-1) === line) continue;
    out.push(line);
  }
  return out.join("\n").trim();
}

function numericArticleNumber(value: string): number | null {
  const canonical = canonicalArticleNumber(value);
  return /^\d+$/.test(canonical) ? Number(canonical) : null;
}

function assignIdentities(
  records: InternalRecord[],
  profile: LawProfile,
): Map<number, LawIdentity> {
  const result = new Map<number, LawIdentity>();
  let currentIndex = 0;
  const pageOccurrence = new Map<number, Map<string, number>>();
  let previous: { page: number; key: string; occurrence: number } | null = null;

  for (const record of records) {
    const key = canonicalArticleNumber(record.article_number);
    const byNumber =
      pageOccurrence.get(record.page_number) ?? new Map<string, number>();
    const occurrence = (byNumber.get(key) ?? 0) + 1;
    byNumber.set(key, occurrence);
    pageOccurrence.set(record.page_number, byNumber);

    while (currentIndex + 1 < profile.identities.length) {
      const next = profile.identities[currentIndex + 1]!;
      const transition = next.startAfter;
      if (!transition) {
        if (record.page_number >= next.startPage) currentIndex++;
        else break;
        continue;
      }

      if (record.page_number > transition.page) {
        currentIndex++;
        continue;
      }
      if (record.page_number < transition.page) break;

      const transitionOccurrence = transition.occurrenceOnPage ?? 1;
      const previousIsTransition =
        previous &&
        previous.page === transition.page &&
        previous.key === transition.articleNumber &&
        previous.occurrence >= transitionOccurrence;

      if (previousIsTransition) {
        currentIndex++;
        continue;
      }
      break;
    }

    result.set(record.originalIndex, profile.identities[currentIndex]!);
    previous = { page: record.page_number, key, occurrence };
  }

  return result;
}

function sameArticle(
  a: InternalRecord,
  b: InternalRecord,
  identities: Map<number, LawIdentity>,
): boolean {
  const ia = identities.get(a.originalIndex);
  const ib = identities.get(b.originalIndex);
  if (!ia || !ib || ia.id !== ib.id) return false;
  return (
    canonicalArticleNumber(a.article_number) ===
      canonicalArticleNumber(b.article_number) && b.sortKey === a.sortKey + 1
  );
}

export function parseQwenFile(
  path: string,
  profile: LawProfile,
): ParsedQwenInput {
  const raw = readRecords(path);
  const records = toInternal(raw.records, "vision_ocr", "qwen");
  return {
    records,
    originalCount: raw.originalCount,
    identities: assignIdentities(records, profile),
    inputKind: raw.inputKind,
  };
}

/**
 * Explicitly imports a V2/V2.3 parser output for inspection only.
 * It does not attempt to reconstruct the original Qwen record stream.
 */
export function readLegacyParserOutput(
  path: string,
  profile: LawProfile,
): ParsedArticle[] {
  const articles = readLegacyArticles(path);
  return articles.map((article, index) => {
    const identity =
      profile.identities.find((x) => x.id === article.instrumentId) ??
      profile.identities.find(
        (x) =>
          article.pageStart >= x.startPage && article.pageStart <= x.endPage,
      ) ??
      profile.defaultIdentity;
    return {
      ...article,
      instrumentId: identity.id,
      lawName: identity.lawName,
      lawNumber: identity.lawNumber || null,
      year: identity.year || null,
      sourceOrder: Number.isFinite(article.sourceOrder)
        ? article.sourceOrder
        : index,
      source: "vision_ocr",
      needsReview: true,
      reviewReasons: [
        ...new Set([
          ...article.reviewReasons,
          "Imported from legacy Parser V2/V2.3 output; article boundaries cannot be reconstructed safely.",
        ]),
      ],
    };
  });
}

export function parseRecoveryFile(
  path: string,
  startIndex: number,
): InternalRecord[] {
  const value = readJson(path);
  const raw = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.records)
      ? value.records
      : null;
  if (!raw) throw new Error(`Unsupported recovery JSON shape: ${path}`);
  const records = raw.filter(isQwenRecord);
  if (records.length !== raw.length)
    throw new Error(`Unsupported recovery record shape in ${path}.`);
  return toInternal(records, "vision_ocr_recovery", "recovery", startIndex);
}

/**
 * Inserts recovery records into the Qwen stream using PDF page position without
 * re-sorting the original Qwen records. This matters for multi-instrument PDFs
 * where article numbers legitimately restart at 1.
 */
export function mergeRecoveryRecords(
  qwen: InternalRecord[],
  recovery: InternalRecord[],
): InternalRecord[] {
  if (!recovery.length) return [...qwen];
  const merged = [...qwen];
  for (const rec of recovery) {
    const existingIndex = merged.findIndex(
      (x) =>
        x.page_number === rec.page_number &&
        canonicalArticleNumber(x.article_number) ===
          canonicalArticleNumber(rec.article_number),
    );

    if (existingIndex >= 0) {
      // Explicit recovery OCR is authoritative for a targeted page/article
      // position. This lets recovery repair a corrupted Qwen record without
      // changing the rest of the original stream.
      merged[existingIndex] = rec;
      continue;
    }

    // Find the beginning of the target page, not the first record after it.
    // Recovery records commonly belong in the middle of a page that already
    // contains Qwen records (e.g. Article 1 before Article 2). Starting at the
    // first later page would append the recovery record to the end of the page
    // and break article contiguity / identity transitions.
    let pageStart = merged.findIndex((x) => x.page_number >= rec.page_number);
    if (pageStart < 0) pageStart = merged.length;

    let pageEnd = pageStart;
    while (
      pageEnd < merged.length &&
      merged[pageEnd]!.page_number === rec.page_number
    ) {
      pageEnd++;
    }

    let insertAt = pageEnd;
    const targetNumber = numericArticleNumber(rec.article_number);
    if (targetNumber !== null) {
      for (let i = pageStart; i < pageEnd; i++) {
        const n = numericArticleNumber(merged[i]!.article_number);
        if (n !== null && n > targetNumber) {
          insertAt = i;
          break;
        }
      }
    }
    merged.splice(insertAt, 0, rec);
  }

  // Reindex the merged stream so contiguity is based on actual stream position.
  return merged.map((record, index) => ({
    ...record,
    originalIndex: index,
    sortKey: index,
  }));
}

export function reassignIdentities(
  records: InternalRecord[],
  profile: LawProfile,
): Map<number, LawIdentity> {
  return assignIdentities(records, profile);
}

export function buildArticlesFromQwen(
  records: InternalRecord[],
  profile: LawProfile,
  identities: Map<number, LawIdentity>,
): ParsedArticle[] {
  const out: ParsedArticle[] = [];
  let current: InternalRecord[] = [];
  const flush = () => {
    if (!current.length) return;
    const first = current[0]!;
    const id = identities.get(first.originalIndex) ?? profile.defaultIdentity;
    const texts = current.map((r) => cleanText(r.text)).filter(Boolean);
    const pages = [...new Set(current.map((r) => r.page_number))].sort(
      (a, b) => a - b,
    );
    const parsed = current[0]!.article_number;
    const articleNumber = canonicalArticleNumber(parsed);
    const suffix =
      normalizeArabicText(parsed)
        .replace(/^\D*\d+/, "")
        .trim() || null;
    const reasons: string[] = [];
    if (pages.length > 1) {
      for (let i = 1; i < pages.length; i++)
        if (pages[i]! > pages[i - 1]! + 1)
          reasons.push(`Non-contiguous pages: ${pages.join(", ")}`);
    }
    if (texts.join("\n\n").length > 5000)
      reasons.push(`Long article (${texts.join("\n\n").length} characters).`);
    out.push({
      instrumentId: id.id,
      lawName: id.lawName,
      lawNumber: id.lawNumber || null,
      year: id.year || null,
      articleNumber,
      articleNumberNormalized: /^\d+$/.test(articleNumber)
        ? Number(articleNumber)
        : null,
      articleSuffix: suffix,
      chapter: current.map((r) => r.chapter ?? "").find(Boolean) ?? null,
      text: texts.join("\n\n"),
      textForEmbedding: normalizeForEmbedding(texts.join("\n\n")),
      pageStart: pages[0]!,
      pageEnd: pages.at(-1)!,
      pages,
      sourceOrder: first.sortKey,
      source: current.some((r) => r.sourceType === "vision_ocr_recovery")
        ? "vision_ocr_recovery"
        : "vision_ocr",
      sourceRecordIds: current.map((r) => r.internalId),
      qwenRecordCount: current.filter((r) => r.sourceType === "vision_ocr")
        .length,
      recoveryRecordCount: current.filter((r) => r.sourceType !== "vision_ocr")
        .length,
      needsReview:
        reasons.length > 0 ||
        current.some((r) => r.sourceType === "vision_ocr_recovery"),
      reviewReasons: current.some((r) => r.sourceType === "vision_ocr_recovery")
        ? [
            ...reasons,
            "Article includes explicit recovery OCR input; verify OCR fidelity before indexing.",
          ]
        : reasons,
    });
    current = [];
  };

  for (const record of records) {
    const previous = current.at(-1);
    if (!previous || sameArticle(previous, record, identities))
      current.push(record);
    else {
      flush();
      current.push(record);
    }
  }
  flush();
  return out.sort((a, b) => a.sourceOrder - b.sourceOrder);
}
