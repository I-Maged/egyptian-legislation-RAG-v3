import { readFile } from "fs/promises";
import {
  type FinancialLawParserArticle,
  canonicalizeFinancialLaw,
} from "../canonical/financial-law";

import {
  type ParserV23LawChunk,
  canonicalizeLabourLaw,
} from "../canonical/labour-law";

import {
  type PersonalAffairsParserOutput,
  canonicalizePersonalAffairsLaw,
} from "../canonical/personal-affairs";

import { writeCanonicalCorpusJson } from "../corpus/write-json";

import { canonicalizers, isSupportedLaw } from "../canonical/registry";

import type { CanonicalCorpus } from "../canonical/types";

export type CanonicalizeLawRequest = {
  law: string;
  inputPath: string;
  outputPath: string;
};

export async function canonicalizeLaw(
  request: CanonicalizeLawRequest,
): Promise<CanonicalCorpus> {
  if (!request.law.trim()) {
    throw new Error("Law is required.");
  }

  if (!request.inputPath.trim()) {
    throw new Error("Input path is required.");
  }

  if (!request.outputPath.trim()) {
    throw new Error("Output path is required.");
  }

  if (!isSupportedLaw(request.law)) {
    throw new Error(`Unsupported law: ${request.law}`);
  }

  const json = await readFile(request.inputPath, "utf8");

  const parsed = JSON.parse(json) as unknown;

  switch (request.law) {
    case "labour_law": {
      const parserOutput = parsed as {
        articles?: ParserV23LawChunk[];
      };

      if (!Array.isArray(parserOutput.articles)) {
        throw new Error("Labour parser output must contain an articles array.");
      }

      if (parserOutput.articles.length === 0) {
        throw new Error("Labour parser output contains no articles.");
      }

      const corpus = canonicalizeLabourLaw(parserOutput.articles, {
        source_file: "labour-v2.3.pdf",
        parser_version: "parser-v2.3",
        normalization_version: "parser-v2.3",
      });

      await writeCanonicalCorpusJson(request.outputPath, corpus);

      return corpus;
    }

    case "personal_affair_law": {
      const parserOutput = parsed as PersonalAffairsParserOutput;

      if (
        !parserOutput.metadataResolved ||
        !Array.isArray(parserOutput.articles)
      ) {
        throw new Error(
          "Personal Affairs parser output must contain metadataResolved and an articles array.",
        );
      }

      if (parserOutput.articles.length === 0) {
        throw new Error("Personal Affairs parser output contains no articles.");
      }

      const corpus = canonicalizePersonalAffairsLaw(parserOutput);

      await writeCanonicalCorpusJson(request.outputPath, corpus);

      return corpus;
    }

    case "financial_law": {
      const parserOutput = parsed as {
        articles?: FinancialLawParserArticle[];
      };

      if (!Array.isArray(parserOutput.articles)) {
        throw new Error(
          "Financial Law parser output must contain an articles array.",
        );
      }

      if (parserOutput.articles.length === 0) {
        throw new Error("Financial Law parser output contains no articles.");
      }

      const corpus = canonicalizeFinancialLaw(parserOutput.articles);

      await writeCanonicalCorpusJson(request.outputPath, corpus);

      return corpus;
    }

    default: {
      const exhaustiveCheck: never = request.law;
      throw new Error(`Unsupported law: ${exhaustiveCheck}`);
    }
  }
}
