import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "./password";

describe("hashPassword / verifyPassword", () => {
  it("produces a salted hash that verifies against the original password", async () => {
    const hash = await hashPassword("s3cret-password");

    expect(hash).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
    await expect(verifyPassword("s3cret-password", hash)).resolves.toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("correct-password");

    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("generates a unique salt per call", async () => {
    const first = await hashPassword("same-password");
    const second = await hashPassword("same-password");

    expect(first).not.toEqual(second);
    await expect(verifyPassword("same-password", second)).resolves.toBe(true);
  });

  it("returns false for malformed stored hashes instead of throwing", async () => {
    await expect(verifyPassword("password", "not-a-valid-hash")).resolves.toBe(
      false,
    );
  });
});
