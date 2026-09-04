import fs from "node:fs";
import path from "node:path";
import {
  buildArticlesFromPdf,
  findArticleAnchors,
  readPdfPages,
  recoverMissingArticlesFromPdf,
} from "./pdf.js";
import { getProfile } from "./profiles.js";
import {
  buildArticlesFromQwen,
  mergeRecoveryRecords,
  parseInputFile,
  parseRecoveryFile,
  readLegacyParserOutput,
  reassignIdentities,
} from "./qwen.js";
import { validateArticles } from "./validate.js";
import type { ParsedArticle, ParserOutput, ValidationIssue } from "./types.js";

interface Args {
  pdf: string;
  qwen?: string | undefined;
  recovery?: string | undefined;
  output: string;
  profile?: string | undefined;
  splitOutputDir?: string | undefined;
  legacyRaw: boolean;
}

function parseArgs(argv: string[]): Args {
  const get = (name: string): string | undefined => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const has = (name: string): boolean => argv.includes(name);
  const pdf = get("--pdf");
  const output = get("--output");
  if (!pdf || !output)
    throw new Error(
      "Usage: tsx src/parser/index.ts --pdf <pdf> --output <json> [--qwen <qwen-json>] [--recovery <recovery-json>] [--profile labour|financial|personal] [--split-output-dir <dir>] [--legacy-raw]",
    );
  return {
    pdf: path.resolve(pdf),
    qwen: get("--qwen") ? path.resolve(get("--qwen")!) : undefined,
    recovery: get("--recovery") ? path.resolve(get("--recovery")!) : undefined,
    output: path.resolve(output),
    profile: get("--profile"),
    splitOutputDir: get("--split-output-dir")
      ? path.resolve(get("--split-output-dir")!)
      : undefined,
    legacyRaw: has("--legacy-raw"),
  };
}

