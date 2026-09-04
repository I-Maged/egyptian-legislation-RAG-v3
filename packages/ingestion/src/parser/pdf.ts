import fs from "node:fs/promises";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import {
  canonicalArticleNumber,
  normalizeArabicText,
  normalizeDigits,
  normalizeForEmbedding,
} from "./arabic.js";
import type {
  ArticleAnchor,
  LawIdentity,
  LawProfile,
  ParsedArticle,
  PdfPage,
} from "./types.js";
import { expectedArticleNumbers } from "./validate.js";

const ORDINALS: Record<string, number> = {
  الأولى: 1,
  الثانية: 2,
  الثالثة: 3,
  الرابعة: 4,
  الخامسة: 5,
  السادسة: 6,
  السابعة: 7,
  الثامنة: 8,
  التاسعة: 9,
  العاشرة: 10,
  "الحادية عشرة": 11,
  الحادية_عشرة: 11,
  "الثانية عشرة": 12,
  الثانية_عشرة: 12,
  "الثالثة عشرة": 13,
  الثالثة_عشرة: 13,
};

interface PdfTextItemLike {
  str?: string;
  hasEOL?: boolean;
  transform?: number[];
}

function parseMarker(
  line: string,
): { number: string; suffix: string | null } | null {
  const x = normalizeArabicText(line).replace(/\s+/g, " ").trim();
  const compact = x.replace(/[ \t]+/g, "");

  let m = compact.match(/^(?:مادة|المادة)[:.)\-(]*([0-9٠-٩۰-۹]+)/i);
  if (m) {
    const rest = compact
      .slice(m[0].length)
      .replace(/[():،,.;\-]+/g, " ")
      .trim();
    return { number: normalizeDigits(m[1]!), suffix: rest || null };
  }

  const ordinalPattern = Object.keys(ORDINALS)
    .sort((a, b) => b.length - a.length)
    .map((x) => x.replace("_", " "))
    .join("|");
  m = x.match(
    new RegExp(`^(?:مادة|المادة)\\s*[:.)\\-\\s]*(${ordinalPattern})`, "i"),
  );
  if (m) return { number: String(ORDINALS[m[1]!]), suffix: null };

  return null;
}

export function buildPdfLines(items: PdfTextItemLike[]): string[] {
  const lines: string[] = [];
  let current: string[] = [];
  let previousY: number | null = null;

  const flush = () => {
    const line = current.join(" ").replace(/\s+/g, " ").trim();
    if (line) lines.push(line);
    current = [];
  };

  for (const item of items) {
    const text = typeof item.str === "string" ? item.str.trim() : "";
    if (!text) continue;
    const y =
      Array.isArray(item.transform) && typeof item.transform[5] === "number"
        ? item.transform[5]!
        : null;
    if (
      current.length &&
      y !== null &&
      previousY !== null &&
      Math.abs(y - previousY) > 2.5
    )
      flush();
    current.push(text);
    previousY = y ?? previousY;
    if (item.hasEOL) flush();
  }
  flush();
  return lines;
}

export async function readPdfPages(file: string): Promise<PdfPage[]> {
  const data = new Uint8Array(await fs.readFile(file));
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages: PdfPage[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const items = content.items as unknown as PdfTextItemLike[];
    const lines = buildPdfLines(items);
    const text = normalizeArabicText(lines.join("\n"));
    pages.push({
      pageNumber: i,
      text,
      lines: text
        .split(/\n/)
        .map((x) => x.trim())
        .filter(Boolean),
    });
  }
  return pages;
}

export function findArticleAnchors(pages: PdfPage[]): ArticleAnchor[] {
  const anchors: ArticleAnchor[] = [];
  for (const page of pages) {
    let ordinal = 0;
    for (let lineIndex = 0; lineIndex < page.lines.length; lineIndex++) {
      const parsed = parseMarker(page.lines[lineIndex]!);
      if (!parsed) continue;
      anchors.push({
        pageNumber: page.pageNumber,
        lineIndex,
        ordinalOnPage: ordinal++,
        rawLabel: page.lines[lineIndex]!,
        articleNumber: parsed.number,
        suffix: parsed.suffix,
      });
    }
  }
  return anchors;
}

