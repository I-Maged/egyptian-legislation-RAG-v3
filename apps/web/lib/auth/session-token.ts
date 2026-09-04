import { createHmac, timingSafeEqual } from "node:crypto";

import type { SessionPayload, UserRoleName } from "./types";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function getSecret(): string {
  return process.env.AUTH_SECRET ?? "insecure-dev-secret";
}

function sign(data: string): string {
  return createHmac("sha256", getSecret()).update(data).digest("base64url");
}

export function encodeSessionToken(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");

  return `${data}.${sign(data)}`;
}

export function decodeSessionToken(
  token: string | undefined | null,
): SessionPayload | null {
  if (!token) {
    return null;
  }

  const [data, signature] = token.split(".");

  if (!data || !signature) {
    return null;
  }

  const expectedSignature = sign(data);
  const given = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(data, "base64url").toString("utf8"),
    ) as Partial<SessionPayload>;

    if (
      typeof payload.userId !== "string" ||
      (payload.role !== "USER" && payload.role !== "ADMIN") ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export function createSessionToken(
  userId: string,
  role: UserRoleName,
): string {
  return encodeSessionToken({
    userId,
    role,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  });
}

export { SESSION_TTL_SECONDS };
