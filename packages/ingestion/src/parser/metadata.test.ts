import { describe, expect, it } from "vitest";
import {
  FINANCIAL_PROFILE,
  LABOUR_PROFILE,
  PERSONAL_PROFILE,
} from "./profiles";

describe("authoritative corpus identities", () => {
  it("uses Labour Law 14/2025", () => {
    expect(LABOUR_PROFILE.defaultIdentity.lawNumber).toBe("14");
    expect(LABOUR_PROFILE.defaultIdentity.year).toBe("2025");
  });
  it("uses Unified Public Finance Law 6/2022", () => {
    expect(FINANCIAL_PROFILE.defaultIdentity.lawNumber).toBe("6");
    expect(FINANCIAL_PROFILE.defaultIdentity.year).toBe("2022");
  });
  it("models the personal-affairs PDF as a multi-instrument compilation", () => {
    expect(PERSONAL_PROFILE.identities.length).toBeGreaterThan(1);
    expect(PERSONAL_PROFILE.identities[0]!.lawNumber).toBe("25");
    expect(PERSONAL_PROFILE.identities[0]!.year).toBe("1920");
    expect(PERSONAL_PROFILE.identities.at(-1)!.lawNumber).toBe("1090");
  });
});
