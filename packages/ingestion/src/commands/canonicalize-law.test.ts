import { access, mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join, resolve } from "path";

import { describe, expect, it, afterEach } from "vitest";

import { canonicalizeLaw } from "./canonicalize-law";

const ROOT_DIR = resolve(process.cwd());

describe("canonicalizeLaw", () => {
  let tempDir: string | undefined;

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, {
        recursive: true,
        force: true,
      });

      tempDir = undefined;
    }
  });

  //

  it("rejects an unsupported law", async () => {
    await expect(
      canonicalizeLaw({
        law: "criminal_law",
        inputPath: "does-not-exist.json",
        outputPath: "does-not-exist.json",
      }),
    ).rejects.toThrow(/unsupported law/i);
  });

  it("requires an input path", async () => {
    await expect(
      canonicalizeLaw({
        law: "labour_law",
        inputPath: "",
        outputPath: "output.json",
      }),
    ).rejects.toThrow();
  });

  it("requires an output path", async () => {
    await expect(
      canonicalizeLaw({
        law: "labour_law",
        inputPath: "input.json",
        outputPath: "",
      }),
    ).rejects.toThrow();
  });

  //

  it("canonicalizes the real Labour Law parser output", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "canonicalize-law-"));

    const outputPath = join(tempDir, "labour-law-148-2019.json");

    const inputPath = resolve(ROOT_DIR, "data/raw/labour-v2.3.json");

    await access(inputPath);

    const corpus = await canonicalizeLaw({
      law: "labour_law",
      inputPath,
      outputPath,
    });

    expect(corpus.schema_version).toBe("1.0");

    expect(corpus.document.law_name).toBe("labour_law");

    expect(corpus.document.law_number).toBe("148");

    expect(corpus.document.year).toBe("2019");

    expect(corpus.chunks).toHaveLength(293);

    await access(outputPath);
  });

  it("canonicalizes the real Personal Affairs parser output", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "canonicalize-law-"));

    const outputPath = join(tempDir, "personal-affair-law.json");

    const inputPath = resolve(
      ROOT_DIR,
      "data/raw/personal_affair_law_v2_3.json",
    );

    await access(inputPath);

    const corpus = await canonicalizeLaw({
      law: "personal_affair_law",
      inputPath,
      outputPath,
    });

    expect(corpus.schema_version).toBe("1.0");

    expect(corpus.document.law_name).toBe(corpus.chunks[0]?.law_name);

    expect(corpus.document.law_number).toBe(corpus.chunks[0]?.law_number);

    expect(corpus.document.year).toBe(corpus.chunks[0]?.year);

    /*
     * The V2.3 Personal Affairs parser output currently
     * contains 92 top-level article records.
     *
     * Our canonicalizer should preserve those records.
     */
    expect(corpus.chunks).toHaveLength(92);

    for (const chunk of corpus.chunks) {
      expect(chunk.document_id).toBe(corpus.document.id);

      expect(chunk.text.length).toBeGreaterThan(0);

      expect(chunk.text_for_embedding.length).toBeGreaterThan(0);

      expect(chunk.provenance.source_file).toBe("personal_affair_law.pdf");
    }

    await access(outputPath);
  });

  it("canonicalizes the real Financial Law parser output", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "canonicalize-law-"));

    const outputPath = join(tempDir, "financial-law-18-2019.json");

    const inputPath = resolve(ROOT_DIR, "data/raw/financial_law_v2_3.json");

    await access(inputPath);

    const corpus = await canonicalizeLaw({
      law: "financial_law",
      inputPath,
      outputPath,
    });

    expect(corpus.schema_version).toBe("1.0");

    expect(corpus.document.law_name).toBe("financial_law");

    expect(corpus.document.law_number).toBe("18");

    expect(corpus.document.year).toBe("2019");

    expect(corpus.chunks).toHaveLength(75);

    for (const chunk of corpus.chunks) {
      expect(chunk.document_id).toBe(corpus.document.id);

      expect(chunk.text.trim().length).toBeGreaterThan(0);

      expect(chunk.text_for_embedding.trim().length).toBeGreaterThan(0);

      expect(chunk.provenance.source_file).toBe("financial_law.pdf");
    }

    await access(outputPath);
  });
});
