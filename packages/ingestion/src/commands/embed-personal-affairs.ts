import { reindexCanonicalCorpus } from "./reindex";

reindexCanonicalCorpus({
  canonicalDirectory: "data/canonical/personal-affairs",
  outputDirectory: "data/embeddings/reindex-v3.3.0/personal-affairs",
}).catch((error: unknown) => {
  console.error("Failed to embed Personal Affairs corpora.");
  console.error(error);

  process.exitCode = 1;
});
