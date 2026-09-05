import { describe, expect, it } from "vitest";

import { loadCanonicalCorpora } from "@egyptian-law/ingestion";

import { buildPersonalAffairsLawGoldDataset, personalAffairsLawGoldDraft } from "./personal-affairs-law-gold";

describe("personal affairs retrieval gold dataset", () => {
  it("keeps all 70 questions and resolves them against the current 14-document corpus", async () => {
    const loaded = await loadCanonicalCorpora("data/canonical/personal-affairs");
    const corpora = loaded.corpora.map((entry) => entry.corpus);
    const dataset = buildPersonalAffairsLawGoldDataset(corpora);

    expect(personalAffairsLawGoldDraft).toHaveLength(70);
    expect(dataset.items).toHaveLength(70);
    expect(new Set(dataset.items.map((item) => item.id)).size).toBe(70);
    expect(dataset.items.every((item) => item.relevantChunkIds.length > 0)).toBe(true);
  });
});