export function assignAnchorIdentities(
  anchors: ArticleAnchor[],
  profile: LawProfile,
): Map<number, LawIdentity> {
  const result = new Map<number, LawIdentity>();
  let currentIndex = 0;
  let previous: {
    page: number;
    articleNumber: string;
    occurrence: number;
  } | null = null;
  for (let i = 0; i < anchors.length; i++) {
    const anchor = anchors[i]!;
    const occurrence = anchors
      .slice(0, i + 1)
      .filter(
        (x) =>
          x.pageNumber === anchor.pageNumber &&
          x.articleNumber === anchor.articleNumber,
      ).length;
    while (currentIndex + 1 < profile.identities.length) {
      const next = profile.identities[currentIndex + 1]!;
      const t = next.startAfter;
      if (!t) {
        if (anchor.pageNumber >= next.startPage) currentIndex++;
        else break;
        continue;
      }
      if (anchor.pageNumber > t.page) {
        currentIndex++;
        continue;
      }
      if (anchor.pageNumber < t.page) break;
      if (
        previous &&
        previous.page === t.page &&
        previous.articleNumber === t.articleNumber &&
        previous.occurrence >= (t.occurrenceOnPage ?? 1)
      ) {
        currentIndex++;
        continue;
      }
      break;
    }
    result.set(i, profile.identities[currentIndex]!);
    previous = {
      page: anchor.pageNumber,
      articleNumber: anchor.articleNumber,
      occurrence,
    };
  }
  return result;
}

function articleTextFromAnchors(
  pages: PdfPage[],
  anchor: ArticleAnchor,
  next: ArticleAnchor | undefined,
  maxEndPage: number = pages.length,
): { text: string; endPage: number } {
  const endPage = Math.min(next?.pageNumber ?? maxEndPage, maxEndPage);
  const selected: string[] = [];
  for (const page of pages) {
    if (page.pageNumber < anchor.pageNumber || page.pageNumber > endPage)
      continue;
    const from =
      page.pageNumber === anchor.pageNumber ? anchor.lineIndex + 1 : 0;
    const to =
      next && page.pageNumber === endPage ? next.lineIndex : page.lines.length;
    selected.push(...page.lines.slice(from, to));
  }
  return { text: selected.join("\n").trim(), endPage };
}

function makePdfArticle(
  pages: PdfPage[],
  identity: LawIdentity,
  anchor: ArticleAnchor,
  next: ArticleAnchor | undefined,
  sourceOrder: number,
  recoveryReason: string,
  maxEndPage?: number,
): ParsedArticle | null {
  const { text, endPage } = articleTextFromAnchors(
    pages,
    anchor,
    next,
    maxEndPage,
  );
  if (!text) return null;
  const articleNumber = canonicalArticleNumber(anchor.articleNumber);
  const id = `pdf:${anchor.pageNumber}:${anchor.ordinalOnPage}:${sourceOrder}`;
  return {
    instrumentId: identity.id,
    lawName: identity.lawName,
    lawNumber: identity.lawNumber || null,
    year: identity.year || null,
    articleNumber,
    articleNumberNormalized: /^\d+$/.test(articleNumber)
      ? Number(articleNumber)
      : null,
    articleSuffix: anchor.suffix,
    chapter: null,
    text,
    textForEmbedding: normalizeForEmbedding(text),
    pageStart: anchor.pageNumber,
    pageEnd: endPage,
    pages: Array.from(
      { length: endPage - anchor.pageNumber + 1 },
      (_, k) => anchor.pageNumber + k,
    ),
    sourceOrder,
    source: "pdf_text_recovery",
    sourceRecordIds: [id],
    qwenRecordCount: 0,
    recoveryRecordCount: 1,
    needsReview: true,
    reviewReasons: [recoveryReason],
  };
}