function addIssue(issues: ValidationIssue[], issue: ValidationIssue) {
  issues.push(issue);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(args.pdf)) throw new Error(`PDF not found: ${args.pdf}`);
  if (args.recovery && !args.qwen)
    throw new Error(
      "--recovery requires --qwen; recovery records supplement the Qwen stream.",
    );

  const profile = getProfile(args.pdf, args.profile);
  const pages = await readPdfPages(args.pdf);
  const anchors = findArticleAnchors(pages);

  let articles: ParsedArticle[] = [];
  let originalCount = 0;
  let recoveryCount = 0;
  let inputKind: "qwen" | "legacy-adapted" | "legacy-raw" | "pdf-only" =
    "pdf-only";
  const extraIssues: ValidationIssue[] = [];
  let pdfRecoveryCount = 0;

  if (args.qwen) {
    if (!fs.existsSync(args.qwen))
      throw new Error(`Qwen JSON not found: ${args.qwen}`);

    if (args.legacyRaw) {
      articles = readLegacyParserOutput(args.qwen, profile);
      originalCount = articles.length;
      inputKind = "legacy-raw";
      addIssue(extraIssues, {
        severity: "error",
        code: "LEGACY_INPUT",
        message:
          "Legacy Parser V2/V2.3 output was imported explicitly. Article boundaries were already produced by the old parser and cannot be reconstructed from this file; use the original Qwen record JSON for the authoritative V3 run.",
      });
    } else {
      const parsed = parseInputFile(args.qwen, profile);
      originalCount = parsed.originalCount;
      inputKind = parsed.kind === "legacy-adapted" ? "legacy-adapted" : "qwen";

      if (parsed.articles) {
        articles = parsed.articles;
        addIssue(extraIssues, {
          severity: "warning",
          code: "LEGACY_INPUT_ADAPTED",
          message:
            "Parser V2/V2.3 output was detected and safely adapted because this profile has a single instrument with unique, ordered article numbers. Article text was preserved; no article-boundary reconstruction was attempted.",
        });

        if (args.recovery) {
          if (!fs.existsSync(args.recovery))
            throw new Error(`Recovery JSON not found: ${args.recovery}`);
          const recovery = parseRecoveryFile(
            args.recovery,
            parsed.originalCount,
          );
          recoveryCount = recovery.length;
          const identities = reassignIdentities(recovery, profile);
          const recoveredArticles = buildArticlesFromQwen(
            recovery,
            profile,
            identities,
          );
          const existingKeys = new Set(
            articles.map((a) => `${a.instrumentId}|${a.articleNumber}`),
          );
          const newArticles = recoveredArticles.filter(
            (a) => !existingKeys.has(`${a.instrumentId}|${a.articleNumber}`),
          );
          articles = [...articles, ...newArticles].sort(
            (a, b) =>
              a.pageStart - b.pageStart || a.sourceOrder - b.sourceOrder,
          );
          addIssue(extraIssues, {
            severity: "warning",
            code: "LEGACY_RECOVERY_ADDED",
            message: `Added ${newArticles.length} article(s) from the explicit recovery OCR stream to the safely adapted legacy corpus.`,
          });
        }
      } else {
        let records = parsed.records;

        if (args.recovery) {
          if (!fs.existsSync(args.recovery))
            throw new Error(`Recovery JSON not found: ${args.recovery}`);
          const recovery = parseRecoveryFile(args.recovery, records.length);
          recoveryCount = recovery.length;
          records = mergeRecoveryRecords(records, recovery);
        }

        const identities = reassignIdentities(records, profile);
        articles = buildArticlesFromQwen(records, profile, identities);

        const pdfRecovery = recoverMissingArticlesFromPdf(
          pages,
          profile,
          anchors,
          articles,
        );
        pdfRecoveryCount = pdfRecovery.articles.length;
        if (pdfRecovery.articles.length) {
          articles = [...articles, ...pdfRecovery.articles].sort(
            (a, b) =>
              a.pageStart - b.pageStart || a.sourceOrder - b.sourceOrder,
          );
          addIssue(extraIssues, {
            severity: "warning",
            code: "PDF_ARTICLES_RECOVERED",
            message: `Recovered ${pdfRecovery.articles.length} missing article(s) from the PDF text layer using the ${profile.id} recovery policy. Each recovered article is marked for review before indexing.`,
          });
        }
        for (const skipped of pdfRecovery.skipped) {
          addIssue(extraIssues, {
            severity: "info",
            code: "PDF_RECOVERY_SKIPPED",
            message: `PDF recovery skipped ${skipped.instrumentId} Article ${skipped.articleNumber}: ${skipped.reason}`,
            articleNumber: skipped.articleNumber,
            instrumentId: skipped.instrumentId,
          });
        }
      }
    }
  } else {
    articles = buildArticlesFromPdf(pages, profile, anchors);
  }

  const issues = [
    ...extraIssues,
    ...validateArticles(articles, profile.identities, anchors),
  ];
  const missing = issues.filter((x) => x.code === "MISSING_ARTICLES");
  const result: ParserOutput = {
    metadata: {
      parserVersion: "3.3.0",
      inputFile: args.qwen ? path.basename(args.qwen) : null,
      pdfFile: path.basename(args.pdf),
      generatedAt: new Date().toISOString(),
      recordCountOriginal: originalCount,
      recordCountRecovery: recoveryCount,
      recordCountMerged: originalCount + recoveryCount,
      pdfRecoveryArticleCount: pdfRecoveryCount,
      instrumentId:
        profile.identities.length === 1 ? profile.identities[0]!.id : null,
      mode: args.qwen ? "qwen+pdf" : "pdf-only",
    },
    metadataResolved:
      profile.identities.length === 1
        ? {
            lawName: profile.identities[0]!.lawName,
            lawNumber: profile.identities[0]!.lawNumber,
            year: profile.identities[0]!.year,
          }
        : { lawName: null, lawNumber: null, year: null },
    instruments: profile.identities,
    articles,
    coverage: {
      pdfPageCount: pages.length,
      articleAnchorCount: anchors.length,
      qwenRecordCount: originalCount,
      pdfOnlyArticleCount: args.qwen ? 0 : articles.length,
      pdfRecoveredArticleCount: pdfRecoveryCount,
      missingArticleNumbers: missing.map((x) => ({
        instrumentId: x.instrumentId!,
        articleNumbers: x.message
          .replace(/^Missing expected article numbers: /, "")
          .split(", "),
      })),
      suspiciousArticleCount: articles.filter((a) => a.needsReview).length,
    },
    validation: {
      issues,
      summary: {
        errors: issues.filter((x) => x.severity === "error").length,
        warnings: issues.filter((x) => x.severity === "warning").length,
        infos: issues.filter((x) => x.severity === "info").length,
        articleCount: articles.length,
        qwenRecordCount: originalCount,
        recoveryRecordCount: recoveryCount,
        suspiciousMergeCount: articles.filter((a) =>
          a.reviewReasons.some((r) => r.startsWith("Non-contiguous")),
        ).length,
        missingArticleNumberCount: missing.reduce(
          (n, x) => n + x.message.split(", ").length,
          0,
        ),
      },
    },
  };

  if (anchors.length === 0 && args.qwen) {
    // Already emitted by validateArticles. Keep this branch intentionally empty:
    // Qwen-first mode must remain usable when the PDF text layer is structurally poor.
  }

  fs.mkdirSync(path.dirname(args.output), { recursive: true });
  fs.writeFileSync(args.output, JSON.stringify(result, null, 2), "utf8");

  if (args.splitOutputDir && profile.identities.length > 1) {
    fs.mkdirSync(args.splitOutputDir, { recursive: true });
    for (const identity of profile.identities) {
      const subset: ParserOutput = {
        ...result,
        metadataResolved: {
          lawName: identity.lawName,
          lawNumber: identity.lawNumber,
          year: identity.year,
        },
        metadata: { ...result.metadata, instrumentId: identity.id },
        instruments: [identity],
        articles: result.articles.filter((a) => a.instrumentId === identity.id),
        coverage: {
          ...result.coverage,
          missingArticleNumbers: result.coverage.missingArticleNumbers.filter(
            (x) => x.instrumentId === identity.id,
          ),
        },
        validation: {
          ...result.validation,
          issues: result.validation.issues.filter(
            (x) => !x.instrumentId || x.instrumentId === identity.id,
          ),
        },
      };
      fs.writeFileSync(
        path.join(args.splitOutputDir, `${identity.id}.json`),
        JSON.stringify(subset, null, 2),
        "utf8",
      );
    }
  }

  console.log(
    `Parser V3\nProfile: ${profile.displayName}\nInput mode: ${inputKind}\nPDF pages: ${pages.length}\nPDF article anchors: ${anchors.length}\nQwen records: ${originalCount}\nRecovery records: ${recoveryCount}\nPDF recovered articles: ${pdfRecoveryCount}\nArticles: ${articles.length}\nErrors: ${result.validation.summary.errors}\nWarnings: ${result.validation.summary.warnings}\nOutput: ${args.output}`,
  );
  for (const x of result.coverage.missingArticleNumbers)
    console.log(`Missing [${x.instrumentId}]: ${x.articleNumbers.join(", ")}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
