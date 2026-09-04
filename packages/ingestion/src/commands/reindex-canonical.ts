import { reindexCanonicalCorpus } from "./reindex";

reindexCanonicalCorpus().catch((error: unknown) => {
  console.error("Phase 2 re-index failed.");
  console.error(error);
  process.exitCode = 1;
});