export interface PdfRecoveryResult {
  articles: ParsedArticle[];
  skipped: Array<{
    instrumentId: string;
    articleNumber: string;
    reason: string;
  }>;
}

/**
 * Profile-aware recovery for article numbers missing from the authoritative Qwen stream.
 * Recovery is deliberately conservative: a profile must opt in, the expected article
 * must have exactly one matching PDF anchor when required, and the extracted article
 * text must be non-empty. No recovery is attempted from the PDF text layer for profiles
 * that have disabled PDF recovery (e.g. Financial and the Personal Affairs compilation).
 */
export function recoverMissingArticlesFromPdf(
  pages: PdfPage[],
  profile: LawProfile,
  anchors: ArticleAnchor[],
  existingArticles: ParsedArticle[],
): PdfRecoveryResult {
  const policy = profile.pdfRecovery;
  if (!policy?.enabled) return { articles: [], skipped: [] };

  const anchorIdentities = assignAnchorIdentities(anchors, profile);
  const existing = new Set(
    existingArticles.map((a) => `${a.instrumentId}|${a.articleNumber}`),
  );
  const recovered: ParsedArticle[] = [];
  const skipped: PdfRecoveryResult["skipped"] = [];

  for (const identity of profile.identities) {
    const expected = expectedArticleNumbers(identity);
    for (const number of expected) {
      const articleNumber = String(number);
      const key = `${identity.id}|${articleNumber}`;
      if (existing.has(key)) continue;

      const candidates = anchors
        .map((anchor, index) => ({
          anchor,
          index,
          assigned: anchorIdentities.get(index),
        }))
        .filter(
          (x) =>
            x.assigned?.id === identity.id &&
            canonicalArticleNumber(x.anchor.articleNumber) === articleNumber,
        );

      if (policy.requireUniqueAnchor && candidates.length !== 1) {
        skipped.push({
          instrumentId: identity.id,
          articleNumber,
          reason:
            candidates.length === 0
              ? "No matching PDF article anchor was detected."
              : `Found ${candidates.length} matching PDF anchors; refusing ambiguous recovery.`,
        });
        continue;
      }
      if (!candidates.length) continue;

      const candidate = candidates[0]!;

      const next = anchors.slice(candidate.index + 1).find((anchor, offset) => {
        const index = candidate.index + 1 + offset;
        return (
          anchorIdentities.get(index)?.id === identity.id &&
          anchor.pageNumber <= identity.endPage
        );
      });
      const article = makePdfArticle(
        pages,
        identity,
        candidate.anchor,
        next,
        candidate.index,
        `Profile-aware PDF recovery for missing article ${articleNumber}; verify OCR fidelity before indexing.`,
        identity.endPage,
      );
      if (!article) {
        skipped.push({
          instrumentId: identity.id,
          articleNumber,
          reason:
            "The PDF anchor exists, but the extracted article text is empty.",
        });
        continue;
      }
      article.needsReview = policy.requiresReview;
      recovered.push(article);
      existing.add(key);
    }
  }

  return { articles: recovered, skipped };
}

export function buildArticlesFromPdf(
  pages: PdfPage[],
  profile: LawProfile,
  anchors: ArticleAnchor[],
): ParsedArticle[] {
  const identities = assignAnchorIdentities(anchors, profile);
  const out: ParsedArticle[] = [];
  for (let i = 0; i < anchors.length; i++) {
    const anchor = anchors[i]!;
    const identity = identities.get(i) ?? profile.defaultIdentity;
    const article = makePdfArticle(
      pages,
      identity,
      anchor,
      anchors[i + 1],
      i,
      "PDF-only extraction; verify OCR fidelity before indexing.",
      identity.endPage,
    );
    if (article) out.push(article);
  }
  return out;
}
