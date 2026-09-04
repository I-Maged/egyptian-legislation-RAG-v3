import { describe, expect, it } from "vitest";

import { canonicalizers, isSupportedLaw } from "./registry";

describe("canonicalizer registry", () => {
  it("registers all currently supported laws", () => {
    expect(canonicalizers.labour_law).toBeTypeOf("function");
    expect(canonicalizers.personal_affair_law).toBeTypeOf("function");
  });

  it("recognizes supported laws", () => {
    expect(isSupportedLaw("labour_law")).toBe(true);
    expect(isSupportedLaw("personal_affair_law")).toBe(true);
  });

  it("rejects unsupported laws", () => {
    expect(isSupportedLaw("criminal_law")).toBe(false);
    expect(isSupportedLaw("unknown_law")).toBe(false);
  });
});
