import { canonicalizeLaw } from "./canonicalize-law";

async function main(): Promise<void> {
  const [, , law, inputPath, outputPath] = process.argv;

  if (!law || !inputPath || !outputPath) {
    throw new Error(
      "Usage: tsx src/commands/canonicalize.ts <law> <inputPath> <outputPath>",
    );
  }

  console.log(`Law: ${law}`);
  console.log(`Input: ${inputPath}`);
  console.log(`Output: ${outputPath}`);

  const corpus = await canonicalizeLaw({
    law,
    inputPath,
    outputPath,
  });

  console.log("");
  console.log("Canonicalization complete.");
  console.log(`Law: ${corpus.document.law_name}`);
  console.log(`Law number: ${corpus.document.law_number}`);
  console.log(`Year: ${corpus.document.year}`);
  console.log(`Chunks: ${corpus.chunks.length}`);
  console.log(`Output: ${outputPath}`);
}

main().catch((error: unknown) => {
  console.error("Canonicalization failed.");
  console.error(error);
  process.exitCode = 1;
});
