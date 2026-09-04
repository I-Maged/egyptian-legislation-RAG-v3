import { embedLaw } from "./embed-law";

embedLaw({
  inputPath: "data/canonical/financial-law-6-2022.json",
  outputPath: "data/embeddings/reindex-v3.3.0/financial-law-6-2022.json",
}).catch((error: unknown) => {
  console.error("Failed to embed Financial Law.");
  console.error(error);

  process.exitCode = 1;
});
