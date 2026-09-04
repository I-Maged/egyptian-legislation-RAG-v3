import { checkEmbeddingIntegrity } from "./embedding-integrity";

checkEmbeddingIntegrity({
  corpusPath: "data/canonical/labour-law-14-2025.json",

  embeddingPath: "data/embeddings/labour-law-14-2025.json",
}).catch((error: unknown) => {
  console.error("Labour Law embedding integrity check failed.");

  console.error(error);

  process.exitCode = 1;
});
