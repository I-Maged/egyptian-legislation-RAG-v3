import { describe, expect, it } from "vitest";
import { buildPdfLines, findArticleAnchors } from "./pdf";

describe("PDF article marker parsing", () => {
  it("normalizes Arabic presentation forms and digits", () => {
    const anchors = findArticleAnchors([
      {
        pageNumber: 1,
        text: "مادة ): (١\nالنص",
        lines: ["مادة ): (١", "النص"],
      },
    ]);
    expect(anchors).toHaveLength(1);
    expect(anchors[0]!.articleNumber).toBe("1");
  });

  it("recognizes article markers extracted from Arabic presentation forms", () => {
    const anchors = findArticleAnchors([
      { pageNumber: 1, text: "", lines: ["ﻣﺎﺩﺓ)١(", "النص"] },
    ]);
    expect(anchors).toHaveLength(1);
    expect(anchors[0]!.articleNumber).toBe("1");
  });

  it("recognizes Arabic ordinal article labels", () => {
    const anchors = findArticleAnchors([
      { pageNumber: 1, text: "", lines: ["المادة الثالثة"] },
    ]);
    expect(anchors).toHaveLength(1);
    expect(anchors[0]!.articleNumber).toBe("3");
  });

  it("reconstructs PDF.js text items using hasEOL instead of one newline per item", () => {
    const lines = buildPdfLines([
      { str: "ﻣﺎﺩﺓ", hasEOL: false },
      { str: ")١(", hasEOL: true },
      { str: "نص المادة", hasEOL: true },
    ]);
    expect(lines).toEqual(["ﻣﺎﺩﺓ )١(", "نص المادة"]);
    expect(
      findArticleAnchors([{ pageNumber: 6, text: lines.join("\n"), lines }]),
    ).toHaveLength(1);
  });
});
