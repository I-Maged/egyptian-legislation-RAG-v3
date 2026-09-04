import { describe, expect, it } from "vitest";

import {
  createSessionToken,
  decodeSessionToken,
  encodeSessionToken,
} from "./session-token";

const futureExp = Math.floor(Date.now() / 1000) + 60;
const pastExp = Math.floor(Date.now() / 1000) - 60;

describe("createSessionToken / decodeSessionToken", () => {
  it("round-trips userId and role", () => {
    const token = createSessionToken("user-1", "ADMIN");
    const payload = decodeSessionToken(token);

    expect(payload).toEqual({
      userId: "user-1",
      role: "ADMIN",
      exp: expect.any(Number),
    });
    expect(payload!.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it("returns null for missing or malformed tokens", () => {
    expect(decodeSessionToken(null)).toBeNull();
    expect(decodeSessionToken(undefined)).toBeNull();
    expect(decodeSessionToken("")).toBeNull();
    expect(decodeSessionToken("not-a-token")).toBeNull();
    expect(decodeSessionToken("abc.def.ghi")).toBeNull();
  });

  it("rejects tokens with an invalid signature", () => {
    const token = createSessionToken("user-1", "USER");
    const [data] = token.split(".");
    const forged = `${data}.kQm8Zz1InvalidSignatureValueHere`;

    expect(decodeSessionToken(forged)).toBeNull();
  });

  it("rejects tokens whose payload was modified", () => {
    const token = createSessionToken("user-1", "USER");
    const [, signature] = token.split(".");
    const otherPayload = Buffer.from(
      JSON.stringify({ userId: "attacker", role: "ADMIN", exp: futureExp }),
    ).toString("base64url");

    expect(decodeSessionToken(`${otherPayload}.${signature}`)).toBeNull();
  });

  it("rejects expired tokens", () => {
    const expired = encodeSessionToken({
      userId: "user-1",
      role: "USER",
      exp: pastExp,
    });

    expect(decodeSessionToken(expired)).toBeNull();
  });

  it("rejects payloads with invalid field values", () => {
    const badRole = encodeSessionToken({
      userId: "user-1",
      role: "SUPERADMIN" as never,
      exp: futureExp,
    });

    expect(decodeSessionToken(badRole)).toBeNull();
  });
});
