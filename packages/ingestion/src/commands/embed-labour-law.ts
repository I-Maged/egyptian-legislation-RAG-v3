import { embedLaw } from "./embed-law";

embedLaw({
  inputPath: "data/canonical/labour-law-14-2025.json",
  outputPath: "data/embeddings/reindex-v3.3.0/labour-law-14-2025.json",
}).catch((error: unknown) => {
  console.error("Failed to embed Labour Law.");
  console.error(error);

  process.exitCode = 1;
});
